# Arte Gallera

Plataforma de eventos, transmisiones y apuestas construida como un monolito modular con AdonisJS y React.

## Estructura

- AdonisJS: backend, API versionada y panel administrativo Edge.
- React: landing pública en `resources/client`, integrada mediante Vite.
- PostgreSQL: fuente de verdad para usuarios, apuestas y operaciones financieras.
- Redis: cache, pub/sub y tiempo real.
- MediaMTX: servidor local de desarrollo para RTMP/HLS.

## Desarrollo

```sh
npm install
cp .env.example .env
node ace generate:key
docker compose up -d
npm run dev
```

La aplicación queda disponible en `http://localhost:3333`. El panel administrativo se implementará bajo `/admin` en la siguiente fase.

El PostgreSQL local usa el puerto `5433` para evitar conflictos con otras instalaciones. El limiter usa memoria en `.env` de desarrollo y Redis debe configurarse como `LIMITER_STORE=redis` en entornos distribuidos.

La recuperación de contraseña usa Resend y expone `POST /api/v1/auth/forgot-password` y `POST /api/v1/auth/reset-password`. El API nunca devuelve el token; solo se almacena su hash y vence después de 60 minutos.

La wallet expone `GET /api/v1/wallet` y `GET /api/v1/wallet/transactions`. Los ajustes administrativos usan `POST /api/v1/admin/wallets/adjust` con permisos, clave de idempotencia y auditoría.

El panel operativo Edge está disponible en `/admin` para usuarios con el permiso `admin.access`. Desde allí se crean eventos, rondas y se ejecutan sus transiciones operativas.

Para ejecutar únicamente el servidor Vite del cliente durante desarrollo:

```sh
npm run dev:client
```

## Build

```sh
npm run typecheck
npm run lint
npm run build
```

El build de Vite forma parte del build de AdonisJS y sus assets se incluyen en el artefacto de producción.

## Documentación

La planificación OpenSpec está en `openspec/changes/initial-platform-plan/`.
