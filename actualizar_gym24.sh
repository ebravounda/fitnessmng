#!/bin/bash
# ============================================
# Gym24 - Script de Actualizacion Produccion
# ============================================
# Ejecutar desde SSH del servidor Plesk
# Hace BACKUP automatico antes de cualquier cambio
# ============================================

set -e  # Salir si hay error

# === CONFIGURACION ===
REPO_URL="https://github.com/ebravounda/fitnessmng.git"
REPO_DIR="/opt/gym24/repo"
BACKEND_DIR="/opt/gym24/backend"
FRONTEND_HTTPDOCS="/var/www/vhosts/gym24.app/httpdocs"
DOCKER_CONTAINER="gym24-api"
DOCKER_IMAGE="gym24-api"
API_DOMAIN="api.gym24.app"
APP_DOMAIN="gym24.app"
BACKUP_SCRIPT="/opt/gym24/backup_gym24.sh"

echo "==========================================="
echo "  Gym24 - Actualizacion de Produccion"
echo "==========================================="
echo ""

# =====================================================
# PASO 0: BACKUP OBLIGATORIO ANTES DE TOCAR NADA
# =====================================================
echo "[0/6] Backup pre-deploy..."
if [ -f "$BACKUP_SCRIPT" ]; then
    bash "$BACKUP_SCRIPT"
else
    echo "  ADVERTENCIA: $BACKUP_SCRIPT no existe."
    read -p "  Continuar SIN backup? (escribir 'SI' para continuar): " CONFIRM
    if [ "$CONFIRM" != "SI" ]; then
        echo "  Cancelado por seguridad."
        exit 1
    fi
fi
echo ""

# =====================================================
# PASO 1: Snapshot del estado (para comparar despues)
# =====================================================
echo "[1/6] Estado actual (snapshot pre-deploy):"
docker exec mongo-gym24 mongosh gym24 --quiet --eval '
print("  Admins:", db.admins.countDocuments({}));
print("  Members:", db.members.countDocuments({}));
print("  Gyms:", db.gyms.countDocuments({}));
print("  Access logs:", db.access_logs.countDocuments({}));
' 2>/dev/null || echo "  (No se pudo leer mongo)"
echo "  Uploads:" $(du -sh /opt/gym24/uploads 2>/dev/null | cut -f1)
echo ""

# =====================================================
# PASO 2: Actualizar repositorio
# =====================================================
if [ -d "$REPO_DIR/.git" ]; then
    echo "[2/6] Actualizando repositorio..."
    cd "$REPO_DIR"
    git pull origin main
else
    echo "[2/6] Clonando repositorio por primera vez..."
    mkdir -p "$REPO_DIR"
    git clone "$REPO_URL" "$REPO_DIR"
fi
echo "OK"
echo ""

# =====================================================
# PASO 3: Actualizar archivos backend (NO toca .env)
# =====================================================
echo "[3/6] Actualizando archivos backend..."
mkdir -p "$BACKEND_DIR"
mkdir -p "$BACKEND_DIR/routes"
mkdir -p "$BACKEND_DIR/downloads"

cp "$REPO_DIR/backend/server.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/auth.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/database.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/models.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/qr_utils.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/storage.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/generate_docs.py" "$BACKEND_DIR/" 2>/dev/null || true
cp "$REPO_DIR/backend/generate_manual.py" "$BACKEND_DIR/" 2>/dev/null || true
cp "$REPO_DIR/backend/redsys_utils.py" "$BACKEND_DIR/" 2>/dev/null || true
cp -r "$REPO_DIR/backend/routes/"* "$BACKEND_DIR/routes/"
cp -r "$REPO_DIR/backend/downloads/"* "$BACKEND_DIR/downloads/" 2>/dev/null || true
cp "$REPO_DIR/backend/requirements-prod.txt" "$BACKEND_DIR/" 2>/dev/null || true
cp "$REPO_DIR/backend/Dockerfile" "$BACKEND_DIR/" 2>/dev/null || true

# NUNCA tocar .env - solo verificar que existe
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo ""
    echo "ERROR: $BACKEND_DIR/.env NO EXISTE."
    echo "El .env contiene secretos (JWT_SECRET, GROQ_API_KEY) que no se pueden regenerar."
    echo "Restaura desde backup antes de continuar:"
    echo "  cp /opt/gym24/backups/<fecha>/backend.env.backup $BACKEND_DIR/.env"
    exit 1
fi
echo "OK - Archivos backend copiados (.env preservado)"
echo ""

# =====================================================
# PASO 4: Reconstruir imagen Docker (solo si requirements cambiaron)
# =====================================================
echo "[4/6] Verificando si necesita rebuild de imagen..."
NEEDS_REBUILD=0
if [ -f "$BACKEND_DIR/requirements-prod.txt.last" ]; then
    if ! diff -q "$BACKEND_DIR/requirements-prod.txt" "$BACKEND_DIR/requirements-prod.txt.last" > /dev/null 2>&1; then
        NEEDS_REBUILD=1
        echo "  requirements-prod.txt cambio. Rebuild necesario."
    else
        echo "  requirements-prod.txt sin cambios."
    fi
else
    NEEDS_REBUILD=1
    echo "  Primera vez. Rebuild necesario."
fi

if [ "$NEEDS_REBUILD" = "1" ]; then
    echo "  Reconstruyendo imagen Docker..."
    cd "$BACKEND_DIR"
    docker build -t "$DOCKER_IMAGE" . 2>&1 | tail -10
    cp "$BACKEND_DIR/requirements-prod.txt" "$BACKEND_DIR/requirements-prod.txt.last"
fi

# Recrear contenedor con TODOS los mounts y red correctos
echo "  Recreando contenedor (con bind mounts seguros)..."
docker stop "$DOCKER_CONTAINER" 2>/dev/null || true
docker rm "$DOCKER_CONTAINER" 2>/dev/null || true

# Asegurar red Docker
docker network create gym24-net 2>/dev/null || true
docker network connect gym24-net mongo-gym24 2>/dev/null || true

# Asegurar carpetas
mkdir -p /opt/gym24/uploads
mkdir -p /opt/gym24/videos

docker run -d \
    --name "$DOCKER_CONTAINER" \
    --restart always \
    --network gym24-net \
    -p 8003:8001 \
    --env-file "$BACKEND_DIR/.env" \
    -v /opt/gym24/uploads:/opt/gym24/uploads \
    -v /opt/gym24/videos:/opt/gym24/videos \
    "$DOCKER_IMAGE"

echo "OK - Backend desplegado"
echo ""

# =====================================================
# PASO 5: Actualizar frontend (rebuild en servidor)
# =====================================================
echo "[5/6] Actualizando frontend..."
if command -v yarn >/dev/null 2>&1 && [ -f "$REPO_DIR/frontend/package.json" ]; then
    cd "$REPO_DIR/frontend"
    echo "  Instalando dependencias..."
    yarn install --frozen-lockfile 2>&1 | tail -3
    echo "  Construyendo con URL produccion..."
    NODE_OPTIONS="--max-old-space-size=1536" REACT_APP_BACKEND_URL="https://$API_DOMAIN" yarn build 2>&1 | tail -3
fi

if [ -d "$REPO_DIR/frontend/build" ]; then
    if [ -f "$FRONTEND_HTTPDOCS/.htaccess" ]; then
        cp "$FRONTEND_HTTPDOCS/.htaccess" /tmp/gym24_htaccess_backup
    fi
    find "$FRONTEND_HTTPDOCS" -mindepth 1 ! -name '.htaccess' -delete 2>/dev/null
    cp -r "$REPO_DIR/frontend/build/"* "$FRONTEND_HTTPDOCS/"
    if [ -f /tmp/gym24_htaccess_backup ]; then
        cp /tmp/gym24_htaccess_backup "$FRONTEND_HTTPDOCS/.htaccess"
    fi
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
    echo "OK - Frontend desplegado"
fi
echo ""

# =====================================================
# PASO 6: Verificacion post-deploy
# =====================================================
echo "[6/6] Verificacion post-deploy..."
sleep 6

# Backend vivo
HEALTH=$(curl -s "https://$API_DOMAIN/api/" 2>/dev/null)
if echo "$HEALTH" | grep -q "Gym Access"; then
    echo "  Backend: OK"
else
    echo "  Backend: FALLO - revisar: docker logs $DOCKER_CONTAINER"
fi

# Datos intactos (comparar contra snapshot inicial)
echo "  Estado post-deploy:"
docker exec mongo-gym24 mongosh gym24 --quiet --eval '
print("    Admins:", db.admins.countDocuments({}));
print("    Members:", db.members.countDocuments({}));
print("    Gyms:", db.gyms.countDocuments({}));
' 2>/dev/null

echo "    Uploads:" $(du -sh /opt/gym24/uploads 2>/dev/null | cut -f1)
echo ""

echo "==========================================="
echo "  Actualizacion completada!"
echo "==========================================="
echo "  Frontend: https://$APP_DOMAIN"
echo "  API:      https://$API_DOMAIN"
echo "  Admin:    info@gym24.es"
echo ""
echo "  Backup guardado en: /opt/gym24/backups/$(date +%Y-%m-%d)/"
echo "==========================================="
