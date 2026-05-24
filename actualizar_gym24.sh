#!/bin/bash
# ============================================
# Gym24 - Script de Actualizacion
# Ejecutar desde SSH del servidor Plesk
# ============================================

# === CONFIGURACION ===
REPO_URL="https://github.com/ebravounda/fitnessmng.git"
REPO_DIR="/opt/gym24/repo"
BACKEND_DIR="/opt/gym24/backend"
FRONTEND_HTTPDOCS="/var/www/vhosts/gym24.app/httpdocs"
DOCKER_CONTAINER="gym24-api"
DOCKER_IMAGE="gym24-api"
API_DOMAIN="api.gym24.app"
APP_DOMAIN="gym24.app"

echo "==========================================="
echo "  Gym24 - Actualizacion de Produccion"
echo "==========================================="
echo ""

# 1. Clonar o actualizar repositorio
if [ -d "$REPO_DIR/.git" ]; then
    echo "[1/5] Actualizando repositorio..."
    cd "$REPO_DIR"
    git pull origin main
else
    echo "[1/5] Clonando repositorio por primera vez..."
    mkdir -p "$REPO_DIR"
    git clone "$REPO_URL" "$REPO_DIR"
fi

if [ $? -ne 0 ]; then
    echo "ERROR: git pull/clone fallo."
    exit 1
fi
echo "OK - Codigo descargado"
echo ""

# 2. Actualizar archivos del backend
echo "[2/5] Actualizando backend..."
mkdir -p "$BACKEND_DIR"
mkdir -p "$BACKEND_DIR/routes"
mkdir -p "$BACKEND_DIR/downloads"

# Copiar archivos Python del backend
cp "$REPO_DIR/backend/server.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/auth.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/database.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/models.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/qr_utils.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/storage.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/generate_docs.py" "$BACKEND_DIR/" 2>/dev/null
cp "$REPO_DIR/backend/redsys_utils.py" "$BACKEND_DIR/" 2>/dev/null
cp -r "$REPO_DIR/backend/routes/"* "$BACKEND_DIR/routes/"
cp -r "$REPO_DIR/backend/downloads/"* "$BACKEND_DIR/downloads/" 2>/dev/null
cp "$REPO_DIR/backend/requirements-prod.txt" "$BACKEND_DIR/requirements-prod.txt" 2>/dev/null
cp "$REPO_DIR/backend/Dockerfile" "$BACKEND_DIR/" 2>/dev/null
echo "OK - Archivos backend copiados"
echo ""

# 3. Crear .env del backend si no existe
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "[3/5] Creando .env del backend (PRIMERA VEZ)..."
    cat > "$BACKEND_DIR/.env" << 'ENVFILE'
MONGO_URL=mongodb://172.17.0.1:27017
DB_NAME=gym24
JWT_SECRET=CAMBIA_ESTO_POR_UNA_CLAVE_MUY_LARGA_Y_SEGURA_2024
QR_SECRET=OTRA_CLAVE_DIFERENTE_PARA_QR_2024
CORS_ORIGINS=https://gym24.app,https://www.gym24.app
ENVFILE
    echo "IMPORTANTE: Edita $BACKEND_DIR/.env con tus claves secretas!"
else
    echo "[3/5] .env ya existe - preservando configuracion"
fi
echo ""

# 4. Reiniciar backend Docker
echo "[4/5] Reiniciando backend Docker..."
if docker ps -a --format '{{.Names}}' | grep -q "$DOCKER_CONTAINER"; then
    docker restart "$DOCKER_CONTAINER"
    if [ $? -ne 0 ]; then
        echo "Reconstruyendo imagen Docker..."
        docker stop "$DOCKER_CONTAINER" 2>/dev/null
        docker rm "$DOCKER_CONTAINER" 2>/dev/null
        cd "$BACKEND_DIR"
        docker build -t "$DOCKER_IMAGE" .
        docker run -d \
            --name "$DOCKER_CONTAINER" \
            --restart always \
            -p 8003:8001 \
            --env-file .env \
            "$DOCKER_IMAGE"
    fi
else
    echo "Creando contenedor Docker por primera vez..."
    cd "$BACKEND_DIR"
    docker build -t "$DOCKER_IMAGE" .
    docker run -d \
        --name "$DOCKER_CONTAINER" \
        --restart always \
        -p 8003:8001 \
        --env-file .env \
        "$DOCKER_IMAGE"
fi
echo "OK - Backend reiniciado"
echo ""

# 5. Actualizar frontend
echo "[5/5] Sincronizando frontend..."

# Rebuild siempre el frontend en el servidor con la URL de produccion
# para evitar que se cuele la URL del preview de Emergent
if command -v yarn >/dev/null 2>&1 && [ -f "$REPO_DIR/frontend/package.json" ]; then
    echo "Reconstruyendo frontend con URL produccion..."
    cd "$REPO_DIR/frontend"
    yarn install --frozen-lockfile 2>&1 | tail -5
    REACT_APP_BACKEND_URL="https://$API_DOMAIN" yarn build 2>&1 | tail -3
fi

if [ -d "$REPO_DIR/frontend/build" ]; then
    # Preservar .htaccess si existe
    if [ -f "$FRONTEND_HTTPDOCS/.htaccess" ]; then
        cp "$FRONTEND_HTTPDOCS/.htaccess" /tmp/gym24_htaccess_backup
    fi
    
    # Limpiar httpdocs
    find "$FRONTEND_HTTPDOCS" -mindepth 1 ! -name '.htaccess' -delete 2>/dev/null
    
    # Copiar build
    cp -r "$REPO_DIR/frontend/build/"* "$FRONTEND_HTTPDOCS/"
    
    # Restaurar .htaccess
    if [ -f /tmp/gym24_htaccess_backup ]; then
        cp /tmp/gym24_htaccess_backup "$FRONTEND_HTTPDOCS/.htaccess"
    fi
    
    # Crear .htaccess para React Router si no existe
    if [ ! -f "$FRONTEND_HTTPDOCS/.htaccess" ]; then
        cat > "$FRONTEND_HTTPDOCS/.htaccess" << 'HTACCESS'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
HTACCESS
    fi
    
    echo "OK - Frontend copiado a $FRONTEND_HTTPDOCS"
else
    echo "AVISO: No se encontro frontend/build/ en el repo."
fi
echo ""

# Verificar
echo "==========================================="
echo "  Verificando..."
echo "==========================================="
sleep 3
HEALTH=$(curl -s "https://$API_DOMAIN/api/" 2>/dev/null)
if echo "$HEALTH" | grep -q "Gym Access"; then
    echo "  Backend: OK"
else
    echo "  Backend: REVISAR (docker logs $DOCKER_CONTAINER)"
fi
echo "  Frontend: https://$APP_DOMAIN"
echo "==========================================="
echo "  Actualizacion completada!"
echo ""
echo "  Admin: info@gym24.es / admin123"
echo "==========================================="
