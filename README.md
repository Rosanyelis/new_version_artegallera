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
