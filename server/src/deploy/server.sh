#!/usr/bin/env bash

set -Eeuo pipefail

# =====================================================================
# Deployment script for express / nest / next apps
#
# Steps:
#   1.  Validate parameters
#   2.  Check app exists (clone or pull in /var/www/)
#   3.  Navigate to main dir (auto-detected, or --sub_dir override)
#   4.  Write / update .env file
#   5.  Install dependencies
#   6.  Build the app (only if next.js or TypeScript detected)
#   7.  Run/restart as a PM2 service (+ pm2 startup + pm2 save)
#   8.  Configure Nginx reverse proxy
#   9.  Create/validate Cloudflare DNS record + wait for propagation
#   10. Issue SSL certificate (certbot)
#   11. Health check
# =====================================================================

while [[ $# -gt 0 ]]; do
    case "$1" in
        --project)   PROJECT_NAME="$2"; shift 2 ;;
        --git_url)   REPO_URL="$2";     shift 2 ;;
        --branch)    BRANCH="$2";       shift 2 ;;
        --type)      APP_TYPE="$2";     shift 2 ;;
        --port)      PORT="$2";         shift 2 ;;
        --sub_dir)   SUB_DIR="$2";      shift 2 ;;
        --env)       ENV_VARS="$2";     shift 2 ;;
        --run_cmd)   RUN_CMD="$2";      shift 2 ;;
        --run_script) RUN_CMD="$2";     shift 2 ;;   # alias for --run_cmd
        --domain)    DOMAIN="$2";       shift 2 ;;
        --cf_zone_id) CF_ZONE_ID="$2";  shift 2 ;;
        --cf_token)  CF_API_TOKEN="$2"; shift 2 ;;
        --host_ip)   EC2_HOST_IP="$2";  shift 2 ;;
        --email)     EMAIL="$2";        shift 2 ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

RUN_CMD=${RUN_CMD:-"npm run start"}
EMAIL=${EMAIL:-"ahmedjaafarbadri@gmail.com"}
ENV_VARS=${ENV_VARS:-""}

CURRENT_STEP="Initialization"

output_json() {
    local status=$1
    local message=$2
    local http_code=${3:-0}
    echo -e "\n------------------------------------------"
    echo -e "📊 SERVER DEPLOYMENT REPORT"
    echo -e "------------------------------------------"
    jq -n \
        --arg project "${PROJECT_NAME:-}" \
        --arg status "$status" \
        --arg url "https://${FULL_DOMAIN:-}" \
        --arg port "${PORT:-}" \
        --arg pm2_name "${PM2_NAME:-}" \
        --argjson status_code "$http_code" \
        --arg error_step "$CURRENT_STEP" \
        --arg message "$message" \
        '{project: $project, status: $status, url: $url, port: $port, pm2_name: $pm2_name, status_code: $status_code, error_step: $error_step, message: $message}'
    exit $([ "$status" == "success" ] && echo 0 || echo 1)
}

error_handler() {
    echo -e "\n❌ [ERROR] Failed at step: $CURRENT_STEP"
    if [ "$CURRENT_STEP" == "PM2 Deployment" ] && [ -n "${PM2_NAME:-}" ]; then
        pm2 logs "$PM2_NAME" --lines 10 --nostream || true
    fi
    output_json "error" "Command failed: $BASH_COMMAND" 500
}
trap 'error_handler' ERR

# ---------------------------------------------------------------------
# STEP 1: Validate parameters
# ---------------------------------------------------------------------
CURRENT_STEP="Parameter Validation"
echo -e "🔎 [1/11] Validating input parameters..."

REQUIRED_VARS=(PROJECT_NAME REPO_URL BRANCH APP_TYPE PORT DOMAIN CF_ZONE_ID CF_API_TOKEN EC2_HOST_IP)
MISSING_VARS=()
for v in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!v:-}" ]; then
        MISSING_VARS+=("--$(echo "$v" | tr '[:upper:]' '[:lower:]')")
    fi
done
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "❌ Missing required parameters: ${MISSING_VARS[*]}"
    output_json "error" "Missing required parameters: ${MISSING_VARS[*]}" 400
fi

# App type normalization + naming convention
#   express / nest -> backend API -> api.[project].[domain]
#   next           -> full app    -> [project].[domain]
APP_TYPE_NORMALIZED=$(echo "$APP_TYPE" | tr '[:upper:]' '[:lower:]' | xargs)

case "$APP_TYPE_NORMALIZED" in
    express|nest)
if [ "$APP_TYPE" == "express" ] || [ "$APP_TYPE" == "nest" ]; then
  FULL_DOMAIN="api.${PROJECT_NAME}.${DOMAIN}"
  PM2_NAME="api.${PROJECT_NAME}"
else
  FULL_DOMAIN="${PROJECT_NAME}.${DOMAIN}"
  PM2_NAME="${PROJECT_NAME}"
fi
        ;;
    next)
        FULL_DOMAIN="${PROJECT_NAME}.${DOMAIN}"
        PM2_NAME="${PROJECT_NAME}"
        ;;
    *)
        echo -e "❌ Unrecognized --type '${APP_TYPE}'. Must be one of: express, nest, next."
        output_json "error" "Unrecognized --type '${APP_TYPE}'" 400
        ;;
esac

echo -e "   ✅ Deploying '$PROJECT_NAME' (type: $APP_TYPE_NORMALIZED) → https://$FULL_DOMAIN (pm2: $PM2_NAME, port: $PORT)"

# ---------------------------------------------------------------------
# STEP 2: Check app exists — clone or pull in /var/www/
# ---------------------------------------------------------------------
CURRENT_STEP="Git Operations"
echo -e "📦 [2/11] Managing repository in /var/www/$PROJECT_NAME..."
cd /var/www/ || exit 1
if [ -d "$PROJECT_NAME/.git" ]; then
    echo -e "   🔄 Repo exists, pulling latest '$BRANCH'..."
    cd "$PROJECT_NAME"
    git fetch origin "$BRANCH" > /dev/null 2>&1
    git checkout "$BRANCH" > /dev/null 2>&1
    git pull origin "$BRANCH" > /dev/null 2>&1
else
    echo -e "   🆕 Cloning repository..."
    rm -rf "$PROJECT_NAME"
    git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_NAME" > /dev/null 2>&1
    cd "$PROJECT_NAME"
fi
PROJECT_ROOT="/var/www/$PROJECT_NAME"

# ---------------------------------------------------------------------
# STEP 3: Navigate to the main app dir
#   If --sub_dir was passed explicitly, use it as-is.
#   Otherwise auto-detect the first candidate dir containing package.json.
# ---------------------------------------------------------------------
CURRENT_STEP="Directory Navigation"
echo -e "📂 [3/11] Locating application directory..."

if [ -n "${SUB_DIR:-}" ]; then
    APP_DIR="$PROJECT_ROOT/$SUB_DIR"
    if [ ! -f "$APP_DIR/package.json" ]; then
        echo -e "❌ No package.json found in provided --sub_dir '$SUB_DIR'."
        output_json "error" "No package.json found in --sub_dir '$SUB_DIR'" 400
    fi
else
    CANDIDATES=("." "app/server" "server" "api" "backend" "app" "src")
    APP_DIR=""
    for c in "${CANDIDATES[@]}"; do
        if [ -f "$PROJECT_ROOT/$c/package.json" ]; then
            APP_DIR="$PROJECT_ROOT/$c"
            SUB_DIR="$c"
            break
        fi
    done
    if [ -z "$APP_DIR" ]; then
        echo -e "❌ Could not auto-detect an app directory containing package.json."
        output_json "error" "Could not auto-detect app directory (no package.json found)" 400
    fi
fi

echo -e "   ✅ Using app directory: $APP_DIR (sub_dir: ${SUB_DIR:-.})"
cd "$APP_DIR" || output_json "error" "Failed to cd into $APP_DIR" 500

# ---------------------------------------------------------------------
# STEP 4: Write / update the .env file (merge, don't clobber)
# ---------------------------------------------------------------------
CURRENT_STEP="Environment Configuration"
echo -e "📝 [4/11] Writing/updating .env file..."

declare -A ENV_MAP
if [ -f ".env" ]; then
    while IFS='=' read -r key value; do
        [[ -z "$key" || "$key" == \#* ]] && continue
        ENV_MAP["$key"]="$value"
    done < ".env"
fi

# Always enforce PORT
ENV_MAP["PORT"]="$PORT"

# Apply/override with any --env "KEY=VALUE" lines (newline separated)
if [ -n "$ENV_VARS" ]; then
    while IFS= read -r line; do
        [[ -z "$line" || "$line" == \#* ]] && continue
        key="${line%%=*}"
        value="${line#*=}"
        ENV_MAP["$key"]="$value"
    done <<< "$(echo -e "$ENV_VARS")"
fi

{
    for key in "${!ENV_MAP[@]}"; do
        echo "${key}=${ENV_MAP[$key]}"
    done
} > .env

echo -e "   ✅ .env written with ${#ENV_MAP[@]} keys."

# ---------------------------------------------------------------------
# STEP 5: Install dependencies
# ---------------------------------------------------------------------
CURRENT_STEP="Dependency Installation"
echo -e "📦 [5/11] Installing dependencies..."
if [ -f "pnpm-lock.yaml" ]; then PKG="pnpm";
elif [ -f "yarn.lock" ]; then PKG="yarn";
else PKG="npm"; fi
$PKG install > /dev/null 2>&1

# ---------------------------------------------------------------------
# STEP 6: Build the app — only when needed
#   - always for Next.js apps
#   - for TypeScript apps (tsconfig.json present)
#   - skipped for plain JS express/nest apps
# ---------------------------------------------------------------------
CURRENT_STEP="Build Process"
IS_TYPESCRIPT=false
[ -f "tsconfig.json" ] && IS_TYPESCRIPT=true

if [ "$APP_TYPE_NORMALIZED" == "next" ] || [ "$IS_TYPESCRIPT" == true ]; then
    echo -e "🏗️  [6/11] Building $APP_TYPE_NORMALIZED application (typescript: $IS_TYPESCRIPT)..."
    export NODE_OPTIONS="--max-old-space-size=2048"
    if ! $PKG run build > build_log.txt 2>&1; then
        echo -e "❌ Build failed. Check build_log.txt for details."
        cat build_log.txt
        exit 1
    fi
else
    echo -e "⏭️  [6/11] Skipping build step (plain JS app, no build required)."
fi

# ---------------------------------------------------------------------
# STEP 7: Run/restart as a PM2 service
# ---------------------------------------------------------------------
CURRENT_STEP="PM2 Deployment"
echo -e "♻️  [7/11] Starting/Restarting with PM2 as '$PM2_NAME'..."

if [ "$APP_TYPE_NORMALIZED" == "next" ]; then
    FINAL_RUN_CMD="$RUN_CMD -- -p $PORT"
else
    FINAL_RUN_CMD="$RUN_CMD"
fi

if pm2 show "$PM2_NAME" > /dev/null 2>&1; then
    echo -e "   🔄 Restarting existing process $PM2_NAME..."
    pm2 restart "$PM2_NAME" --update-env > /dev/null 2>&1
else
    echo -e "   ✨ Starting new process $PM2_NAME on port $PORT..."
    pm2 start "$FINAL_RUN_CMD" --name "$PM2_NAME" > /dev/null 2>&1
fi

# Ensure PM2 resurrects processes on server reboot (best-effort, non-fatal)
pm2 startup > /dev/null 2>&1 || true
pm2 save > /dev/null 2>&1

# ---------------------------------------------------------------------
# STEP 8: Configure Nginx reverse proxy
# ---------------------------------------------------------------------
CURRENT_STEP="Nginx Proxy Configuration"
echo -e "⚙️  [8/11] Configuring Nginx Reverse Proxy ($FULL_DOMAIN → localhost:$PORT)..."
NGINX_CONF="/etc/nginx/sites-available/$FULL_DOMAIN"
cat <<EOF | sudo tee "$NGINX_CONF" > /dev/null
server {
    listen 80;
    server_name $FULL_DOMAIN;
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 600;
        proxy_send_timeout 600;
        gzip off;
    }
}
EOF
sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$FULL_DOMAIN"
sudo nginx -t > /dev/null 2>&1 && sudo systemctl reload nginx

# ---------------------------------------------------------------------
# STEP 9: Create/validate Cloudflare DNS record + wait for propagation
# ---------------------------------------------------------------------
CURRENT_STEP="DNS Check/Creation"
echo -e "☁️  [9/11] Validating Cloudflare DNS for $FULL_DOMAIN..."

RESPONSE=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=A&name=$FULL_DOMAIN" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json")

if [ "$(echo "$RESPONSE" | jq -r '.success')" != "true" ]; then
    echo "$RESPONSE" | jq
    output_json "error" "Cloudflare DNS lookup failed" 500
fi

CF_RECORD_ID=$(echo "$RESPONSE" | jq -r '.result[0].id // empty')
CF_RECORD_IP=$(echo "$RESPONSE" | jq -r '.result[0].content // empty')

if [ -z "$CF_RECORD_ID" ]; then
    echo -e "   🆕 Creating A record for $FULL_DOMAIN → $EC2_HOST_IP"
    CREATE_RESPONSE=$(curl -s -X POST \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$(jq -n \
        --arg name "$FULL_DOMAIN" \
        --arg ip "$EC2_HOST_IP" \
        '{type:"A", name:$name, content:$ip, ttl:60, proxied:false}')")

    if [ "$(echo "$CREATE_RESPONSE" | jq -r '.success')" != "true" ]; then
        echo "$CREATE_RESPONSE" | jq
        output_json "error" "Cloudflare DNS creation failed" 500
    fi
    echo -e "   ✅ DNS record created."
elif [ "$CF_RECORD_IP" != "$EC2_HOST_IP" ]; then
    echo -e "   🔁 Updating existing A record ($CF_RECORD_IP → $EC2_HOST_IP)"
    UPDATE_RESPONSE=$(curl -s -X PUT \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$CF_RECORD_ID" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$(jq -n \
        --arg name "$FULL_DOMAIN" \
        --arg ip "$EC2_HOST_IP" \
        '{type:"A", name:$name, content:$ip, ttl:60, proxied:false}')")

    if [ "$(echo "$UPDATE_RESPONSE" | jq -r '.success')" != "true" ]; then
        echo "$UPDATE_RESPONSE" | jq
        output_json "error" "Cloudflare DNS update failed" 500
    fi
    echo -e "   ✅ DNS record updated."
else
    echo -e "   ✅ DNS record exists and is correct ($CF_RECORD_IP)"
fi

echo -e "⏳ [9.5/11] Waiting for DNS + HTTP validation readiness..."

MAX_RETRIES=30          # up to ~5 minutes
SLEEP_SECONDS=10
COUNT=0
DNS_READY=false
HTTP_READY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
    RESOLVED_IPS=$(dig @8.8.8.8 "$FULL_DOMAIN" A +short)
    if echo "$RESOLVED_IPS" | grep -q "^$EC2_HOST_IP$"; then
        DNS_READY=true
    else
        DNS_READY=false
    fi

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$FULL_DOMAIN" || true)
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "301" || "$HTTP_CODE" == "308" ]]; then
        HTTP_READY=true
    else
        HTTP_READY=false
    fi

    if [ "$DNS_READY" = true ] && [ "$HTTP_READY" = true ]; then
        echo -e "   ✨ DNS and HTTP are READY"
        break
    fi

    echo -e "   ...waiting (dns=$DNS_READY http=$HTTP_READY)"
    sleep $SLEEP_SECONDS
    COUNT=$((COUNT + 1))
done

if [ "$DNS_READY" != true ]; then
    output_json "error" "DNS did not propagate in time" 504
fi
if [ "$HTTP_READY" != true ]; then
    output_json "error" "HTTP not reachable for ACME challenge" 504
fi

# ---------------------------------------------------------------------
# STEP 10: Issue SSL certificate
# ---------------------------------------------------------------------
CURRENT_STEP="SSL Setup"
echo -e "🔒 [10/11] Securing with SSL..."
sudo certbot --nginx -d "$FULL_DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --reinstall > /dev/null 2>&1

# ---------------------------------------------------------------------
# STEP 11: Health check
# ---------------------------------------------------------------------
CURRENT_STEP="Health Check"
echo -e "🔍 [11/11] Verifying service at https://$FULL_DOMAIN..."
sleep 5
FINAL_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "https://$FULL_DOMAIN")

if [ "$FINAL_STATUS" == "200" ] || [ "$FINAL_STATUS" == "301" ] || [ "$FINAL_STATUS" == "308" ]; then
    echo -e "✅ Server is UP and Running!"
    CURRENT_STEP="None"
    output_json "success" "Server deployment successful" "$FINAL_STATUS"
else
    output_json "error" "App reachable but returned status $FINAL_STATUS" "$FINAL_STATUS"
fi