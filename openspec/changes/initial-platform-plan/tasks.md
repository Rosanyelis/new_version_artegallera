# Tasks: Plataforma de apuestas y transmisiones de gallos

Las tareas están ordenadas por dependencia. Cada fase debe cerrar sus criterios antes de iniciar la siguiente.

## Fase 0: decisiones y bootstrap

- [ ] Confirmar jurisdicción, moneda, precisión decimal, reglas de límites y necesidad de KYC.
- [x] Confirmar MVP con pool por lado; registrar una decisión separada si se requiere matching.
- [x] Crear proyecto AdonisJS TypeScript y configurar ESLint, formato, variables de entorno y aliases.
- [x] Crear `resources/client` con React, TypeScript, React Router y build mediante Adonis Vite.
- [x] Configurar AdonisJS para servir el shell Edge que monta React en las rutas públicas.
- [x] Añadir PostgreSQL, Redis y MediaMTX a la documentación local/Docker de desarrollo.
- [x] Configurar scripts de typecheck, lint, test y build integrado de React + AdonisJS.

**Criterio:** un comando de desarrollo levanta AdonisJS y la landing React; un build reproducible incluye ambos en el mismo artefacto.

## Fase 1: base de backend y seguridad

- [x] Crear configuración de base de datos PostgreSQL, Redis, sesiones y logging.
- [x] Implementar migraciones de usuarios, roles, permisos y asignaciones.
- [x] Implementar registro, login, logout y sesiones para web y API.
- [x] Implementar recuperación de contraseña mediante Resend y token de un solo uso.
- [ ] Implementar verificación de correo cuando se defina el flujo de activación de cuentas.
- [x] Crear middleware de autenticación, autorización por permisos y estados de usuario.
- [x] Crear validators VineJS, manejo de errores de dominio y respuesta API consistente.
- [x] Añadir rate limiting, request/correlation ID y endpoints `/health` y `/ready`.
- [x] Cubrir autenticación, readiness y permisos con tests funcionales.

**Criterio:** cumplido para registro/login/logout/sesiones, recuperación con Resend, roles/permisos y errores API; verificación de correo queda pendiente del flujo de activación de cuentas.

## Fase 2: wallet, ledger y auditoría

- [x] Crear migraciones de `wallets` y `wallet_transactions` con DECIMAL, constraints e índices.
- [x] Implementar `WalletService` con débito, crédito, refund, reversal y ajuste autorizado.
- [x] Garantizar locking, balance before/after, referencias e idempotencia.
- [x] Impedir deletes/updates del ledger desde la aplicación y mediante trigger PostgreSQL.
- [x] Implementar `audit_logs` para operaciones financieras y administrativas críticas.
- [x] Crear endpoints de saldo, movimientos e historial para cliente y ajustes del panel.
- [x] Añadir tests de saldo insuficiente, rollback, reintento y dos operaciones simultáneas.

**Criterio:** cumplido; las operaciones financieras usan DECIMAL, locking, idempotencia, ledger inmutable y auditoría transaccional.

## Fase 3: eventos, rondas y panel operativo

- [x] Crear migraciones y modelos de `events`, `rounds` y `betting_sides`.
- [x] Implementar máquina de estados y transiciones válidas en `EventService`/`RoundService`.
- [x] Crear operaciones de eventos, rondas y lados con autorización y auditoría.
- [x] Construir layout Edge del panel y dashboard operativo bajo `/admin`.
- [x] Construir pantalla de operación con abrir/cerrar apuestas, iniciar ronda, registrar ganador y finalizar evento.
- [x] Añadir endpoints públicos de eventos destacados, próximos, activos y resultados.
- [x] Cubrir transiciones inválidas y permisos del operador.

**Criterio:** cumplido; el operador ejecuta el ciclo evento/ronda desde Edge o API, sin editar estados directamente en base de datos.

## Fase 4: apuestas y liquidación

- [ ] Crear migraciones/modelos de `bets` y `round_results` con constraints e idempotencia.
- [ ] Implementar `BettingService` con todas las validaciones del PDR.
- [ ] Integrar `BettingService` y `WalletService` en una única transacción PostgreSQL.
- [ ] Implementar `SettlementService` idempotente para pool, comisión, premios y reembolsos.
- [ ] Añadir endpoints de crear apuesta, historial, resultado y operación administrativa.
- [ ] Añadir pruebas de concurrencia: mismo saldo, cierre de ronda, reintento y doble liquidación.
- [ ] Documentar matching como backlog hasta confirmar el modelo comercial.

**Criterio:** una apuesta aceptada tiene débito y ledger; una ronda liquidada no puede liquidarse dos veces; los ganadores reciben crédito exacto.

## Fase 5: landing React para clientes

- [ ] Crear sistema visual responsive mobile-first y layout público.
- [ ] Implementar home, eventos, detalle de evento, login/registro y recuperación.
- [ ] Implementar player HLS, estado LIVE, ronda activa y estado independiente de apuestas.
- [ ] Implementar selector de lado, monto, confirmación y errores de negocio comprensibles.
- [ ] Implementar saldo, historial de apuestas, movimientos y resultados anteriores.
- [ ] Implementar cliente API tipado, cache/invalidation y guards de autenticación.
- [ ] Implementar estados de carga, vacío, error, offline y reconexión.
- [ ] Añadir tests de componentes y flujo de apuesta con API simulada.

**Criterio:** un cliente puede completar el flujo completo desde la landing sin conocer reglas internas ni credenciales de streaming.

## Fase 6: streaming y tiempo real

- [ ] Elegir y documentar MediaMTX o Nginx RTMP para el primer entorno.
- [ ] Crear `StreamingProviderInterface`, adapter inicial y `StreamingService`.
- [ ] Crear `stream_configurations`, cifrado, rotación/revocación y permisos de stream key.
- [ ] Implementar panel de configuración OBS y health/status del stream.
- [ ] Implementar WebSockets con Redis Pub/Sub y eventos de evento, ronda, apuesta y balance.
- [ ] Integrar chat, rate limit, moderación, silencio, borrado y reportes.
- [ ] Añadir reconexión, presencia y pruebas de WebSockets.

**Criterio:** el cliente ve HLS y cambios de estado sin refrescar; una caída del stream no altera el ledger.

## Fase 7: administración complementaria y reportes

- [ ] Implementar gestión de usuarios, roles, suspensión y ajustes con doble confirmación.
- [ ] Implementar promociones, notificaciones y moderación de chat en Edge.
- [ ] Implementar reportes de eventos, apuestas, financiero y usuarios con filtros y exportación.
- [ ] Implementar consulta de auditoría con acceso restringido e historial inmutable.
- [ ] Completar dashboard con métricas operativas y estado del streaming.

**Criterio:** un administrador puede investigar una operación desde el evento hasta su movimiento financiero y auditoría.

## Fase 8: hardening y salida

- [ ] Ejecutar tests unitarios, integración, funcionales, concurrencia, liquidación, permisos, API y WebSockets.
- [ ] Ejecutar pruebas de carga sobre apuestas, WebSockets y lectura de eventos.
- [ ] Configurar backups PostgreSQL, retención, restauración verificada y recuperación operativa.
- [ ] Configurar métricas, alertas y monitoreo de PostgreSQL, Redis y streaming.
- [ ] Revisar HTTPS, secretos, CSP, rate limits, logs y exposición de datos.
- [ ] Realizar UAT con operador y cliente usando los criterios críticos del PDR.
- [ ] Preparar runbook de despliegue, rollback, incidentes de stream y conciliación financiera.

**Criterio:** el sistema cumple los criterios críticos del PDR y existe evidencia de restauración, carga, seguridad y operación.

## Dependencias externas

- Definición legal y regulatoria antes de activar dinero real.
- Credenciales/configuración del proveedor de correo.
- Media server y dominio HLS.
- Dominio, TLS, almacenamiento de imágenes y estrategia de CDN.
- Decisión comercial sobre depósitos/retiros y matching.
