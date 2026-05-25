#!/bin/bash
# ============================================
# Gym24 - Backup Automatico
# ============================================
# Hace backup de:
#   - MongoDB gym24 (mongodump)
#   - Uploads (/opt/gym24/uploads)
#   - .env del backend
# Guarda en: /opt/gym24/backups/YYYY-MM-DD_HHMMSS/
# Retiene: SOLO los 2 ultimos backups (borra automaticamente los viejos)
# ============================================

BACKUP_ROOT="/opt/gym24/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
KEEP_BACKUPS=2  # Solo guarda los 2 ultimos

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

# 3. Backup .env (importante: JWT_SECRET, GROQ_API_KEY)
echo "  - Config (.env)..."
if [ -f "/opt/gym24/backend/.env" ]; then
    cp /opt/gym24/backend/.env "$BACKUP_DIR/backend.env.backup"
    echo "    OK"
fi

# 4. Mantener SOLO los ultimos N backups (borra los mas viejos)
echo "  - Limpiando backups antiguos (manteniendo solo $KEEP_BACKUPS)..."
cd "$BACKUP_ROOT"
# Listar carpetas ordenadas por fecha (mas reciente primero), saltar las primeras $KEEP_BACKUPS, borrar resto
ls -1dt 20*/ 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -rf 2>/dev/null

# 5. Resumen
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
TOTAL_BACKUPS=$(ls -d $BACKUP_ROOT/20*/ 2>/dev/null | wc -l)
TOTAL_DISK=$(du -sh "$BACKUP_ROOT" 2>/dev/null | cut -f1)

echo ""
echo "[$(date)] Backup completado"
echo "  Nuevo backup:  $BACKUP_DIR ($TOTAL_SIZE)"
echo "  Total backups: $TOTAL_BACKUPS (limite: $KEEP_BACKUPS)"
echo "  Espacio total: $TOTAL_DISK"
echo ""
echo "Backups disponibles:"
ls -1dt $BACKUP_ROOT/20*/ 2>/dev/null

# ============================================
# RESTAURAR (referencia):
#
# MongoDB:
#   cat /opt/gym24/backups/<carpeta>/mongo-gym24.archive | \
#     docker exec -i mongo-gym24 mongorestore --archive --drop
#
# Uploads:
#   tar -xzf /opt/gym24/backups/<carpeta>/uploads.tar.gz -C /opt/gym24/
#
# Config:
#   cp /opt/gym24/backups/<carpeta>/backend.env.backup /opt/gym24/backend/.env
#   # Luego: docker stop gym24-api && docker rm gym24-api
#   # Y recrear con docker run
# ============================================
