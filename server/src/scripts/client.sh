#!/bin/bash

PROJECT_NAME=$1
REPO_URL=$2
BRANCH=$3
APP_TYPE=$4
SUB_DIR=${5:-"."}
ENV_VARS=$6

# --- CONFIGURATION ---
MY_DOMAIN="folio.business"
CF_ZONE_ID="b2cca1939b9eb9b3ee10375fa15196f5"
CF_API_TOKEN="7FtsbXLZRFDSAqUwOkD8wX1Edr43IfAnx_-HzPrR"
TARGET_IP="72.62.236.106" 
EMAIL="ahmedjaafarbadri@gmail.com"

FULL_DOMAIN="${PROJECT_NAME}.${MY_DOMAIN}"
WEB_ROOT="/var/www/${PROJECT_NAME}"
CURRENT_STEP="Initialization"

output_json() {
    local status=$1
    local message=$2
    local http_code=${3:-0}
    
    echo -e "\n------------------------------------------"
    echo -e "📊 FINAL DEPLOYMENT REPORT"
    echo -e "------------------------------------------"
    printf '{\n  "project": "%s",\n  "status": "%s",\n  "url": "https://%s",\n  "status_code": %s,\n  "error_step": "%s",\n  "message": "%s"\n}\n' \
        "$PROJECT_NAME" "$status" "$FULL_DOMAIN" "$http_code" "$CURRENT_STEP" "$message"
    exit $([ "$status" == "success" ] && echo 0 || echo 1)
}

error_handler() {
    echo -e "\n❌ [ERROR] Failed at step: $CURRENT_STEP"
    output_json "error" "Command failed: $BASH_COMMAND" 500
}
trap 'error_handler' ERR

# --- DEPLOYMENT STEPS ---

echo -e "🚀 [1/10] Starting deployment for $FULL_DOMAIN..."

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
    echo -e "📝 [4/10] Writing environment variables to .env..."
    echo -e "$ENV_VARS" > .env
else
    echo -e "⏩ [4/10] No .env variables provided. Skipping..."
fi

CURRENT_STEP="Build Process"
if [ "$APP_TYPE" == "react" ]; then
    echo -e "⚛️ [5/10] React app detected. Detecting package manager..."
    if [ -f "pnpm-lock.yaml" ]; then PKG="pnpm"; elif [ -f "yarn.lock" ]; then PKG="yarn"; else PKG="npm"; fi
    echo -e "   🛠️  Using $PKG to install dependencies and build..."
    $PKG install > /dev/null 2>&1 && $PKG run build > /dev/null 2>&1
    [ -d "dist" ] && BUILD_PATH="$(pwd)/dist" || BUILD_PATH="$(pwd)/build"
else
    echo -e "📄 [5/10] Static app detected. Skipping build..."
    BUILD_PATH="$(pwd)"
fi

CURRENT_STEP="DNS Check/Creation"
echo -e "☁️ [6/10] Checking Cloudflare DNS for $FULL_DOMAIN..."

# Fetch existing A record
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
        --arg ip "$TARGET_IP" \
        '{type:"A", name:$name, content:$ip, ttl:60, proxied:false}')")

    CREATE_SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')

    if [ "$CREATE_SUCCESS" != "true" ]; then
        echo "$CREATE_RESPONSE" | jq
        output_json "error" "Cloudflare DNS creation failed" 500
    fi

    echo -e "   ✅ DNS record created successfully."
else
    echo -e "   ✅ DNS A record already exists."
fi

# --- NEW: WAIT FOR PROPAGATION ---
echo -e "⏳ [6.5/10] Waiting for DNS propagation..."
MAX_RETRIES=18
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    RESOLVED_IP=$(dig @8.8.8.8 "$FULL_DOMAIN" A +short | head -n1)

    if [ "$RESOLVED_IP" == "$TARGET_IP" ]; then
        echo -e "   ✨ DNS ACTIVE: $FULL_DOMAIN → $TARGET_IP"
        break
    fi

    echo -e "   ...waiting (got: ${RESOLVED_IP:-none})"
    sleep 10
    ((COUNT++))
done

if [ "$RESOLVED_IP" != "$TARGET_IP" ]; then
    output_json "error" "DNS propagation timeout" 504
fi

CURRENT_STEP="Nginx Configuration"
echo -e "⚙️ [7/10] Configuring Nginx..."
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
echo -e "🔒 [8/10] Securing with Let's Encrypt SSL..."
# We add a small extra buffer just to be safe
sleep 5
sudo certbot --nginx -d "$FULL_DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --reinstall

CURRENT_STEP="Health Check"
echo -e "🔍 [9/10] Running health check on https://$FULL_DOMAIN..."
sleep 2
FINAL_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "https://$FULL_DOMAIN")

if [ "$FINAL_STATUS" == "200" ]; then
    echo -e "✅ [10/10] Health check passed!"