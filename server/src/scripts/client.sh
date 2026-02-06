
#!/bin/bash

PROJECT_NAME=$1
REPO_URL=$2
BRANCH=$3
APP_TYPE=$4
SUB_DIR=${5:-"."}
ENV_VARS=$6


MY_DOMAIN="stacktest.space"
HOST_ZONE_ID="Z0731459IXAN4Z3D4MLO"
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
echo -e "☁️ [6/10] Checking AWS Route53 DNS for $FULL_DOMAIN..."
EXISTING_RECORD=$(aws route53 list-resource-record-sets \
    --hosted-zone-id "$HOST_ZONE_ID" \
    --query "ResourceRecordSets[?Name == '${FULL_DOMAIN}.' || Name == '${FULL_DOMAIN}'].Name" \
    --output text)

if [ -z "$EXISTING_RECORD" ]; then
    echo -e "   🆕 DNS record not found. Creating A record..."
    IP_ADDR=$(curl -s http://checkip.amazonaws.com)
    JSON_BATCH="{\"Changes\":[{\"Action\":\"CREATE\",\"ResourceRecordSet\":{\"Name\":\"$FULL_DOMAIN\",\"Type\":\"A\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"$IP_ADDR\"}]}}]}"
    CHANGE_ID=$(aws route53 change-resource-record-sets --hosted-zone-id "$HOST_ZONE_ID" --change-batch "$JSON_BATCH" --query 'ChangeInfo.Id' --output text)
    echo -e "   ⏳ Waiting for DNS to sync active..."
    aws route53 wait resource-record-sets-changed --id "$CHANGE_ID"
else
    echo -e "   ✅ DNS record already exists. Skipping creation."
fi

CURRENT_STEP="Nginx Configuration"
echo -e "⚙️ [7/10] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/$FULL_DOMAIN"

# Using -S to read password from an environment variable or parameter
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
sudo nginx -t
sudo systemctl reload nginx

CURRENT_STEP="SSL Setup"
echo -e "🔒 [8/10] Securing with Let's Encrypt SSL (Certbot)..."
sudo certbot --nginx -d "$FULL_DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --reinstall > /dev/null 2>&1

CURRENT_STEP="Health Check"
echo -e "🔍 [9/10] Running health check on https://$FULL_DOMAIN..."
FINAL_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "https://$FULL_DOMAIN")

if [ "$FINAL_STATUS" == "200" ]; then
    echo -e "✅ [10/10] Health check passed!"
    CURRENT_STEP="None"
    output_json "success" "Deployment completed successfully" "$FINAL_STATUS"
else
    echo -e "⚠️ [10/10] Health check failed with status: $FINAL_STATUS"
    output_json "error" "App reachable but returned non-200 status" "$FINAL_STATUS"
fi