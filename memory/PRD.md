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

### Sesión 3 (Abr 2026)
- Módulo de video en accesos implementado
- Backend: upload/stream/list/cleanup endpoints para videos de 4s
- Cron automático: borra videos >30 días a medianoche
- Frontend: botón "Video" en historial accesos + modal reproductor
- Frontend: opción "Videos de Acceso" en menú de cada socio
- Script Raspberry Pi actualizado con grabación ffmpeg en entradas
- Solo graba en ENTRADAS, no salidas
- Storage: /opt/gym24/videos en Plesk (~7.5GB max con 500 socios)

### Sesión 5 (May 2026)
- Mapa corporal SVG interactivo (frontal + posterior) con 15 zonas musculares
- ~50 ejercicios en español con máquinas, series, reps, descripción
- Vista frontal: pecho, hombros, bíceps, antebrazos, abdomen, cuádriceps, tibiales
- Vista posterior: trapecios, dorsales, espalda media, tríceps, lumbares, glúteos, isquiotibiales, gemelos
- Cards expandibles con animaciones framer-motion
- Botones rápidos de zona debajo del mapa corporal

### Sesión 6 (May 2026)
- RFID Live Capture: modal con grabación en vivo, input auto-focus, captura automática del UID
- Clases Online: admin sube videos, socios los ven en PWA (Netflix fitness)
- Backend: /api/classes/online (CRUD + stream), /api/exercises/custom (CRUD)
- Imágenes ejercicios: integración con free-exercise-db (800+ ejercicios con fotos)
- Quick nav PWA: añadido "Clases Online"
- Sidebar admin: añadido "Clases Online" con icono Video

### Sesión 7 (May 2026)
- Bot AI actualizado con documentación completa de Clases Online, Rutinas y RFID
- System prompt ampliado con guías paso a paso para las 3 nuevas funcionalidades
- 19 funcionalidades documentadas en el bot
