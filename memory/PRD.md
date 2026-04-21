# Gym24 - PRD

## Problema Original
Clonar sistema IngresoQR (SaaS multi-tenant de control de acceso para gimnasios) al dominio gym24.app con rediseño visual completo para que no se parezca al original.

## Arquitectura
- **Backend**: FastAPI + MongoDB (Docker en Plesk, puerto 8003)
- **Frontend**: React + Tailwind (build estático en Plesk httpdocs)
- **Producción**: api.gym24.app (backend), gym24.app (frontend)
- **MongoDB**: Contenedor separado mongo-gym24 (puerto 27019)
- **Servidor**: Mismo servidor que ingresoqr.com (Plesk)

## Credenciales
- Super Admin: info@gym24.es / admin123

## Deploy
```bash
cd /opt/gym24/repo && git pull origin main
cp -r frontend/build/* /var/www/vhosts/gym24.app/httpdocs/
docker restart gym24-api
```

## Features Completadas

### Sesión 1 (Abr 2026)
- Clonado repo iqa completo al workspace
- Cambio de admin email a info@gym24.es
- Deploy Docker en Plesk (gym24-api puerto 8003, mongo-gym24 puerto 27019)
- Configuración nginx proxy para api.gym24.app
- Rediseño colores: #E1FF01 (verde lima) → #FF6600 (naranja)
- Renombrado IngresoQR → Gym24 en todo el frontend
- Nuevo favicon/logos PWA con logo F24
- Fuentes: Outfit (headings) + DM Sans (body) — distintas a IngresoQR
- Landing page: diseño con gradientes radiales, grid pattern, logo prominente
- Admin Login: layout split-screen (izquierda decorativa, derecha formulario)
- PWA Login: indicadores de código con dots, background effects
- Nuevo tipo de negocio: Piscina (usuarios, abonos, tarifas, socorristas, taquilla, aforo)
- Eliminado modelo Coworking
- Eliminada sección "Despliegue Backend" de Configuración
- Monitor RPi simplificado: solo IP pública, IP local, estado online/offline
- Nuevos estilos CSS: stat-cards con gradientes, botones con sombra naranja, badges con bordes

## Backlog

### P0 - En progreso
- Acabar rediseño PWA Home (QR + stats inspirados en Fitness 24 Manager)
- Rediseñar dashboard cards admin

### P1
- Tarifa de acceso diario para piscinas
- PWA bottom nav con iconos naranja estilizados

### P2
- Logo dinámico en sidebar admin
- Modo kiosko para piscinas (venta de accesos diarios desde tablet)

### Sesión 2 (Abr 2026)
- Rediseño completo PWA Home: Card QR estilo Fitness 24 Manager, quick nav con iconos naranja
- PWA Bottom Nav: indicador naranja activo (línea + fondo), iconos naranja
- PWA Login: dots indicadores, botón que se activa al completar código
- Dashboard Admin: cards con iconos con bordes de color, tipografía Outfit
- PWA Layout: header minimalizado
- Tipo negocio "Piscina" añadido, "Coworking" eliminado
- "Despliegue Backend" eliminado de Settings
- Monitor RPi simplificado (IP pública, IP local, estado)
