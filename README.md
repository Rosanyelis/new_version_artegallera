# Arte Gallera

Plataforma de eventos, transmisiones y apuestas construida como un monolito modular con AdonisJS y React.

## Estructura

- AdonisJS: backend, API versionada y panel administrativo Edge.
- React: landing pública en `resources/client`, integrada mediante Vite.
- PostgreSQL: fuente de verdad para usuarios, apuestas y operaciones financieras.
- Redis: cache, pub/sub y transporte del tiempo real (AdonisJS Transmit).
- MediaMTX: servidor local de desarrollo para RTMP/HLS.

## Desarrollo

```sh
npm install
cp .env.example .env
node ace generate:key
docker compose up -d
npm run dev
```

La aplicación queda disponible en `http://localhost:3333`. El panel administrativo opera bajo `/admin`.

El PostgreSQL local usa el puerto `5433` para evitar conflictos con otras instalaciones. El limiter usa memoria en `.env` de desarrollo y Redis debe configurarse como `LIMITER_STORE=redis` en entornos distribuidos. El tiempo real usa el transporte Redis de AdonisJS Transmit (SSE), así que Redis debe estar disponible incluso en desarrollo.

La recuperación de contraseña usa Resend y expone `POST /api/v1/auth/forgot-password` y `POST /api/v1/auth/reset-password`. El API nunca devuelve el token; solo se almacena su hash y vence después de 60 minutos.

La wallet expone `GET /api/v1/wallet` y `GET /api/v1/wallet/transactions`. Los ajustes administrativos usan `POST /api/v1/admin/wallets/adjust` con permisos, clave de idempotencia y auditoría.

El panel operativo Edge está disponible en `/admin` para usuarios con el permiso `admin.access`. Desde allí se crean eventos, rondas y se ejecutan sus transiciones operativas, además de la administración complementaria:

- `/admin/users` y `/admin/users/:id` — gestión de usuarios con filtros, detalle de wallet/apuestas/roles y suspensión o ajuste de saldo con doble confirmación (escribiendo el correo del usuario).
- `/admin/moderation` — moderación de chat (ocultar, restaurar, eliminar) con auditoría.
- `/admin/reports/events`, `/admin/reports/bets`, `/admin/reports/financial` y `/admin/reports/users` — reportes con filtros por rango de fechas y exportación CSV.
- `/admin/audit` — consulta de solo lectura del registro de auditoría inmutable.

Los permisos por sección son `users.read`/`users.manage`, `chat.moderate`, `reports.read`, `audit.read` y `wallets.manage`. El seeder `admin_seeder` crea el administrador inicial desde `ADMIN_EMAIL`/`ADMIN_PASSWORD` (solo desarrollo).

Las apuestas usan pool por lado y exponen `POST /api/v1/events/:eventId/rounds/:roundId/bets`, `GET /api/v1/bets`, `GET /api/v1/events/:eventId/rounds/:roundId/result` y `POST /api/v1/admin/rounds/:roundId/settle`.

El cliente React requiere sesión para entrar a `/eventos/:slug`. Su alcance se limita a transmisión HLS, saldo, apuestas y chat; la gestión completa permanece en `/admin`. HLS.js se carga bajo demanda.

### Streaming

La configuración de transmisión por evento (URL de ingest, stream key cifrada y playback HLS) se gestiona desde `POST /api/v1/admin/events/:id/stream` y `GET /api/v1/admin/events/:id/stream` con permiso `events.manage`. El stream key se genera por evento, se cifra con AES-256-GCM (APP_KEY) y solo se expone a operadores autenticados. Para transmitir desde OBS: `rtmp://localhost:1935/live` con el stream key del evento; el playback queda en `http://localhost:8888/live/{slug}/index.m3u8`.

### Tiempo real (chat y estados)

El tiempo real usa AdonisJS Transmit sobre Redis Pub/Sub. El cliente se suscribe a `chat/{eventId}` y `events/{eventId}` mediante SSE con sesión autenticada. Apuestas aceptadas, actualizaciones de balance y rondas liquidadas se emiten a `events/{eventId}`; los mensajes de chat se persisten en `messages` y se difunden a `chat/{eventId}`.

```sh
npm run dev:client
```

### Seguridad y operación

Los endpoints `/health`, `/ready` y `/metrics` permiten supervisar la API, PostgreSQL, Redis, memoria y conteos agregados. `npm run monitor` los valida en conjunto (salida 0/1 para cron) y admite `--stream=<hls-url>` para comprobar MediaMTX.

Los backups se gestionan con `npm run backup` (dump comprimido en `backups/` con retención configurable) y `npm run backup:verify` (restaura en una BD temporal y valida conteos e integridad del ledger). `npm run load:test` ejecuta la prueba de carga contra una instancia en marcha.

El CSP está habilitado en modo `reportOnly` (verifica y reporta sin bloquear); Shield además envía `X-Frame-Options: DENY`, HSTS y `X-Content-Type-Options: nosniff`. El registro/login tienen rate limit por IP y las rutas API por usuario. Documentos de aceptación y operación: `docs/uat.md` (checklist UAT por criterio del PDR) y `docs/runbook.md` (despliegue, rollback, incidentes de stream y conciliación financiera).

## Build

```sh
npm run typecheck
npm run lint
npm run build
```

El build de Vite forma parte del build de AdonisJS y sus assets se incluyen en el artefacto de producción.

## Documentación

La planificación OpenSpec está en `openspec/changes/initial-platform-plan/`.
