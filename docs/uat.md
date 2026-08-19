# Checklist de UAT (Aceptación de Usuario)

Este checklist cubre los criterios críticos del PDR. Marcar cada caso como **PASÓ** / **FALLÓ** / **N/A**, con la evidencia (captura, URL, CSV).

Entorno de prueba: dev server en `http://localhost:3333`. Admin de dev: `admin@artegallera.test` (ver `ADMIN_PASSWORD` en `.env`).

## 1. Registro, login y sesión (cliente)

- [ ] Registro crea usuario con rol `user` y wallet en 0.00.
- [ ] Login falla con credenciales inválidas (código `INVALID_CREDENTIALS`).
- [ ] Login de cuenta suspendida devuelve `ACCOUNT_INACTIVE`.
- [ ] Logout destruye la sesión y `/api/v1/auth/me` pasa a 401.
- [ ] El chat, las apuestas y el saldo exigen sesión (401 sin sesión).

## 2. Eventos y transmisión

- [ ] El listado público muestra eventos por estado (próximos, activos, finalizados).
- [ ] La sala de evento muestra el player HLS (fallback nativo o hls.js) con estado LIVE.
- [ ] El estado del stream (emitido/hls) no modifica el estado de la ronda ni el ledger.
- [ ] Una caída del stream no bloquea las apuestas de una ronda abierta.

## 3. Rondas y apuestas

- [ ] La ronda pasa por `pending → betting_open → betting_closed → in_progress → settling → settled` con los estados de apuestas coherentes.
- [ ] No se aceptan apuestas con apuestas cerradas (código `BETTING_CLOSED`).
- [ ] No se aceptan montos inválidos (<= 0, más de 2 decimales, no numérico).
- [ ] Una apuesta aceptada debita el saldo y aparece en `/api/v1/bets` (historial).
- [ ] El reintento con el mismo `idempotencyKey` no duplica el débito.
- [ ] Dos apuestas concurrentes no corrompen el saldo (serialización con row lock).
- [ ] Apostar sin saldo devuelve error de negocio y no genera transacción.

## 4. Liquidación y conciliación

- [ ] Al liquidar, los ganadores reciben su parte del pool y los perdedores no reciben nada.
- [ ] La comisión queda en 0.00 (modelo MVP).
- [ ] Reintentar la liquidación es idempotente (no duplica premios ni reembolsos).
- [ ] La suma de `wallet_transactions` del pool == total apostado == `total_pool`.
- [ ] El resultado queda disponible en `/api/v1/events/:id/rounds/:rid/result`.

## 5. Wallet y administración

- [ ] El saldo disponible se actualiza tras una apuesta sin refrescar (SSE).
- [ ] El ajuste de wallet admin exige `wallets.manage` y doble confirmación (correo + checkbox).
- [ ] El ledger (`wallet_transactions`) es inmutable: UPDATE/DELETE bloqueados por trigger.
- [ ] La auditoría registra `user.status_changed`, `user.role_changed`, `wallet.adjustment` y `round.settled`.

## 6. Chat y moderación

- [ ] Enviar mensaje exige sesión y respeta el rate limit.
- [ ] El moderador puede ocultar/eliminar mensajes desde `/admin/moderation`.
- [ ] Un mensaje oculto/eliminado no aparece en el listado público del chat.
- [ ] Las acciones de moderación quedan en la auditoría.

## 7. Reportes y operación

- [ ] Los 4 reportes (eventos, apuestas, financiero, usuarios) filtran y exportan CSV.
- [ ] El CSV se descarga con nombres y encabezados correctos.
- [ ] La consulta de auditoría filtra por acción, entidad, operador y rango de fechas.
- [ ] El dashboard muestra métricas coherentes con la base (usuarios, volumen, apuestas recientes).

## 8. Seguridad

- [ ] El panel `/admin*` devuelve 403 para usuarios sin `admin.access`.
- [ ] Las rutas admin de API exigen el permiso correspondiente (`events.manage`, `wallets.manage`, `chat.moderate`, `reports.read`).
- [ ] El registro/login está limitado por rate limit (5/15 min por IP en dev).
- [ ] Respuestas HTTP llevan `Content-Security-Policy-Report-Only`, `X-Frame-Options: DENY`, `Strict-Transport-Security` y `X-Content-Type-Options: nosniff`.
- [ ] El código de recuperación de contraseña es de un solo uso y expira en 60 min.
- [ ] El `APP_KEY` y las credenciales (`.env`) no están versionadas.

## 9. Tiempo real (WebSockets/SSE)

- [ ] Un cambio de estado de ronda (SSE a `events/:id`) se refleja en la sala sin recargar.
- [ ] Una apuesta aceptada actualiza el saldo del apostador sin recargar.
- [ ] El chat se actualiza en vivo; la reconexión automática del cliente funciona.
- [ ] Una ronda liquidada emite `round.settled` y el resultado llega al cliente.

## Evidencia ejecutada (Fase 8)

- Carga: 100 apuestas concurrentes (10 workers), 100/100 HTTP 201, pool 100.00 conciliado con premios 100.00 y comisión 0.00 (`node scripts/load_test.mjs --bets 100 --users 2 --concurrency 10 --settle`).
- Backups: dump con restauración verificada en BD temporal (136 usuarios, 116 apuestas, 255 transacciones) (`./scripts/backup.sh --verify`).
- Monitoreo: `/health`, `/ready`, `/metrics` y HLS responden OK (`node scripts/monitor.mjs --stream=http://localhost:8888/live`).
- Tests: 21 tests funcionales en verde (`npm test`), 2 tests de componentes (`npm run test:client`).