#!/bin/bash
# ============================================
# Gym24 - Backup Diario Automatico
# ============================================
# Hace backup de:
#   - MongoDB gym24 (mongodump)
#   - Uploads (/opt/gym24/uploads)
# Guarda en: /opt/gym24/backups/YYYY-MM-DD/
# Retiene: ultimos 30 dias
# ============================================

BACKUP_ROOT="/opt/gym24/backups"
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup Gym24..."

# 1. Backup MongoDB
echo "  - MongoDB..."
docker exec mongo-gym24 mongodump --db=gym24 --archive --quiet > "$BACKUP_DIR/mongo-gym24.archive" 2>/dev/null
if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_DIR/mongo-gym24.archive" | cut -f1)
    echo "    OK ($SIZE)"
else
    echo "    ERROR en mongodump"
fi

# 2. Backup Uploads
echo "  - Uploads..."
if [ -d "/opt/gym24/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads.tar.gz" -C /opt/gym24 uploads 2>/dev/null
    SIZE=$(du -h "$BACKUP_DIR/uploads.tar.gz" | cut -f1)
    echo "    OK ($SIZE)"
fi

# 3. Backup .env (importante para JWT_SECRET, GROQ_API_KEY)
echo "  - Config (.env)..."
if [ -f "/opt/gym24/backend/.env" ]; then
    cp /opt/gym24/backend/.env "$BACKUP_DIR/backend.env.backup"
    echo "    OK"
fi

# 4. Limpiar backups viejos (>30 dias)
echo "  - Limpiando backups >$RETENTION_DAYS dias..."
find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null

# 5. Resumen
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
TOTAL_BACKUPS=$(ls -d $BACKUP_ROOT/20* 2>/dev/null | wc -l)
echo "[$(date)] Backup completado: $BACKUP_DIR ($TOTAL_SIZE)"
echo "Total de backups en disco: $TOTAL_BACKUPS"

# ============================================
# RESTAURAR (referencia):
#
# MongoDB:
#   cat /opt/gym24/backups/YYYY-MM-DD/mongo-gym24.archive | \
#     docker exec -i mongo-gym24 mongorestore --archive --drop
#
# Uploads:
#   tar -xzf /opt/gym24/backups/YYYY-MM-DD/uploads.tar.gz -C /opt/gym24/
#
# Config:
#   cp /opt/gym24/backups/YYYY-MM-DD/backend.env.backup /opt/gym24/backend/.env
#   docker stop gym24-api && docker rm gym24-api
#   # ...recrear contenedor con docker run
# ============================================
