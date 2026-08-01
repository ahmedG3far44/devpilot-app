#!/usr/bin/env bash

set -Eeuo pipefail

while [[ $# -gt 0 ]]; do
    case "$1" in
        --project)
            PROJECT_NAME="$2"
            shift 2
            ;;
        --git_url)
            REPO_URL="$2"
            shift 2
            ;;
        --branch)
            BRANCH="$2"
            shift 2
            ;;
        --type)
            APP_TYPE="$2"
            shift 2
            ;;
        --sub_dir)
            SUB_DIR="$2"
            shift 2
            ;;
        --env)
            ENV_VARS="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --cf_zone_id)
            CF_ZONE_ID="$2"
            shift 2
            ;;
        --cf_token)
            CF_API_TOKEN="$2"
            shift 2
            ;;
        --host_ip)
            EC2_HOST_IP="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

SUB_DIR=${SUB_DIR:-"."}
EMAIL=${EMAIL:-"ahmedjaafarbadri@gmail.com"}

FULL_DOMAIN="${PROJECT_NAME}.${DOMAIN}"
WEB_ROOT="/var/www/${PROJECT_NAME}"
CURRENT_STEP="Initialization"

output_json() {
    local status=$1
    local message=$2
    local http_code=${3:-0}

    echo -e "\n------------------------------------------"
    echo -e "📊 FINAL DEPLOYMENT REPORT"
    echo -e "------------------------------------------"
    jq -n \
        --arg project "$PROJECT_NAME" \
        --arg status "$status" \
        --arg url "https://$FULL_DOMAIN" \
        --argjson status_code "$http_code" \
        --arg error_step "$CURRENT_STEP" \
        --arg message "$message" \
        '{project: $project, status: $status, url: $url, status_code: $status_code, error_step: $error_step, message: $message}'
    exit $([ "$status" == "success" ] && echo 0 || echo 1)
}

error_handler() {
    echo -e "\n❌ [ERROR] Failed at step: $CURRENT_STEP"
    output_json "error" "Command failed: $BASH_COMMAND" 500
}
trap 'error_handler' ERR

# --- DEPLOYMENT STEPS ---

echo -e "🚀 [1/11] Starting deployment for $FULL_DOMAIN..."

CURRENT_STEP="Git Operations"
mkdir -p /var/www/
cd /var/www/ || output_json "error" "Cannot access /var/www/" 500

if [ -d "$PROJECT_NAME" ]; then
    echo -e "    🔄 Project exists. Pulling..."
    cd "$PROJECT_NAME" || exit
    git pull origin "$BRANCH"
else
    echo -e "    📥 Cloning..."
    git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_NAME"
    cd "$PROJECT_NAME" || exit
fi

CURRENT_STEP="Directory Navigation"
if [ -d "$SUB_DIR" ]; then
    cd "$SUB_DIR"
else
    output_json "error" "Sub-directory $SUB_DIR not found in project" 404
fi

CURRENT_STEP="Environment Configuration"
if [ ! -z "$ENV_VARS" ]; then
    echo -e "📝 [4/11] Writing environment variables to .env..."
    echo -e "$ENV_VARS" > .env
else
    echo -e "⏩ [4/11] No .env variables provided. Skipping..."
fi

CURRENT_STEP="Build Process"
APP_TYPE_NORMALIZED=$(echo "${APP_TYPE:-}" | tr '[:upper:]' '[:lower:]' | xargs)

case "$APP_TYPE_NORMALIZED" in
    react)
    echo -e "⚛️ [5/11] React app detected. Detecting package manager..."
    if [ -f "pnpm-lock.yaml" ]; then
        PKG="pnpm"
    elif [ -f "yarn.lock" ]; then
        PKG="yarn"
    else
        PKG="npm"
    fi

    if ! command -v "$PKG" >/dev/null 2>&1; then
        output_json "error" "Package manager '$PKG' is not installed on this host" 500
    fi

    BUILD_LOG="/tmp/${PROJECT_NAME}-build.log"
    : > "$BUILD_LOG"

    echo -e "   🛠️  Using $PKG to install dependencies..."
    CURRENT_STEP="Dependency Install"
    if [ "$PKG" == "npm" ] && [ -f "package-lock.json" ]; then
        INSTALL_CMD="npm ci"
    else
        INSTALL_CMD="$PKG install"
    fi

    if ! $INSTALL_CMD >> "$BUILD_LOG" 2>&1; then
        echo -e "   ❌ Install failed. Last 40 lines of log:"
        tail -n 40 "$BUILD_LOG"
        output_json "error" "$INSTALL_CMD failed - see $BUILD_LOG on host for full output" 500
    fi

    echo -e "   🛠️  Running build..."
    CURRENT_STEP="React Build"
    if ! $PKG run build >> "$BUILD_LOG" 2>&1; then
        echo -e "   ❌ Build failed. Last 40 lines of log:"
        tail -n 40 "$BUILD_LOG"
        output_json "error" "$PKG run build failed - see $BUILD_LOG on host for full output" 500
    fi

    CURRENT_STEP="Build Output Verification"
    if [ -d "dist" ]; then
        BUILD_PATH="$(pwd)/dist"
    elif [ -d "build" ]; then
        BUILD_PATH="$(pwd)/build"
    else
        echo -e "   ❌ Build succeeded but neither 'dist/' nor 'build/' was produced."
        echo -e "   👉 Check your bundler's outDir config (e.g. vite.config.ts) and rerun."
        output_json "error" "Build output directory not found (checked dist/, build/)" 500
    fi
    echo -e "   ✅ Build output verified at $BUILD_PATH"
    ;;

    static)
    echo -e "📄 [5/11] Static app detected. Skipping install/build..."
    BUILD_PATH="$(pwd)"
    ;;

    *)
    echo -e "   ⚠️  Unrecognized --type '${APP_TYPE:-<empty>}'. Treating as static (no install/build will run)."
    echo -e "   👉 Pass --type react explicitly if this app needs a build step."
    BUILD_PATH="$(pwd)"
    ;;
esac

CURRENT_STEP="Cloudflare Zone Status Check"
echo -e "☁️  [6/11] Verifying Cloudflare zone is active..."

ZONE_RESPONSE=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json")

ZONE_SUCCESS=$(echo "$ZONE_RESPONSE" | jq -r '.success')
if [ "$ZONE_SUCCESS" != "true" ]; then
    echo "$ZONE_RESPONSE" | jq
    output_json "error" "Cloudflare zone lookup failed" 500
fi

ZONE_STATUS=$(echo "$ZONE_RESPONSE" | jq -r '.result.status // "unknown"')
if [ "$ZONE_STATUS" != "active" ]; then
    echo -e "   ⚠️  Zone status is '$ZONE_STATUS', not 'active'. Nameservers likely aren't pointed at Cloudflare yet."
    output_json "error" "Cloudflare zone is not active (status: $ZONE_STATUS)" 409
fi
echo -e "   ✅ Zone '$CF_ZONE_ID' is active."

CURRENT_STEP="DNS Record Creation"
echo -e "☁️  [7/11] Checking Cloudflare DNS for $FULL_DOMAIN..."

RESPONSE=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=A&name=$FULL_DOMAIN" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json")

CF_SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$CF_SUCCESS" != "true" ]; then
    echo "$RESPONSE" | jq
    output_json "error" "Cloudflare DNS fetch failed" 500
fi

CF_RECORD_ID=$(echo "$RESPONSE" | jq -r '.result[0].id // empty')

if [ -z "$CF_RECORD_ID" ]; then
    echo -e "   🆕 No A record found. Creating DNS record..."

    CREATE_RESPONSE=$(curl -s -X POST \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$(jq -n \
        --arg name "$FULL_DOMAIN" \
        --arg ip "$EC2_HOST_IP" \
        '{type:"A", name:$name, content:$ip, ttl:60, proxied:false}')")

    CREATE_SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')

    if [ "$CREATE_SUCCESS" != "true" ]; then
        echo "$CREATE_RESPONSE" | jq
        output_json "error" "Cloudflare DNS creation failed" 500
    fi

    CF_RECORD_ID=$(echo "$CREATE_RESPONSE" | jq -r '.result.id // empty')
    echo -e "   ✅ DNS record created successfully (id: $CF_RECORD_ID)."
else
    echo -e "   ✅ DNS A record already exists (id: $CF_RECORD_ID)."
    # Existing record may point at a stale IP (e.g. redeploy on a new host). Keep it in sync.
    EXISTING_IP=$(echo "$RESPONSE" | jq -r '.result[0].content // empty')
    if [ "$EXISTING_IP" != "$EC2_HOST_IP" ]; then
        echo -e "   🔧 Existing record points to $EXISTING_IP, updating to $EC2_HOST_IP..."
        UPDATE_RESPONSE=$(curl -s -X PUT \
          "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$CF_RECORD_ID" \
          -H "Authorization: Bearer $CF_API_TOKEN" \
          -H "Content-Type: application/json" \
          --data "$(jq -n \
            --arg name "$FULL_DOMAIN" \
            --arg ip "$EC2_HOST_IP" \
            '{type:"A", name:$name, content:$ip, ttl:60, proxied:false}')")
        UPDATE_SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success')
        if [ "$UPDATE_SUCCESS" != "true" ]; then
            echo "$UPDATE_RESPONSE" | jq
            output_json "error" "Cloudflare DNS update failed" 500
        fi
        echo -e "   ✅ DNS record updated."
    fi
fi

CURRENT_STEP="DNS Record Activation Check (Cloudflare)"
echo -e "⏳ [7.5/11] Confirming Cloudflare has the record active (not pending)..."

CF_MAX_RETRIES=12
CF_COUNT=0
CF_RECORD_ACTIVE=false

while [ $CF_COUNT -lt $CF_MAX_RETRIES ]; do
    RECORD_RESPONSE=$(curl -s -X GET \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$CF_RECORD_ID" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json")

    RECORD_SUCCESS=$(echo "$RECORD_RESPONSE" | jq -r '.success')
    RECORD_CONTENT=$(echo "$RECORD_RESPONSE" | jq -r '.result.content // empty')
    # Cloudflare doesn't expose a literal "pending" flag on A records, so "active" here
    # means: the API confirms the record exists, is not locked/proxied-pending, and its
    # content matches what we just wrote (i.e. the write has fully committed on their side).
    RECORD_LOCKED=$(echo "$RECORD_RESPONSE" | jq -r '.result.locked // false')

    if [ "$RECORD_SUCCESS" == "true" ] && [ "$RECORD_CONTENT" == "$EC2_HOST_IP" ] && [ "$RECORD_LOCKED" == "false" ]; then
        echo -e "   ✨ Cloudflare record confirmed active: $FULL_DOMAIN → $RECORD_CONTENT"
        CF_RECORD_ACTIVE=true
        break
    fi

    echo -e "   ...waiting on Cloudflare (content: ${RECORD_CONTENT:-none}, locked: ${RECORD_LOCKED:-unknown})"
    sleep 5
    CF_COUNT=$((CF_COUNT + 1))
done

if [ "$CF_RECORD_ACTIVE" != "true" ]; then
    output_json "error" "Cloudflare DNS record did not confirm active in time" 504
fi

# --- WAIT FOR EXTERNAL DNS PROPAGATION ---
CURRENT_STEP="DNS Propagation"
echo -e "⏳ [8/11] Waiting for DNS propagation..."
MAX_RETRIES=18
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    RESOLVED_IP=$(dig @8.8.8.8 "$FULL_DOMAIN" A +short | head -n1)

    if [ "$RESOLVED_IP" == "$EC2_HOST_IP" ]; then
        echo -e "   ✨ DNS ACTIVE: $FULL_DOMAIN → $EC2_HOST_IP"
        break
    fi

    echo -e "   ...waiting (got: ${RESOLVED_IP:-none})"
    sleep 10
    COUNT=$((COUNT + 1))
done

if [ "$RESOLVED_IP" != "$EC2_HOST_IP" ]; then
    output_json "error" "DNS propagation timeout" 504
fi

CURRENT_STEP="Nginx Configuration"
echo -e "⚙️ [9/11] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/$FULL_DOMAIN"

sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name $FULL_DOMAIN;
    root $BUILD_PATH;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
}
EOF

sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/"
sudo nginx -t && sudo systemctl reload nginx

CURRENT_STEP="SSL Setup"
echo -e "🔒 [10/11] Securing with Let's Encrypt SSL..."
# We add a small extra buffer just to be safe
sleep 5
sudo certbot --nginx -d "$FULL_DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --reinstall

CURRENT_STEP="Health Check"
echo -e "🔍 [11/11] Running health check on https://$FULL_DOMAIN..."
sleep 2
FINAL_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "https://$FULL_DOMAIN")

if [ "$FINAL_STATUS" == "200" ]; then
    echo -e "✅ [11/11] Health check passed!"
    output_json "success" "Deployment completed successfully" "$FINAL_STATUS"
else
    output_json "error" "Health check failed" "$FINAL_STATUS"
fi