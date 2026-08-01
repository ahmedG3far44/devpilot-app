#!/usr/bin/env bash

set -Eeuo pipefail

# =====================================================================
# Redeploy script for an existing project (first deploy must have
# happened via server.sh / client.sh).
#
# Steps:
#   1.  Validate parameters
#   2.  Pull latest changes (fetch + checkout + reset --hard)
#   3.  Write / update .env (PORT for servers + provided env vars)
#   4.  Install dependencies (always)
#   5.  Build the app (react / next / nest or when TypeScript is used)
#   6.  react/static: publish build output to the web root
#   7.  express/nest/next: configure Nginx reverse proxy + reload
#   8.  Restart PM2 service
# =====================================================================

# --- Parse arguments (same style as server.sh / client.sh) ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --project)   PROJECT_NAME="$2";         shift 2 ;;
        --type)      APP_TYPE="$2";             shift 2 ;;
        --branch)    BRANCH="$2";               shift 2 ;;
        --package_manager) PACKAGE_MANAGER="$2"; shift 2 ;;
        --sub_dir)   SUB_DIR="$2";              shift 2 ;;
        --run_script) RUN_SCRIPT="$2";          shift 2 ;;
        --build_script) BUILD_SCRIPT="$2";      shift 2 ;;
        --typescript) TYPESCRIPT="$2";          shift 2 ;;
        --port)      PORT="$2";                 shift 2 ;;
        --env)       ENV_B64="$2";              shift 2 ;;
        --domain)    DOMAIN="$2";               shift 2 ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

PROJECT_NAME=${PROJECT_NAME:-}
APP_TYPE=${APP_TYPE:-}
BRANCH=${BRANCH:-main}
PACKAGE_MANAGER=${PACKAGE_MANAGER:-npm}
SUB_DIR=${SUB_DIR:-"."}
RUN_SCRIPT=${RUN_SCRIPT:-"npm run start"}
BUILD_SCRIPT=${BUILD_SCRIPT:-"npm run build"}
TYPESCRIPT=${TYPESCRIPT:-false}
DOMAIN=${DOMAIN:-stacktest.space}

if [[ -z "$PROJECT_NAME" || -z "$APP_TYPE" ]]; then
    echo "❌ Missing required parameters: --project and --type"
    exit 1
fi

PROJECT_NAME_LOWER=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | xargs)
APP_TYPE_NORMALIZED=$(echo "$APP_TYPE" | tr '[:upper:]' '[:lower:]' | xargs)
PACKAGE_MANAGER_LOWER=$(echo "$PACKAGE_MANAGER" | tr '[:upper:]' '[:lower:]' | xargs)

# ---------------------------------------------------------------------
# STEP 1: Determine naming + app kind
# ---------------------------------------------------------------------
case "$APP_TYPE_NORMALIZED" in
    express|nest)
        IS_SERVER=true
        PM2_NAME="api.${PROJECT_NAME_LOWER}"
        FULL_DOMAIN="api.${PROJECT_NAME_LOWER}.${DOMAIN}"
        ;;
    next)
        IS_SERVER=true
        PM2_NAME="${PROJECT_NAME_LOWER}"
        FULL_DOMAIN="${PROJECT_NAME_LOWER}.${DOMAIN}"
        ;;
    react|static)
        IS_SERVER=false
        PM2_NAME=""
        FULL_DOMAIN="${PROJECT_NAME_LOWER}.${DOMAIN}"
        ;;
    *)
        echo "❌ Unsupported --type '${APP_TYPE_NORMALIZED}'"
        exit 1
        ;;
esac

BASE_DIR="/var/www/${PROJECT_NAME_LOWER}"
APP_DIR="${BASE_DIR}/${SUB_DIR#./}"
WEB_ROOT="$BASE_DIR"

echo "🚀 Redeploying '$PROJECT_NAME_LOWER' → https://$FULL_DOMAIN (pm2: ${PM2_NAME:-none}, port: ${PORT:-n/a})"

# ---------------------------------------------------------------------
# STEP 2: Check directory & pull latest changes
# ---------------------------------------------------------------------
if [ ! -d "$BASE_DIR/.git" ]; then
    echo "❌ Directory $BASE_DIR/.git not found. Run a full deploy first."
    exit 1
fi

echo "📥 Pulling latest changes from origin/$BRANCH..."
cd "$BASE_DIR"
git fetch origin "$BRANCH" > /dev/null 2>&1
git checkout "$BRANCH" > /dev/null 2>&1
git reset --hard "origin/$BRANCH"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ App directory $APP_DIR not found in project."
    exit 1
fi
cd "$APP_DIR"

# ---------------------------------------------------------------------
# STEP 3: Write / update .env
# ---------------------------------------------------------------------
ENV_CONTENT=""
if [ -n "$ENV_B64" ]; then
    ENV_CONTENT=$(printf '%s' "$ENV_B64" | base64 -d 2>/dev/null || true)
fi

if [ "$IS_SERVER" = true ]; then
    echo "📝 Updating .env with PORT=${PORT:-3000}..."
    printf 'PORT=%s\n' "${PORT:-3000}" > .env
    if [ -n "$ENV_CONTENT" ]; then
        printf '%s\n' "$ENV_CONTENT" >> .env
    fi
else
    if [ -n "$ENV_CONTENT" ]; then
        echo "📝 Updating .env..."
        printf '%s\n' "$ENV_CONTENT" > .env
    else
        echo "⏩ No environment variables provided. Skipping .env..."
    fi
fi

# ---------------------------------------------------------------------
# STEP 4: Install dependencies (always — lockfiles may have changed)
# ---------------------------------------------------------------------
if [ "$APP_TYPE_NORMALIZED" != "static" ]; then
    echo "🛠️  Installing dependencies ($PACKAGE_MANAGER_LOWER)..."
    export NODE_OPTIONS="--max-old-space-size=2048"

    case "$PACKAGE_MANAGER_LOWER" in
        pnpm) PKG="pnpm" ;;
        yarn) PKG="yarn" ;;
        *)    PKG="npm" ;;
    esac

    if [ "$PKG" == "npm" ] && [ -f "package-lock.json" ]; then
        INSTALL_CMD="npm ci"
    else
        INSTALL_CMD="$PKG install"
    fi

    if ! $INSTALL_CMD; then
        echo "❌ $INSTALL_CMD failed."
        exit 1
    fi
fi

# ---------------------------------------------------------------------
# STEP 5: Build (react / next / nest or TypeScript)
# ---------------------------------------------------------------------
NEEDS_BUILD=false
case "$APP_TYPE_NORMALIZED" in
    react|next|nest) NEEDS_BUILD=true ;;
    *) [[ "$TYPESCRIPT" == "true" ]] && NEEDS_BUILD=true ;;
esac

if [ "$NEEDS_BUILD" = true ] && [ "$APP_TYPE_NORMALIZED" != "static" ]; then
    if [ -n "$BUILD_SCRIPT" ] && [ "$BUILD_SCRIPT" != "n/a" ]; then
        echo "🏗️  Building app ($BUILD_SCRIPT)..."
        if ! $PKG run build > /dev/null 2>&1; then
            # Fallback: some projects define a custom script that needs the raw command
            if ! eval "$BUILD_SCRIPT" > /dev/null 2>&1; then
                echo "❌ Build failed (${BUILD_SCRIPT})."
                exit 1
            fi
        fi
    else
        echo "🏗️  Building app ($PKG run build)..."
        if ! $PKG run build; then
            echo "❌ Build failed."
            exit 1
        fi
    fi
else
    echo "⏩ No build step required for '$APP_TYPE_NORMALIZED'."
fi

# ---------------------------------------------------------------------
# STEP 6: react/static — publish build output to web root
# ---------------------------------------------------------------------
if [ "$IS_SERVER" = false ]; then
    if [ "$APP_TYPE_NORMALIZED" == "react" ]; then
        if [ -d "dist" ]; then
            BUILD_PATH="$(pwd)/dist"
        elif [ -d "build" ]; then
            BUILD_PATH="$(pwd)/build"
        else
            echo "❌ Build succeeded but neither 'dist/' nor 'build/' was produced."
            exit 1
        fi
        echo "📦 Publishing build output to $WEB_ROOT..."
        mkdir -p "$WEB_ROOT"
        cp -rf "$BUILD_PATH"/. "$WEB_ROOT"/
    else
        echo "📄 Static app — files already served from $WEB_ROOT."
    fi

    NGINX_STATIC_CONF="/etc/nginx/sites-available/$FULL_DOMAIN"
    if [ ! -f "$NGINX_STATIC_CONF" ]; then
        echo "⚙️ Creating Nginx config for $FULL_DOMAIN..."
        sudo tee "$NGINX_STATIC_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name $FULL_DOMAIN;
    root $WEB_ROOT;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
}
EOF
        sudo ln -sf "$NGINX_STATIC_CONF" "/etc/nginx/sites-enabled/"
        sudo nginx -t && sudo systemctl reload nginx
    else
        echo "⏩ Nginx config already exists for $FULL_DOMAIN."
    fi
fi

# ---------------------------------------------------------------------
# STEP 7: express/nest/next — Nginx reverse proxy + reload
# ---------------------------------------------------------------------
if [ "$IS_SERVER" = true ]; then
    if [ -z "${PORT:-}" ]; then
        echo "❌ --port is required for server apps."
        exit 1
    fi

    echo "⚙️ Updating Nginx proxy to port $PORT..."
    NGINX_CONF="/etc/nginx/sites-available/$FULL_DOMAIN"
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
        proxy_buffering off;
        proxy_read_timeout 600;
        proxy_send_timeout 600;
        gzip off;
    }
}
EOF
    sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/"
    sudo nginx -t && sudo systemctl reload nginx
fi

# ---------------------------------------------------------------------
# STEP 8: Restart PM2 service
# ---------------------------------------------------------------------
if [ "$IS_SERVER" = true ]; then
    echo "♻️ Restarting PM2 process '$PM2_NAME'..."
    if pm2 show "$PM2_NAME" > /dev/null 2>&1; then
        PORT="$PORT" pm2 restart "$PM2_NAME" --update-env > /dev/null 2>&1
    else
        if [ "$APP_TYPE_NORMALIZED" == "next" ]; then
            START_CMD="npm run start -- -p $PORT"
        else
            START_CMD="$RUN_SCRIPT"
        fi
        PORT="$PORT" pm2 start "$START_CMD" --name "$PM2_NAME" > /dev/null 2>&1
    fi
    pm2 save > /dev/null 2>&1
fi

echo "✅ Redeploy successful on https://$FULL_DOMAIN (Port: ${PORT:-static})"
