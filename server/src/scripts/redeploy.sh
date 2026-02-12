#!/bin/bash

# Parameters
PROJECT_NAME=$1
APP_TYPE=$2        # express, nest, next, react, static
ENV_VARS=$3        # Optional: .env content string (exclude PORT)

# Constants
MY_DOMAIN="stacktest.space"
BASE_DIR="/var/www/$PROJECT_NAME"
EMAIL="ahmedjaafarbadri@gmail.com"

# --- HELPER: FIND AVAILABLE PORT ---
get_free_port() {
    local port=3000
    # Check if port is in use by looking at netstat/ss or if PM2 is already using a port for this app
    local existing_port=$(pm2 jlist | jq -r ".[] | select(.name == \"api.$PROJECT_NAME\") | .pm2_env.PORT" 2>/dev/null)
    
    if [[ ! -z "$existing_port" && "$existing_port" != "null" ]]; then
        echo "$existing_port"
    else
        while ss -tuln | grep -q ":$port "; do
            ((port++))
        done
        echo "$port"
    fi
}

# 1. Initialization & App Logic
if [[ "$APP_TYPE" == "express" || "$APP_TYPE" == "nest" || "$APP_TYPE" == "next" ]]; then
    IS_SERVER=true
    FULL_DOMAIN="api.${PROJECT_NAME}.${MY_DOMAIN}"
    # AUTOMATIC PORT ASSIGNMENT
    PORT=$(get_free_port)
    echo "🎯 Auto-assigned Port: $PORT"
else
    IS_SERVER=false
    FULL_DOMAIN="${PROJECT_NAME}.${MY_DOMAIN}"
fi

PM2_NAME="api.${PROJECT_NAME}"
NGINX_CONF="/etc/nginx/sites-available/$FULL_DOMAIN"

# 2. Check Directory & Pull
[ -d "$BASE_DIR" ] || { echo "❌ Directory $BASE_DIR not found"; exit 1; }
cd "$BASE_DIR" || exit

echo "📥 Pulling changes..."
git pull

# 3. Environment & Port Configuration
if [ "$IS_SERVER" = true ]; then
    echo "📝 Updating .env with PORT=$PORT..."
    # Ensure PORT is written to .env and append other variables
    echo "PORT=$PORT" > .env
    if [ ! -z "$ENV_VARS" ]; then
        echo -e "$ENV_VARS" >> .env
    fi
fi

# 4. Dependency & Build
if [ "$APP_TYPE" != "static" ]; then
    if [ -f "pnpm-lock.yaml" ]; then PKG="pnpm"; elif [ -f "yarn.lock" ]; then PKG="yarn"; else PKG="npm"; fi
    [ ! -d "node_modules" ] && $PKG install
    
    if [[ "$APP_TYPE" == "nest" || "$APP_TYPE" == "next" || "$APP_TYPE" == "react" || -f "tsconfig.json" ]]; then
        echo "🏗️ Building app..."
        export NODE_OPTIONS="--max-old-space-size=2048"
        $PKG run build
    fi
fi

# 5. Nginx Configuration (Automatic Proxy to the new Port)
if [ "$IS_SERVER" = true ]; then
    echo "⚙️ Updating Nginx Proxy to port $PORT..."
    sudo tee "$NGINX_CONF" > /dev/null <<EOF
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
    sudo nginx -t && sudo systemctl reload nginx
fi

# 6. PM2 Management
if [ "$IS_SERVER" = true ]; then
    echo "♻️ Restarting PM2 process..."
    # Run command logic
    RUN_CMD="npm run start"
    [[ "$APP_TYPE" == "next" ]] && RUN_CMD="npm run start -- -p $PORT"

    if pm2 show "$PM2_NAME" > /dev/null 2>&1; then
        PORT=$PORT pm2 restart "$PM2_NAME" --update-env
    else
        PORT=$PORT pm2 start "$RUN_CMD" --name "$PM2_NAME"
    fi
    pm2 save
fi

echo "✅ Deployment successful on https://$FULL_DOMAIN (Internal Port: $PORT)"