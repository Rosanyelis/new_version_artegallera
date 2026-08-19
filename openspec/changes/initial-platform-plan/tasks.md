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

- [x] Crear migraciones/modelos de `bets` y `round_results` con constraints e idempotencia.
- [x] Implementar `BettingService` con las validaciones críticas del PDR.
- [x] Integrar `BettingService` y `WalletService` en una única transacción PostgreSQL.
- [x] Implementar `SettlementService` idempotente para pool, comisión cero inicial, premios y reembolsos.
- [x] Añadir endpoints de crear apuesta, historial, resultado y operación administrativa.
- [x] Añadir pruebas de concurrencia, saldo insuficiente, cierre de ronda, reintento y doble liquidación.
- [x] Mantener matching individual como backlog hasta confirmar el modelo comercial.

**Criterio:** cumplido para el modelo MVP de pool; toda apuesta aceptada tiene débito/ledger, la liquidación es idempotente y los premios se acreditan sin duplicación.

## Fase 5: cliente React para eventos

- [x] Crear sistema visual responsive mobile-first basado en la referencia del cliente.
- [x] Implementar home, listado de eventos, sala de evento y login/registro.
- [x] Proteger la sala de evento y las apuestas mediante sesión API.
- [x] Implementar player HLS con fallback nativo, estado LIVE, ronda activa y estado independiente de apuestas.
- [x] Implementar selector de lado, monto, confirmación y errores de negocio comprensibles.
- [x] Implementar saldo disponible visible y actualización después de apostar.
- [x] Implementar cliente HTTP y guards de autenticación.
- [x] Implementar estados de carga, vacío y error.
- [x] Implementar la interfaz de chat cliente y estados de carga de conversación.
- [x] Añadir tests de componentes para controles de apuesta.
- [ ] Integrar WebSockets/Redis para chat y estados en tiempo real en la Fase 6.

**Criterio:** cumplido para acceso autenticado, transmisión HLS, saldo, apuesta, interfaz de chat y responsive; la sincronización en tiempo real queda para la Fase 6.

## Fase 6: streaming y tiempo real

- [x] Elegir y documentar MediaMTX para el primer entorno (`docker-compose`, puertos RTMP 1935 / HLS 8888).
- [x] Crear `StreamingService` con generación y rotación de stream keys cifradas (AES-256-GCM con APP_KEY) y URLs de playback por evento.
- [x] Crear `stream_configurations`, cifrado de stream key, configuración idempotente por evento y permisos de administración.
- [x] Implementar endpoints de configuración OBS/stream key (crear y consultar) en `/api/v1/admin/events/:id/stream`.
- [x] Implementar tiempo real con AdonisJS Transmit (SSE) sobre transporte Redis Pub/Sub para eventos, rondas, apuestas y balance.
- [x] Integrar chat persistente con rate limit, historial y broadcasting a `chat/:eventId`; moderación/borrado/reportes quedan para la Fase 7.
- [x] Integrar reconexión automática del cliente (Transmit Client) y actualización de saldo/evento en vivo; presence queda pendiente.

**Criterio:** cumplido para HLS + cambios de estado en vivo sin refrescar (apuesta aceptada, saldo, ronda liquidada) y chat en tiempo real; una caída del stream no altera el ledger (el ledger se mantiene en PostgreSQL transaccional).

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
