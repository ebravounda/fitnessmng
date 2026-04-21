# Gym24 - Sistema de Control de Acceso

Sistema completo de control de acceso con QR dinámico, panel de administración y app PWA para socios.

## Credenciales por Defecto
- **Admin**: info@gym24.es / admin123

## Estructura
- **Backend**: FastAPI + MongoDB (Docker en Plesk)
- **Frontend**: React PWA (build estático en Plesk)
- **API**: https://api.gym24.app
- **App**: https://gym24.app

## Deploy

### Desde SSH del servidor:
```bash
# Primera vez:
git clone https://github.com/ebravounda/fitnessmng.git /opt/gym24/repo
cd /opt/gym24/repo
chmod +x actualizar_gym24.sh
./actualizar_gym24.sh

# Actualizaciones posteriores:
cd /opt/gym24/repo
./actualizar_gym24.sh
```

### Configuración Plesk necesaria:

**1. Frontend (gym24.app)**
- Document root: `httpdocs/`
- Apache Additional Directives (HTTP + HTTPS):
```
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```
- SSL: Let's Encrypt + Redirect HTTP to HTTPS

**2. Backend API (api.gym24.app)**
- Nginx Additional Directives:
```nginx
location / {
    proxy_pass http://127.0.0.1:8002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 90;
}
```
- SSL: Let's Encrypt + Redirect HTTP to HTTPS

**NOTA**: El backend usa puerto **8002** (para no conflictar con ingresoqr.com en 8001)
