#!/bin/bash

# Parameters: <project_name> <repo_url> <branch_name> <app_type> <domain> <port> <hosted_zone_id> <env_content> <sub_dir> <run_command>
PROJECT_NAME=$1
REPO_URL=$2
BRANCH=$3
APP_TYPE=$4       # express, nest, or next
PORT=$5
SUB_DIR=${6:-"."}
ENV_VARS=$7
RUN_CMD=${8:-"npm run start"} 


MY_DOMAIN="stacktest.space"
HOST_ZONE_ID="Z0731459IXAN4Z3D4MLO"
EMAIL="ahmedjaafarbadri@gmail.com"

FULL_DOMAIN="${PROJECT_NAME}.${MY_DOMAIN}"
PM2_NAME="api.${PROJECT_NAME}"
CURRENT_STEP="Initialization"

output_json() {
    local status=$1
    local message=$2
    local http_code=${3:-0}
    echo -e "\n------------------------------------------"
    echo -e "📊 SERVER DEPLOYMENT REPORT"
    echo -e "------------------------------------------"
    printf '{\n  "project": "%s",\n  "status": "%s",\n  "url": "https://%s",\n  "port": "%s",\n  "pm2_name": "%s",\n  "status_code": %s,\n  "error_step": "%s",\n  "message": "%s"\n}\n' \
        "$PROJECT_NAME" "$status" "$FULL_DOMAIN" "$PORT" "$PM2_NAME" "$http_code" "$CURRENT_STEP" "$message"
    exit $([ "$status" == "success" ] && echo 0 || echo 1)
}

error_handler() {
    echo -e "\n❌ [ERROR] Failed at step: $CURRENT_STEP"
    # Capture last 10 lines of PM2 logs if it failed during PM2 step
    if [ "$CURRENT_STEP" == "PM2 Deployment" ]; then
        pm2 logs "$PM2_NAME" --lines 10 --nostream
    fi
    output_json "error" "Command failed: $BASH_COMMAND" 500
}
trap 'error_handler' ERR

# --- DEPLOYMENT STEPS ---

echo -e "🚀 [1/11] Starting Server Deployment for $FULL_DOMAIN..."

CURRENT_STEP="Git Operations"
echo -e "📦 [2/11] Managing Repository..."
cd /var/www/ || exit
if [ -d "$PROJECT_NAME" ]; then
    cd "$PROJECT_NAME" || exit
    git pull origin "$BRANCH" > /dev/null 2>&1
else
    git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_NAME" > /dev/null 2>&1
    cd "$PROJECT_NAME" || exit
fi

CURRENT_STEP="Directory Navigation"
cd "$SUB_DIR" || exit 1

CURRENT_STEP="Environment Configuration"
echo -e "📝 [3/11] Writing .env file..."
echo -e "PORT=$PORT\n$ENV_VARS" > .env

CURRENT_STEP="Dependency Installation"
echo -e "📦 [4/11] Installing dependencies..."
if [ -f "pnpm-lock.yaml" ]; then PKG="pnpm"; elif [ -f "yarn.lock" ]; then PKG="yarn"; else PKG="npm"; fi
$PKG install > /dev/null 2>&1

CURRENT_STEP="Build Process"
if [[ "$APP_TYPE" == "nest" || "$APP_TYPE" == "next" || -f "tsconfig.json" ]]; then
    echo -e "🏗️  [5/11] Building $APP_TYPE application..."
    $PKG run build > /dev/null 2>&1
fi

CURRENT_STEP="PM2 Deployment"
echo -e "♻️  [6/11] Starting/Restarting with PM2..."

# LOGIC FOR NEXT.JS PORT FLAG
if [ "$APP_TYPE" == "next" ]; then
    # Ensures it runs: npm run start -- -p 3000
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
pm2 save > /dev/null 2>&1

CURRENT_STEP="DNS Check/Creation"
echo -e "☁️ [7/11] Validating AWS Route53 DNS..."
EXISTING_RECORD=$(aws route53 list-resource-record-sets --hosted-zone-id "$HOST_ZONE_ID" --query "ResourceRecordSets[?Name == '${FULL_DOMAIN}.' || Name == '${FULL_DOMAIN}'].Name" --output text)
if [ -z "$EXISTING_RECORD" ]; then
    IP_ADDR=$(curl -s http://checkip.amazonaws.com)
    JSON_BATCH="{\"Changes\":[{\"Action\":\"CREATE\",\"ResourceRecordSet\":{\"Name\":\"$FULL_DOMAIN\",\"Type\":\"A\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"$IP_ADDR\"}]}}]}"
    CHANGE_ID=$(aws route53 change-resource-record-sets --hosted-zone-id "$HOST_ZONE_ID" --change-batch "$JSON_BATCH" --query 'ChangeInfo.Id' --output text)
    aws route53 wait resource-record-sets-changed --id "$CHANGE_ID"
fi

CURRENT_STEP="Nginx Proxy Configuration"
echo -e "⚙️ [8/11] Configuring Nginx Reverse Proxy..."
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
    }
}
EOF
sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/"
sudo nginx -t > /dev/null 2>&1 && sudo systemctl reload nginx

CURRENT_STEP="SSL Setup"
echo -e "🔒 [9/11] Securing with SSL..."
sudo certbot --nginx -d "$FULL_DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --reinstall > /dev/null 2>&1

CURRENT_STEP="Health Check"
echo -e "🔍 [10/11] Verifying service at https://$FULL_DOMAIN..."
sleep 5 
FINAL_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "https://$FULL_DOMAIN")

if [ "$FINAL_STATUS" == "200" ] || [ "$FINAL_STATUS" == "301" ] || [ "$FINAL_STATUS" == "308" ]; then
    echo -e "✅ [11/11] Server is UP and Running!"
    CURRENT_STEP="None"
    output_json "success" "Server deployment successful" "$FINAL_STATUS"
else
    output_json "error" "App reachable but returned status $FINAL_STATUS" "$FINAL_STATUS"
fi