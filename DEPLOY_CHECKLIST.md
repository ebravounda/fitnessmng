# Gym24 — Checklist OBLIGATORIO Pre-Deploy

> 🚨 **5000 usuarios en produccion. CERO tolerancia a perdida de datos.**

## ANTES de cualquier deploy

### 1. Backup manual (siempre)
```bash
bash /opt/gym24/backup_gym24.sh
ls -la /opt/gym24/backups/$(date +%Y-%m-%d)/
# Debe haber: mongo-gym24.archive + uploads.tar.gz + backend.env.backup
```

### 2. Verificar estado pre-deploy
```bash
# Snapshot del estado actual
docker exec mongo-gym24 mongosh gym24 --quiet --eval '
print("Admins:", db.admins.countDocuments({}));
print("Members:", db.members.countDocuments({}));
print("Gyms:", db.gyms.countDocuments({}));
print("Access logs:", db.access_logs.countDocuments({}));
print("Online classes:", db.online_classes.countDocuments({}));
'

du -sh /opt/gym24/uploads/
ls /opt/gym24/uploads/gymaccess/logos/ | wc -l
```

Guarda esos numeros. Despues del deploy, debe coincidir.

---

## DURANTE el deploy

### 3. Regla de oro: NUNCA usar `docker rm gym24-api` sin antes:
- Verificar que `.env` tiene **TODAS** las variables necesarias:
  - `MONGO_URL=mongodb://mongo-gym24:27017`
  - `DB_NAME=gym24`
  - `JWT_SECRET=...`
  - `QR_SECRET=...`
  - `CORS_ORIGINS=https://gym24.app,https://www.gym24.app`
  - `UPLOAD_DIR=/opt/gym24/uploads`
  - `GROQ_API_KEY=gsk_...`
- Verificar que los **bind mounts** estan en el `docker run`:
  - `-v /opt/gym24/uploads:/opt/gym24/uploads`
  - `-v /opt/gym24/videos:/app/videos`
- Verificar que esta en la red correcta:
  - `--network gym24-net`

### 4. Comando seguro para recrear contenedor
```bash
docker stop gym24-api
docker rm gym24-api

docker run -d \
  --name gym24-api \
  --restart always \
  --network gym24-net \
  -p 8003:8001 \
  --env-file /opt/gym24/backend/.env \
  -v /opt/gym24/uploads:/opt/gym24/uploads \
  -v /opt/gym24/videos:/app/videos \
  gym24-api
```

---

## DESPUES del deploy

### 5. Verificacion obligatoria
```bash
# Backend vivo
curl https://api.gym24.app/api/
# Debe responder: {"message":"Gym Access Control API","version":"2.0.0"}

# Login funciona
curl -s -X POST https://api.gym24.app/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"info@gym24.es","password":"admin123"}' | head -c 200
# Debe responder con token

# Datos intactos (comparar con snapshot del paso 2)
docker exec mongo-gym24 mongosh gym24 --quiet --eval '
print("Admins:", db.admins.countDocuments({}));
print("Members:", db.members.countDocuments({}));
print("Gyms:", db.gyms.countDocuments({}));
'

# Uploads intactos
du -sh /opt/gym24/uploads/
ls /opt/gym24/uploads/gymaccess/logos/ | wc -l

# Bot Groq responde
# (probar manualmente desde admin → AI Assistant)
```

---

## EN CASO DE EMERGENCIA - Restaurar backup

```bash
# Ver backups disponibles
ls /opt/gym24/backups/

# Restaurar MongoDB (PIERDE datos posteriores al backup!)
cat /opt/gym24/backups/YYYY-MM-DD/mongo-gym24.archive | \
  docker exec -i mongo-gym24 mongorestore --archive --drop

# Restaurar uploads
rm -rf /opt/gym24/uploads.bak
mv /opt/gym24/uploads /opt/gym24/uploads.bak  # backup por si acaso
tar -xzf /opt/gym24/backups/YYYY-MM-DD/uploads.tar.gz -C /opt/gym24/

# Restaurar .env
cp /opt/gym24/backups/YYYY-MM-DD/backend.env.backup /opt/gym24/backend/.env

# Recrear contenedor
docker stop gym24-api && docker rm gym24-api
# (usar el `docker run` del paso 4)
```

---

## CONFIGURACION CRITICA (NO BORRAR)

### Contenedores
- `gym24-api` — backend (puerto 8003)
- `mongo-gym24` — MongoDB (127.0.0.1:27019)
- Red Docker: `gym24-net`

### NO TOCAR JAMAS (son de otros proyectos)
- Contenedor `mongo` (puerto 27017) → **IngresoQR**
- Contenedor `mongo-tramilex` (puerto 27018) → **Tramilex**
- Carpeta `/opt/gymaccess/uploads/` → uploads IngresoQR
- BDs `gymaccess`, `tramilex` → otros clientes

### Rutas Gym24
- Backend code: `/opt/gym24/backend/`
- Frontend httpdocs: `/var/www/vhosts/gym24.app/httpdocs/`
- Repo git: `/opt/gym24/repo/`
- Uploads: `/opt/gym24/uploads/`
- Videos: `/opt/gym24/videos/`
- Backups: `/opt/gym24/backups/`
