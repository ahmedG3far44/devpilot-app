#!/bin/bash

# Usage: ./cleanup_project.sh [project_name] [app_type] [domain]
# Example: ./cleanup_project.sh my-app express example.com

PROJECT_NAME=$1
APP_TYPE=$2
DOMAIN="stacktest.space"

# Configuration
WEB_ROOT="/var/www"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# 1. Validation
if [[ -z "$PROJECT_NAME" || -z "$APP_TYPE" || -z "$DOMAIN" ]]; then
    echo "Usage: $0 [project_name] [app_type] [domain]"
    exit 1
fi

echo "--- Starting cleanup for project: $PROJECT_NAME ($APP_TYPE) ---"

# 2. Handle PM2 for Server-Side Apps
if [[ "$APP_TYPE" == "express" || "$APP_TYPE" == "nest" || "$APP_TYPE" == "next" ]]; then
    echo "Stopping and deleting PM2 process: api.$PROJECT_NAME"
    pm2 delete "api.$PROJECT_NAME" || echo "PM2 process not found, skipping..."
    pm2 save
fi

# 3. Delete Nginx Configurations
# Logic: Server apps use api. prefix, Client apps (react, static) use the raw name.
if [[ "$APP_TYPE" == "express" || "$APP_TYPE" == "nest" || "$APP_TYPE" == "next" ]]; then
    CONF_FILE="api.$PROJECT_NAME.$DOMAIN"
else
    CONF_FILE="$PROJECT_NAME.$DOMAIN"
fi

echo "Removing Nginx configs for: $CONF_FILE"
rm -fr "$NGINX_ENABLED/$CONF_FILE"
rm -fr "$NGINX_AVAILABLE/$CONF_FILE"


if [[ "$APP_TYPE" == "express" || "$APP_TYPE" == "nest" || "$APP_TYPE" == "next" ]]; then
    TARGET_DIR="$WEB_ROOT/api.$PROJECT_NAME"
else
    TARGET_DIR="$WEB_ROOT/$PROJECT_NAME"
fi

if [ -d "$TARGET_DIR" ]; then
    echo "Deleting files in $TARGET_DIR"
    rm -rf "$TARGET_DIR"
else
    echo "Directory $TARGET_DIR not found, skipping..."
fi

# 5. Reload Nginx
echo "Reloading Nginx configuration..."

systemctl reload nginx

echo "--- Cleanup Complete ---"