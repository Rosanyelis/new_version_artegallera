# Runbook: despliegue, rollback, incidentes y conciliación

Operación de la plataforma de apuestas y transmisiones. Entorno local/Docker en desarrollo; los pasos asumen contenedores del proyecto (`artegallera-postgres-1`, `artegallera-redis-1`, `artegallera-mediamtx-1`).

## 1. Despliegue

```bash
npm ci
npm run build          # compila Edge/React + Adonis a build/
npm run typecheck && npm run lint
```

Antes de arrancar, asegurar en `.env` (nunca versionar): `APP_KEY`, `DB_*`, `REDIS_*`, `RESEND_API_KEY`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `STREAMING_*`.

Migraciones y seeders (una sola vez):

```bash
node ace migration:run
node ace db:seed            # roles + permisos (role_seeder, admin_seeder)
```

Arranque de servicios dependientes y la app:

```bash
docker compose up -d        # postgres, redis, mediamtx
NODE_ENV=production npm run start        # node bin/server.js
```

HTTPS/TLS: terminar TLS en el proxy inverso (p. ej. Caddy/nginx con Let's Encrypt). Shield ya envía `Strict-Transport-Security`. Los servicios internos (PostgreSQL, Redis, MediaMTX) no deben exponerse a Internet; MediaMTX solo 1935/8888.

Healthcheck de post-despliegue:

```bash
curl -f http://localhost:3333/ready && curl -f http://localhost:3333/metrics
```

## 2. Rollback

Dos estrategias complementarias:

1. **Código**: el artefacto `build/` previo se vuelve a desplegar y se reinicia el proceso; las migraciones son acumulativas, no destructivas.
2. **Datos**: restaurar un backup previo al cambio.

```bash
# listar backups
./scripts/backup.sh --list
# restaurar (a una BD temporal, revisar, luego volcar a la real bajo parada de escrituras)
gunzip -c backups/artegallera-YYYYMMDD-HHMMSS.sql.gz | docker exec -i artegallera-postgres-1 psql -U artegallera -d artegallera
```

Regla de oro: **un evento liquidado o un movimiento financiero jamás se edita en la base**; ante un error de liquidación se usa una operación de reversa vía `WalletService` (reversal/refund) y se documenta en auditoría, no un UPDATE del ledger (el trigger lo bloquea por diseño).

## 3. Incidentes

### 3.1 Stream caído o sin señal (MediaMTX)

- Síntoma: el player no reproduce el HLS (`http://<host>:8888/live/<slug>/index.m3u8`) o el monitor marca `stream_hls: false`.
- Verificar:

```bash
docker ps | grep mediamtx
node scripts/monitor.mjs --stream=http://localhost:8888/live
```

- Reiniciar: `docker compose restart mediamtx`. Rotar la stream key si se sospecha fuga (endpoint admin `POST /api/v1/admin/events/:id/stream`).
- **Impacto en el ledger: ninguno.** El dinero vive en PostgreSQL transaccional; una caída del stream no altera rondas, saldos ni apuestas.

### 3.2 Alta latencia de apuestas / picos

- Síntoma: latencia p95 de apuestas creciente, errores 429 o 500 en `/api/v1/events/*/bets`.
- Apuestas sobre un mismo usuario se serializan con row lock sobre su wallet; esto es intencional para preservar saldos.
- Mitigaciones: más réplicas del proceso (el lock es por fila, no global), revisar el pool de conexiones de PostgreSQL y el estado de Redis (bus de Transmit).

### 3.3 Errores 429 en login/registro

- `authThrottle` limita a 5 solicitudes / 15 min por IP. En dev el limiter es en memoria: reiniciar el proceso lo limpia. En producción usar `LIMITER_STORE=redis` y verificar que el bloqueo por IP es el deseado.

### 3.4 Fallo de PostgreSQL

- `/ready` devuelve 503; el monitor marca `postgres: false`.
- La app deja de aceptar apuestas (correcto: no operar sin ledger). Restaurar el último backup verificado (`./scripts/backup.sh --verify`) o el failover del cluster.

## 4. Backups y restauración

```bash
npm run backup          # dump comprimido en backups/ con retención (7 por defecto)
npm run backup:verify   # además restaura en BD temporal y valida conteos/ledger
```

Retención: `BACKUP_RETENTION` (por defecto 7). Programar un cron, p. ej.:

```cron
30 4 * * * cd /srv/artegallera && ./scripts/backup.sh --verify >> /var/log/artegallera-backup.log 2>&1
```

La verificación valida que `wallet_transactions` con `status='posted'` sea consistente y que los conteos de la restauración sean los esperados. `backups/` está en `.gitignore`.

## 5. Monitoreo y métricas

- `/health` → 200 si el proceso responde.
- `/ready` → 200 solo si PostgreSQL y Redis responden.
- `/metrics` → estado, latencias de PG/Redis, memoria y conteos (users, events, bets, wallet_transactions, rounds, messages). No expone PII.
- Script: `npm run monitor` (salida 0/1, JSON en stdout) para cron/supervisores. Alertar cuando `/ready` o `/metrics` dejen de devolver `ok`, y cuando el HLS de un evento activo no responda.

## 6. Conciliación financiera

Procedimiento ante dudas:

1. Por ronda: comparar `SUM(wallet_transactions.amount) WHERE type='bet'` y `type='win'|'refund'` por `round_id` con `rounds.total_pool` y `round_results.total_payout`. El ledger es inmutable y por transacción; debe cuadrar siempre.
2. Comisión: en el modelo MVP es 0.00 (`metadata->>'commissionRate'`).
3. Reintentos: verificar idempotencia de `settlement` (una sola fila `round_results` por ronda) y que el `idempotency_key` evite débitos duplicados.
4. Auditoría: cada movimiento financiero y cada acción administrativa tiene su fila en `audit_logs` (inmutable).

## 7. Cumplimiento de credenciales

- `ADMIN_PASSWORD` en `.env` es solo para dev/seed. En producción generar una contraseña fuerte y rotarla.
- `RESEND_API_KEY`, `APP_KEY` y credenciales de BD nunca se versionan ni se exponen en logs.
- Habilitar verificación de correo y revisar los requisitos regulatorios (KYC, jurisdicción, límites) antes de operar con dinero real.