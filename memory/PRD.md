# Gym24 - PRD

## Problema Original
Clonar sistema IngresoQR (SaaS multi-tenant de control de acceso para gimnasios) al dominio gym24.app con rediseño visual completo. Debe ser TOTALMENTE INDEPENDIENTE de IngresoQR (BD, uploads, red Docker, todo aislado).

## Arquitectura Producción (Plesk VPS)
- **Backend**: FastAPI + Docker (`gym24-api`, puerto 8003→8001)
- **Frontend**: React build → `/var/www/vhosts/gym24.app/httpdocs/`
- **MongoDB**: Contenedor `mongo-gym24` (127.0.0.1:27019→27017)
- **Red Docker**: `gym24-net` (compartida solo entre `gym24-api` y `mongo-gym24`)
- **Uploads**: `/opt/gym24/uploads` (bind mount, AISLADO de IngresoQR)
- **Videos**: `/opt/gym24/videos` (bind mount)
- **Dominios**: gym24.app (frontend) + api.gym24.app (backend)

## ⚠️ REGLA CRÍTICA
**NUNCA tocar nada de IngresoQR**:
- Contenedor `mongo` (puerto 27017) → IngresoQR
- Contenedor `mongo-tramilex` (puerto 27018) → Tramilex
- Carpeta `/opt/gymaccess/uploads/` → uploads de IngresoQR
- BD `gymaccess` → IngresoQR

## .env del Backend (Producción)
```
MONGO_URL=mongodb://mongo-gym24:27017
DB_NAME=gym24
JWT_SECRET=<cambiar por openssl rand -hex 32>
QR_SECRET=<cambiar por openssl rand -hex 32>
CORS_ORIGINS=https://gym24.app,https://www.gym24.app
UPLOAD_DIR=/opt/gym24/uploads
GROQ_API_KEY=<key del usuario>
```

## Credenciales
- Super Admin: info@gym24.es / admin123
- Otros admins: fitnessmanager@gym24.es, demo@mixedsportcenter.es, demo@saladearmas.es, demo@boxakyles.com

## Deploy Comando
```bash
cd /opt/gym24/repo && git pull origin main
bash /opt/gym24/repo/actualizar_gym24.sh
```

## Comando para recrear contenedor (si se rompe)
```bash
docker stop gym24-api && docker rm gym24-api
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

## Features Completadas

### Sesiones 1-7 (Abr-May 2026)
- Clonado, deploy Docker, nginx proxy api.gym24.app
- Rediseño completo: dark + orange (#FF6600), tipografía Outfit + DM Sans
- Renombrado IngresoQR → Gym24, favicon/logos PWA
- Landing, Admin Login, PWA Login rediseñados
- Tipo negocio Piscina añadido, Coworking eliminado
- Módulo video accesos (4s grabación entrada, cron limpieza 30d)
- Mapa corporal SVG interactivo (15 zonas, 50+ ejercicios)
- Clases Online (admin upload + YouTube, PWA viewer)
- RFID Live Capture (modal con auto-focus)
- Bot AI Groq con system prompt completo (Clases, Rutinas, RFID)
- Manual Super Admin PDF
- Landing redesign con AI hero image

### Sesión 8 (May 25, 2026) — Deploy Producción
- **Bug crítico FIX**: Frontend hardcoded URL preview Emergent
  - `craco.config.js` carga `.env.production` primero cuando `NODE_ENV=production`
  - Creado `.env.production` con `REACT_APP_BACKEND_URL=https://api.gym24.app`
  - `actualizar_gym24.sh` ahora rebuild en servidor con URL correcta
- **Bug crítico FIX**: MongoDB connection
  - Backend apuntaba a `172.17.0.1:27017` (vacío) → cambió a `mongo-gym24:27017` vía red Docker `gym24-net`
- **Bug crítico FIX**: Uploads aislados
  - Antes: `/opt/gymaccess/uploads` (compartido con IngresoQR, archivos perdidos al rebuild)
  - Ahora: `/opt/gym24/uploads` con bind mount + `UPLOAD_DIR` en .env

## Backlog

### P0 (próxima sesión)
- Ejecutar testing_agent_v3_fork para validar E2E backend + frontend
- Re-subir logos de gyms (FitnessManager, MIXED Sport Center, Sala de Armas)
- Re-subir fotos del TPV

### P1
- Rotar JWT_SECRET y QR_SECRET con `openssl rand -hex 32`
- Resolver error `ResizeObserver` estructuralmente (actualmente CSS hack)
- Reemplazar URLs hotlinked de ExerciseDB por assets locales

### P2
- Logo dinámico en sidebar admin
- Modo kiosko para piscinas
- Refactor cron jobs (mover fuera del event loop principal)
