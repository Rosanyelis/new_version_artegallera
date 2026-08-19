# PDR — Sistema de Gestión de Apuestas de Gallos y Transmisiones en Vivo

**Versión:** 1.0  
**Fecha:** 2026-08-19  
**Estado:** Documento base para arquitectura y desarrollo  
**Backend:** AdonisJS + TypeScript  
**Base de datos:** PostgreSQL  
**Cache / tiempo real:** Redis  
**Streaming:** OBS Studio + RTMP + HLS  
**Frontend:** A definir según alcance (SSR, SPA o híbrido)

---

# 1. Resumen Ejecutivo

El sistema será una plataforma web para la gestión integral de eventos de peleas de gallos, transmisión en vivo, rondas, apuestas, saldos de usuarios, liquidación de apuestas, chat en tiempo real, promociones y administración operativa.

El sistema combinará tres características críticas:

1. **Gestión transaccional y financiera:** apuestas, débitos, créditos, premios y saldos.
2. **Operación en tiempo real:** rondas, cierre de apuestas, resultados, notificaciones y chat.
3. **Streaming en vivo:** recepción de una transmisión generada desde OBS Studio mediante RTMP y reproducción en la plataforma web mediante HLS u otro protocolo compatible.

El backend será desarrollado con AdonisJS y TypeScript, utilizando PostgreSQL como base de datos principal y Redis para mecanismos de cache, pub/sub, presencia y eventos en tiempo real.

---

# 2. Objetivos

## 2.1 Objetivo general

Construir una plataforma segura, escalable y auditable para administrar eventos de apuestas de gallos y permitir que los usuarios participen en apuestas mientras visualizan la transmisión en vivo.

## 2.2 Objetivos específicos

- Administrar usuarios.
- Administrar eventos.
- Administrar rondas.
- Administrar equipos o lados de apuesta.
- Registrar apuestas.
- Validar saldos antes de aceptar apuestas.
- Descontar fondos de manera atómica.
- Liquidar apuestas según el resultado.
- Registrar todas las operaciones financieras.
- Transmitir eventos en vivo.
- Integrar OBS Studio mediante RTMP.
- Reproducir el streaming en la web.
- Implementar chat en tiempo real.
- Administrar promociones.
- Proporcionar panel administrativo.
- Generar reportes operativos y financieros.
- Mantener trazabilidad completa de las operaciones.

---

# 3. Alcance

## 3.1 Incluido

- Autenticación.
- Usuarios.
- Roles y permisos.
- Wallet/saldo.
- Historial de transacciones.
- Eventos.
- Rondas.
- Apuestas.
- Matching o emparejamiento de apuestas, si el modelo operativo lo requiere.
- Liquidación.
- Resultados.
- Streaming.
- Configuración de OBS.
- Chat.
- Promociones.
- Notificaciones.
- Auditoría.
- Dashboard administrativo.
- Reportes.
- Configuración del sistema.

## 3.2 Fuera del alcance inicial

- Desarrollo de un software de streaming propio.
- Aplicación móvil nativa.
- Procesamiento de video directamente en Node.js.
- Motor propio de codificación/transcodificación de video.
- Integración obligatoria con un proveedor de pagos externo.
- Sistema avanzado de cuotas deportivas si el negocio posteriormente cambia a un modelo de apuestas con odds.

---

# 4. Consideraciones legales y regulatorias

El sistema gestiona apuestas con valor económico. Antes de ponerlo en producción se deberá determinar la legislación aplicable a la jurisdicción donde operará la plataforma.

El desarrollo técnico deberá contemplar, como mínimo:

- Verificación de edad cuando sea legalmente requerida.
- Restricción geográfica cuando corresponda.
- Identificación de usuarios.
- Registro de actividad.
- Auditoría de operaciones.
- Políticas de juego responsable.
- Límites de apuesta.
- Suspensión de cuentas.
- Prevención de fraude.
- Retención de registros.
- Términos y condiciones.
- Política de privacidad.
- Gestión de consentimientos.

Las reglas regulatorias deberán configurarse como reglas de negocio y no quedar embebidas directamente en los controladores.

---

# 5. Arquitectura tecnológica

## 5.1 Backend

- Node.js.
- AdonisJS.
- TypeScript.
- Lucid ORM.
- VineJS.
- Redis.
- WebSockets.
- PostgreSQL.

## 5.2 Frontend

Se recomienda una arquitectura web responsive y mobile-first.

Opciones:

- AdonisJS + Edge + Alpine.js para una solución sencilla.
- AdonisJS API + React para una SPA.
- Arquitectura híbrida para combinar SSR con componentes interactivos.

La elección deberá hacerse antes de iniciar la implementación del frontend.

## 5.3 Infraestructura

- Linux.
- Nginx.
- PostgreSQL.
- Redis.
- Node.js.
- PM2 o systemd.
- SSL/TLS.
- Docker opcional.
- CDN opcional.

---

# 6. Base de datos

## 6.1 PostgreSQL

PostgreSQL es la base de datos recomendada para el proyecto.

Motivos:

- Transacciones ACID.
- Excelente integridad referencial.
- Manejo de concurrencia.
- Bloqueos transaccionales.
- JSONB.
- Índices avanzados.
- Agregaciones.
- Buen comportamiento en operaciones financieras.
- Escalabilidad vertical y horizontal mediante réplicas.

## 6.2 Redis

Redis no reemplazará PostgreSQL.

Será utilizado para:

- Cache.
- Pub/Sub.
- Eventos WebSocket.
- Presencia de usuarios.
- Estado temporal del evento.
- Rate limiting.
- Contadores.
- Información temporal de streaming.
- Coordinación entre procesos.

---

# 7. Principio financiero fundamental

Nunca se utilizará `DOUBLE PRECISION` para representar dinero.

Los valores monetarios deberán utilizar:

`DECIMAL(15,2)`

o, si se requiere mayor precisión:

`DECIMAL(18,4)`

La decisión deberá ser uniforme para todo el sistema.

Todos los débitos y créditos deberán ejecutarse dentro de transacciones PostgreSQL.

---

# 8. Módulos funcionales

## 8.1 Autenticación

Funciones:

- Registro.
- Login.
- Logout.
- Recuperación de contraseña.
- Cambio de contraseña.
- Verificación de correo.
- Control de sesiones.
- Bloqueo de cuenta.
- Activación/desactivación.

## 8.2 Usuarios

Datos:

- Nombre.
- Apellido.
- Username.
- Email.
- Teléfono.
- Imagen.
- Estado.
- Rol.
- Fecha de registro.
- Último acceso.

Estados:

- active.
- suspended.
- blocked.
- inactive.

Nunca se almacenará una contraseña en texto plano.

El campo `passwordshow` de la estructura original deberá eliminarse.

---

# 9. Roles

Se recomienda manejar roles mediante una tabla dedicada.

Roles iniciales:

- Super Admin.
- Admin.
- Operador.
- Moderador.
- Usuario.

Permisos deberán manejarse de forma independiente.

Esto permitirá agregar nuevos perfiles sin modificar la estructura principal.

---

# 10. Wallet y saldo

El sistema deberá implementar una Wallet lógica por usuario.

## 10.1 Componentes

- Balance disponible.
- Balance retenido.
- Balance total.
- Movimientos.
- Débitos.
- Créditos.
- Premios.
- Ajustes administrativos.

## 10.2 Regla

El saldo nunca deberá modificarse directamente desde un controlador.

Toda modificación deberá pasar por `WalletService`.

---

# 11. Ledger financiero

Se recomienda reemplazar el concepto actual de `usertransactions` por un ledger financiero robusto.

Tabla conceptual:

`wallet_transactions`

Campos principales:

- id.
- wallet_id.
- user_id.
- event_id.
- round_id.
- betting_id.
- type.
- amount.
- balance_before.
- balance_after.
- reference.
- description.
- status.
- metadata.
- created_at.

Tipos:

- deposit.
- withdrawal.
- bet.
- win.
- refund.
- adjustment.
- commission.
- reversal.

El ledger deberá ser inmutable.

No se deberán eliminar transacciones financieras.

Si una transacción necesita revertirse, se creará una nueva transacción de reversión.

---

# 12. Eventos

Entidad:

`events`

Un evento representa una jornada o sesión de peleas.

Campos recomendados:

- id.
- name.
- slug.
- description.
- location.
- scheduled_at.
- status.
- betting_status.
- stream_status.
- stream_provider.
- playback_url.
- stream_key_encrypted.
- stream_started_at.
- stream_ended_at.
- cover_image.
- is_featured.
- created_at.
- updated_at.

Estados:

- draft.
- scheduled.
- live.
- paused.
- finished.
- cancelled.

Estado de apuestas:

- closed.
- open.
- suspended.
- finished.

---

# 13. Rondas

Cada evento tendrá múltiples rondas.

Tabla:

`rounds`

Campos:

- id.
- event_id.
- round_number.
- status.
- betting_status.
- opened_at.
- betting_closed_at.
- started_at.
- finished_at.
- winning_side.
- total_pool.
- total_red.
- total_green.
- created_at.
- updated_at.

Estados:

- pending.
- betting_open.
- betting_closed.
- in_progress.
- settling.
- settled.
- cancelled.

No deberá existir una relación ambigua entre `rounds` y `bettings`.

El campo `id_round` de la estructura original que apunta a `bettings` deberá eliminarse.

---

# 14. Lados de apuesta

La estructura actual utiliza:

- red.
- green.

Se recomienda evitar guardar el texto repetidamente.

Crear:

`betting_sides`

Campos:

- id.
- event_id.
- round_id.
- code.
- name.
- color.
- metadata.

Ejemplos:

- RED.
- GREEN.

Esto permite posteriormente utilizar otros nombres o configuraciones sin alterar la tabla de apuestas.

---

# 15. Apuestas

Tabla:

`bets`

Campos recomendados:

- id.
- user_id.
- event_id.
- round_id.
- betting_side_id.
- amount.
- status.
- placed_at.
- settled_at.
- payout_amount.
- transaction_id.
- reference.
- metadata.
- created_at.
- updated_at.

Estados:

- pending.
- accepted.
- cancelled.
- won.
- lost.
- refunded.
- rejected.

---

# 16. Reglas de aceptación de apuestas

Antes de registrar una apuesta se deberán validar:

1. Usuario autenticado.
2. Usuario activo.
3. Usuario habilitado para apostar.
4. Evento activo.
5. Ronda activa.
6. Apuestas abiertas.
7. Lado de apuesta válido.
8. Monto permitido.
9. Saldo suficiente.
10. Límites del usuario.
11. Límites de la ronda.
12. Reglas regulatorias.
13. Ausencia de bloqueo por fraude.

La operación deberá realizarse en una única transacción.

---

# 17. Concurrencia

La colocación de apuestas es una operación crítica.

Se deberá utilizar:

- Transacciones PostgreSQL.
- Row locking cuando sea necesario.
- Validación de saldo dentro de la transacción.
- Idempotency keys.
- Unique constraints.
- Control de solicitudes duplicadas.

Ejemplo conceptual:

1. Iniciar transacción.
2. Bloquear wallet del usuario.
3. Validar saldo.
4. Registrar apuesta.
5. Registrar débito.
6. Actualizar balance.
7. Confirmar transacción.
8. Publicar evento WebSocket.

Nunca se deberá publicar el evento de éxito antes de confirmar la transacción.

---

# 18. Matching de apuestas

La tabla `marriedbettings` parece representar el emparejamiento de una apuesta roja con una apuesta verde.

Se recomienda reemplazarla por:

`bet_matches`

Campos:

- id.
- event_id.
- round_id.
- red_bet_id.
- green_bet_id.
- amount.
- status.
- created_at.
- updated_at.

Estados:

- pending.
- matched.
- settled.
- cancelled.

El matching deberá implementarse como servicio independiente.

Si el negocio no requiere realmente emparejar apuestas individuales, este módulo deberá eliminarse y trabajar únicamente con el pool total por lado.

---

# 19. Liquidación

La liquidación deberá ser una operación transaccional.

Flujo:

1. Cerrar apuestas.
2. Registrar ganador.
3. Calcular pool.
4. Calcular ganadores.
5. Calcular premios.
6. Crear créditos.
7. Crear movimientos financieros.
8. Marcar apuestas como won/lost.
9. Registrar resultado.
10. Marcar ronda como settled.
11. Emitir eventos WebSocket.

La liquidación deberá ser idempotente.

No podrá ejecutarse dos veces sobre la misma ronda.

---

# 20. Resultados

Se recomienda eliminar la duplicidad entre `results` y `winners`.

Crear:

`round_results`

Campos:

- id.
- event_id.
- round_id.
- winning_side_id.
- red_total.
- green_total.
- total_pool.
- total_winners.
- total_payout.
- house_commission.
- settled_at.
- metadata.

El resultado será la fuente oficial de verdad de la liquidación de una ronda.

---

# 21. Streaming en vivo

## 21.1 Objetivo

El sistema no generará el video.

El video será producido externamente mediante:

- OBS Studio.
- Otra aplicación compatible con RTMP.

El sistema recibirá la transmisión mediante un servidor RTMP y la disponibilizará para reproducción web.

---

# 22. Arquitectura de Streaming

Flujo recomendado:

`Cámara → OBS → RTMP Server → HLS → Web Player`

Ejemplo:

`OBS → rtmp://stream.midominio.com/live → HLS → https://stream.midominio.com/hls/event_123/index.m3u8 → navegador`

AdonisJS administrará la configuración y estado del evento, pero no deberá actuar como servidor de video.

---

# 23. Servidor RTMP

Se recomienda utilizar un servidor independiente del backend.

Opciones:

- Nginx con módulo RTMP.
- MediaMTX.
- Wowza.
- Otro servidor compatible con RTMP/HLS.

Para una primera versión controlada se recomienda evaluar:

`OBS + MediaMTX/Nginx RTMP + HLS + CDN`

La elección definitiva dependerá del número esperado de espectadores y presupuesto de infraestructura.

---

# 24. Configuración de OBS

El administrador deberá poder obtener desde el panel:

- RTMP Server URL.
- Stream Key.
- Nombre del evento.
- Estado de transmisión.

Configuración conceptual de OBS:

Server:

`rtmp://stream.midominio.com/live`

Stream Key:

`event_xxxxxxxxx`

OBS enviará el video al servidor RTMP.

El Stream Key nunca deberá mostrarse públicamente en la página del evento.

---

# 25. Seguridad de Stream Keys

Las claves deberán:

- Generarse automáticamente.
- Ser únicas.
- Ser suficientemente largas.
- Almacenarse cifradas.
- No aparecer en logs.
- Poder regenerarse.
- Poder revocarse.

El frontend público solamente recibirá la URL de reproducción.

Nunca deberá recibir:

- RTMP URL privada.
- Stream Key.
- Credenciales administrativas.

---

# 26. Reproducción Web

El navegador deberá reproducir el stream mediante:

- HLS.
- `<video>`.
- HLS.js cuando sea necesario.

Ejemplo conceptual:

`https://stream.midominio.com/hls/event_xxx/index.m3u8`

El frontend deberá mostrar:

- Video.
- Estado LIVE.
- Nombre del evento.
- Ronda actual.
- Estado de apuestas.
- Chat.
- Información de apuestas.

---

# 27. Estado del Streaming

Estados:

- offline.
- starting.
- live.
- interrupted.
- ended.
- error.

El backend podrá actualizar el estado mediante:

1. Acción manual del operador.
2. Webhook del proveedor.
3. API de servidor de streaming.
4. Health check.
5. Consulta periódica del estado.

La arquitectura deberá desacoplar el backend del proveedor de streaming.

---

# 28. StreamingService

Crear:

`StreamingService`

Responsabilidades:

- Crear stream.
- Generar stream key.
- Revocar stream key.
- Obtener URL RTMP.
- Obtener URL HLS.
- Consultar estado.
- Iniciar transmisión.
- Finalizar transmisión.
- Validar proveedor.
- Normalizar estados.

La lógica específica de cada proveedor deberá implementarse mediante adapters.

Conceptualmente:

`StreamingProviderInterface`

Implementaciones:

- `MediaMtxProvider`.
- `NginxRtmpProvider`.
- `ExternalProviderAdapter`.

Esto permitirá cambiar de infraestructura sin modificar el dominio.

---

# 29. Integración entre Streaming y Apuestas

La transmisión y las apuestas deberán ser conceptos independientes.

Sin embargo, podrán coordinarse.

Ejemplo:

Evento:

`LIVE`

Streaming:

`LIVE`

Ronda:

`BETTING_OPEN`

Entonces el frontend podrá permitir apostar.

No se deberá asumir que un stream activo significa automáticamente que las apuestas están abiertas.

El operador deberá poder controlar ambos estados.

---

# 30. WebSockets

Los WebSockets serán utilizados para información en tiempo real.

Eventos:

- event.updated.
- stream.started.
- stream.ended.
- round.opened.
- round.betting_closed.
- round.started.
- round.resulted.
- round.settled.
- bet.created.
- bet.accepted.
- bet.cancelled.
- balance.updated.
- chat.message.
- promotion.updated.

---

# 31. Redis

Redis será utilizado para:

- Pub/Sub.
- Comunicación entre instancias de AdonisJS.
- Cache.
- Rate limiting.
- Estado temporal.
- Contadores.
- Presencia.
- Eventos WebSocket.

PostgreSQL seguirá siendo la fuente oficial de datos.

Redis no deberá ser utilizado como fuente única para balances o apuestas.

---

# 32. Chat

Tabla:

`messages`

Campos:

- id.
- event_id.
- user_id.
- content.
- message_type.
- image_url.
- status.
- moderated_at.
- moderated_by.
- created_at.

Tipos:

- text.
- image.
- system.

Funciones:

- Chat en vivo.
- Moderación.
- Silenciar usuario.
- Eliminar mensaje.
- Bloquear usuario.
- Limitar frecuencia.
- Reportar mensaje.

---

# 33. Promociones

La tabla `promotions` deberá evolucionar hacia una estructura más flexible.

Campos:

- id.
- title.
- description.
- media_type.
- media_url.
- target.
- status.
- starts_at.
- ends_at.
- sort_order.
- metadata.

Tipos:

- image.
- video.
- banner.

Targets:

- home.
- event.
- mobile.
- desktop.

---

# 34. Panel administrativo

## Dashboard

Indicadores:

- Usuarios activos.
- Eventos actuales.
- Eventos próximos.
- Rondas activas.
- Apuestas actuales.
- Dinero apostado.
- Premios pagados.
- Ingresos/comisiones.
- Usuarios conectados.
- Estado del streaming.

## Gestión

- Usuarios.
- Roles.
- Eventos.
- Rondas.
- Apuestas.
- Resultados.
- Wallets.
- Transacciones.
- Streaming.
- Chat.
- Promociones.
- Auditoría.
- Reportes.

---

# 35. Panel de operación de evento

Se recomienda un panel específico para operadores.

Debe mostrar:

- Evento.
- Stream.
- Estado LIVE.
- Ronda actual.
- Tiempo.
- Total apostado.
- Total rojo.
- Total verde.
- Cantidad de apuestas.
- Usuarios conectados.
- Estado del chat.

Acciones:

- Abrir ronda.
- Cerrar apuestas.
- Iniciar ronda.
- Registrar ganador.
- Liquidar ronda.
- Suspender apuestas.
- Finalizar evento.
- Reiniciar/revocar streaming.

---

# 36. Máquina de estados

Se deberá implementar una máquina de estados para eventos y rondas.

## Evento

`DRAFT → SCHEDULED → LIVE → FINISHED`

Alternativas:

`LIVE → PAUSED`

`SCHEDULED → CANCELLED`

## Ronda

`PENDING → BETTING_OPEN → BETTING_CLOSED → IN_PROGRESS → SETTLING → SETTLED`

Esto evitará cambios inválidos de estado.

---

# 37. Auditoría

Crear:

`audit_logs`

Campos:

- id.
- user_id.
- action.
- entity_type.
- entity_id.
- old_values.
- new_values.
- ip_address.
- user_agent.
- created_at.

Acciones críticas:

- Cambio de saldo.
- Ajuste administrativo.
- Creación de evento.
- Apertura de apuestas.
- Cierre de apuestas.
- Cambio de resultado.
- Liquidación.
- Suspensión de usuario.
- Regeneración de stream key.

---

# 38. API

La API deberá organizarse por dominios.

Ejemplo:

`/api/v1/auth`

`/api/v1/users`

`/api/v1/events`

`/api/v1/events/{event}/rounds`

`/api/v1/events/{event}/bets`

`/api/v1/wallet`

`/api/v1/transactions`

`/api/v1/streaming`

`/api/v1/chat`

`/api/v1/admin`

Se deberá versionar la API.

---

# 39. Arquitectura AdonisJS

Estructura conceptual:

`app/`

- controllers/
- models/
- services/
- validators/
- policies/
- middleware/
- events/
- listeners/
- exceptions/
- repositories/
- providers/
- contracts/

Servicios principales:

- `BettingService`
- `WalletService`
- `RoundService`
- `SettlementService`
- `EventService`
- `StreamingService`
- `ChatService`
- `PromotionService`
- `AuditService`
- `NotificationService`

---

# 40. Reglas de arquitectura

## Controllers

Los controllers deberán ser delgados.

No deberán contener:

- Cálculos financieros.
- Lógica de liquidación.
- Matching.
- Reglas complejas.

## Services

Los servicios deberán contener los casos de uso.

## Models

Los modelos deberán representar entidades y relaciones.

## Validators

VineJS deberá validar entradas.

## Policies

Deberán controlar autorización.

---

# 41. Casos de uso principales

## Usuarios

- RegisterUser.
- AuthenticateUser.
- SuspendUser.
- ActivateUser.

## Wallet

- GetBalance.
- DebitWallet.
- CreditWallet.
- RefundBet.
- AdjustBalance.

## Eventos

- CreateEvent.
- PublishEvent.
- StartEvent.
- PauseEvent.
- FinishEvent.

## Rondas

- CreateRound.
- OpenBetting.
- CloseBetting.
- StartRound.
- RegisterWinner.
- SettleRound.

## Apuestas

- PlaceBet.
- CancelBet.
- MatchBets.
- ResolveBet.

## Streaming

- CreateStream.
- GenerateStreamKey.
- StartStream.
- StopStream.
- GetPlaybackUrl.

---

# 42. Idempotencia

Las operaciones críticas deberán soportar idempotencia.

Especialmente:

- Colocación de apuesta.
- Débito.
- Crédito.
- Liquidación.
- Reembolso.

Se recomienda utilizar:

`idempotency_key`

con índice único según el contexto.

---

# 43. Índices recomendados

PostgreSQL deberá tener índices sobre:

`bets(user_id, created_at)`

`bets(event_id, round_id)`

`bets(round_id, betting_side_id)`

`wallet_transactions(user_id, created_at)`

`rounds(event_id, round_number)`

`messages(event_id, created_at)`

`audit_logs(entity_type, entity_id)`

`events(status, scheduled_at)`

También deberán utilizarse índices parciales cuando aporten valor.

---

# 44. Restricciones de integridad

Se deberán utilizar:

- Foreign keys.
- Unique constraints.
- Check constraints.
- Not null.
- Valores monetarios positivos.
- Estados válidos.
- Relaciones consistentes.

Ejemplos:

`amount > 0`

`round_number > 0`

No se deberá confiar exclusivamente en validaciones del frontend.

---

# 45. Estructura de datos propuesta

Modelo principal:

`users`

`roles`

`user_roles`

`wallets`

`wallet_transactions`

`events`

`rounds`

`betting_sides`

`bets`

`bet_matches`

`round_results`

`messages`

`promotions`

`audit_logs`

`notifications`

`stream_configurations`

Esta estructura es más normalizada y escalable que la propuesta original.

---

# 46. Cambios respecto al SQL original

## `bettings`

Renombrar conceptualmente a:

`bets`

Cambios:

- DOUBLE → DECIMAL.
- `team` → `betting_side_id`.
- `status INTEGER` → estado controlado.
- Agregar payout.
- Agregar referencia.
- Agregar timestamps específicos.

## `events`

Eliminar:

- `time` como campo separado.

Usar:

`scheduled_at TIMESTAMPTZ`

Agregar:

- status.
- stream configuration.
- betting status.

## `rounds`

Eliminar:

- `id_round` apuntando a apuestas.

Agregar:

- status.
- betting_status.
- timestamps operativos.
- winning_side_id.

## `results`

Fusionar conceptualmente con:

`round_results`

## `winners`

Fusionar conceptualmente con:

`round_results`

## `usertransactions`

Evolucionar hacia:

`wallet_transactions`

## `users`

Eliminar:

`passwordshow`

Cambiar:

`initial_balance`

por una arquitectura de wallet.

---

# 47. Streaming Configuration

Se recomienda separar la configuración de streaming de `events`.

Tabla:

`stream_configurations`

Campos:

- id.
- event_id.
- provider.
- ingest_url.
- stream_key_encrypted.
- playback_url.
- status.
- started_at.
- ended_at.
- metadata.
- created_at.
- updated_at.

Relación:

`events 1 — 1 stream_configurations`

Esto evita llenar `events` con detalles específicos de infraestructura.

---

# 48. Proveedores de streaming

La arquitectura deberá permitir:

### Provider interno

OBS → MediaMTX/Nginx RTMP → HLS → Web

### Provider externo

OBS → proveedor externo → HLS/Embed → Web

La aplicación deberá utilizar una interfaz común para ambos.

---

# 49. Frontend del evento

La página pública del evento deberá incluir:

1. Player de video.
2. Estado de transmisión.
3. Información del evento.
4. Ronda actual.
5. Opciones de apuesta.
6. Saldo del usuario.
7. Historial de apuestas.
8. Chat.
9. Promociones.
10. Resultados anteriores.
11. Estado de apuestas.

En móvil deberá utilizarse un diseño mobile-first.

---

# 50. Experiencia de usuario durante una apuesta

Flujo:

1. Usuario inicia sesión.
2. Accede al evento.
3. Visualiza la transmisión.
4. Visualiza la ronda activa.
5. Selecciona lado.
6. Introduce monto.
7. Sistema valida.
8. Usuario confirma.
9. Backend procesa transacción.
10. Se descuenta saldo.
11. Se registra apuesta.
12. Se actualiza interfaz.
13. Se emite evento WebSocket.
14. Usuario visualiza confirmación.

---

# 51. Manejo de errores

El sistema deberá diferenciar:

- Saldo insuficiente.
- Apuestas cerradas.
- Ronda finalizada.
- Evento inactivo.
- Usuario bloqueado.
- Monto inválido.
- Error de concurrencia.
- Error de streaming.
- Error interno.

No se deberán mostrar errores internos de PostgreSQL al usuario.

---

# 52. Observabilidad

Se recomienda incorporar:

- Logs estructurados.
- Correlation ID.
- Request ID.
- Métricas.
- Health checks.
- Monitoreo de PostgreSQL.
- Monitoreo Redis.
- Monitoreo del servidor de streaming.
- Alertas.

Endpoints:

`/health`

`/ready`

---

# 53. Seguridad

Medidas:

- HTTPS obligatorio.
- Hash de contraseñas.
- Rate limiting.
- CSRF cuando corresponda.
- Validación server-side.
- Sanitización.
- Protección contra SQL injection mediante ORM/query builder.
- Control de permisos.
- Auditoría.
- Rotación de secretos.
- Cifrado de stream keys.
- Gestión segura de sesiones.
- Protección contra solicitudes duplicadas.

---

# 54. Protección contra fraude

Se deberá contemplar:

- Detección de múltiples cuentas.
- Límites de apuesta.
- Límites diarios.
- Límites por evento.
- Límites por ronda.
- Suspensión temporal.
- Registro de IP.
- Device fingerprint opcional.
- Detección de patrones anómalos.
- Auditoría de ajustes manuales.

Estas funcionalidades deberán evolucionar según los requisitos legales y operativos.

---

# 55. Reportes

Reportes mínimos:

## Eventos

- Eventos realizados.
- Eventos cancelados.
- Eventos activos.

## Apuestas

- Total apostado.
- Apuestas por usuario.
- Apuestas por ronda.
- Apuestas por lado.

## Financiero

- Débitos.
- Créditos.
- Premios.
- Reembolsos.
- Comisiones.
- Ajustes.

## Usuarios

- Usuarios activos.
- Usuarios nuevos.
- Usuarios suspendidos.

---

# 56. Backups

PostgreSQL deberá tener:

- Backup automático diario.
- Backup incremental cuando la infraestructura lo permita.
- Retención configurable.
- Backup fuera del servidor principal.
- Pruebas periódicas de restauración.

Redis podrá reconstruirse desde PostgreSQL y no deberá considerarse la fuente principal de información financiera.

---

# 57. Escalabilidad

## Etapa inicial

Una infraestructura puede contener:

- Nginx.
- AdonisJS.
- PostgreSQL.
- Redis.

El streaming preferiblemente deberá estar en un servidor independiente.

## Crecimiento

Separar:

- Backend.
- PostgreSQL.
- Redis.
- Streaming.
- CDN.

La aplicación AdonisJS deberá poder ejecutarse en múltiples instancias.

---

# 58. CDN y streaming

Cuando aumente el número de espectadores:

`OBS → RTMP → Media Server → HLS → CDN → Usuarios`

Esto evita que cada usuario consuma directamente el ancho de banda del servidor de origen.

El backend continuará manejando:

- Eventos.
- Usuarios.
- Apuestas.
- Wallet.
- Rondas.
- Chat.
- Estados.

---

# 59. Testing

Se deberán implementar:

- Unit tests.
- Integration tests.
- Feature tests.
- Tests de concurrencia.
- Tests de liquidación.
- Tests de wallet.
- Tests de permisos.
- Tests de WebSockets.
- Tests de API.

Casos críticos:

- Dos apuestas simultáneas con el mismo saldo.
- Dos liquidaciones simultáneas.
- Apuesta durante cierre de ronda.
- Reintento de una apuesta.
- Reembolso.
- Error durante transacción.
- Desconexión del WebSocket.

---

# 60. Criterios de aceptación críticos

El sistema será considerado funcional cuando:

- Un usuario pueda registrarse.
- Un usuario pueda autenticarse.
- Un usuario tenga wallet.
- El administrador pueda crear eventos.
- El administrador pueda crear rondas.
- OBS pueda transmitir hacia el servidor RTMP.
- El evento pueda reproducir el stream en la web.
- Los usuarios puedan apostar.
- El saldo sea descontado correctamente.
- Las apuestas queden registradas.
- El operador pueda cerrar apuestas.
- El operador pueda registrar ganador.
- Las apuestas sean liquidadas.
- Los ganadores reciban crédito.
- Todos los movimientos sean auditables.
- El chat funcione en tiempo real.
- Los estados se actualicen sin recargar la página.

---

# 61. Roadmap de desarrollo

## Fase 1 — Arquitectura

- Configuración AdonisJS.
- PostgreSQL.
- Redis.
- Estructura modular.
- Autenticación.
- Roles.
- Migraciones.

## Fase 2 — Usuarios y Wallet

- Usuarios.
- Wallet.
- Ledger.
- Transacciones.
- Auditoría.

## Fase 3 — Eventos y rondas

- Eventos.
- Rondas.
- Estados.
- Operación administrativa.

## Fase 4 — Apuestas

- Creación.
- Validación.
- Débito.
- Concurrencia.
- Matching.
- Liquidación.

## Fase 5 — Streaming

- Servidor RTMP.
- Configuración OBS.
- Stream keys.
- HLS.
- Player.
- Estado del stream.

## Fase 6 — Tiempo real

- WebSockets.
- Redis Pub/Sub.
- Actualizaciones de apuestas.
- Rondas.
- Balance.
- Chat.

## Fase 7 — Administración

- Dashboard.
- Reportes.
- Moderación.
- Promociones.
- Auditoría.

## Fase 8 — Hardening

- Seguridad.
- Testing.
- Performance.
- Backups.
- Observabilidad.
- Load testing.

---

# 62. Arquitectura final recomendada

```text
                         ┌──────────────────────┐
                         │      Usuarios        │
                         │ Web / Mobile Browser │
                         └──────────┬───────────┘
                                    │
                         HTTPS / WebSocket
                                    │
                  ┌─────────────────▼─────────────────┐
                  │             NGINX                 │
                  │ Reverse Proxy / SSL / Routing     │
                  └───────────────┬──────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │       AdonisJS API        │
                    │       TypeScript          │
                    └──────┬─────────┬─────────┘
                           │         │
                 ┌─────────▼───┐ ┌───▼─────────┐
                 │ PostgreSQL  │ │    Redis    │
                 │ Source of   │ │ Cache / WS  │
                 │ Truth       │ │ Pub/Sub     │
                 └─────────────┘ └─────────────┘

       ┌─────────────── Streaming Infrastructure ───────────────┐

       Cámara
          │
          ▼
       OBS Studio
          │
          │ RTMP
          ▼
     Media Server
   MediaMTX / Nginx
          │
          │ HLS
          ▼
        CDN
          │
          ▼
      Web Player
```

---

# 63. Decisiones arquitectónicas finales

### Base de datos

**PostgreSQL**

### Cache / tiempo real

**Redis**

### Backend

**AdonisJS + TypeScript**

### ORM

**Lucid ORM**

### Validación

**VineJS**

### Streaming

**OBS Studio + RTMP + HLS**

### Media Server

**MediaMTX o Nginx RTMP**

### Reproducción

**HTML5 Video + HLS.js**

### Comunicación en tiempo real

**WebSockets + Redis Pub/Sub**

### Dinero

**DECIMAL**

### Arquitectura

**Modular Monolith inicialmente**

La aplicación deberá diseñarse de manera que determinados componentes puedan separarse posteriormente.

---

# 64. Recomendación sobre la estructura SQL original

La estructura proporcionada es funcional como prototipo, pero no debería utilizarse directamente como esquema definitivo de producción.

Los principales cambios requeridos son:

1. Sustituir `DOUBLE PRECISION` por `DECIMAL`.
2. Eliminar `passwordshow`.
3. Separar wallet de usuario.
4. Crear ledger financiero inmutable.
5. Eliminar relaciones ambiguas entre rounds y bettings.
6. Unificar `results` y `winners`.
7. Crear `betting_sides`.
8. Crear `round_results`.
9. Crear `audit_logs`.
10. Separar configuración de streaming.
11. Utilizar estados explícitos.
12. Incorporar idempotencia.
13. Incorporar índices.
14. Incorporar constraints.
15. Separar responsabilidades entre dominio financiero, apuestas y streaming.

---

# 65. Resultado esperado

Al finalizar el proyecto se deberá disponer de una plataforma donde un operador pueda:

1. Crear un evento.
2. Configurar su transmisión.
3. Obtener la configuración RTMP para OBS.
4. Iniciar OBS.
5. Verificar que el stream está disponible.
6. Activar el evento.
7. Crear una ronda.
8. Abrir apuestas.
9. Recibir apuestas en tiempo real.
10. Ver estadísticas.
11. Cerrar apuestas.
12. Registrar el resultado.
13. Liquidar automáticamente.
14. Actualizar balances.
15. Auditar todas las operaciones.
16. Continuar con la siguiente ronda.
17. Finalizar el evento.

Mientras tanto, el usuario podrá:

1. Registrarse.
2. Iniciar sesión.
3. Consultar su saldo.
4. Entrar a un evento.
5. Ver la transmisión.
6. Consultar la ronda activa.
7. Realizar una apuesta.
8. Ver su confirmación.
9. Participar en el chat.
10. Consultar resultados.
11. Consultar sus movimientos.

---

# 66. Principio fundamental del sistema

La plataforma deberá separar claramente tres dominios:

```text
BETTING DOMAIN
Apuestas
Rondas
Resultados
Liquidaciones

FINANCIAL DOMAIN
Wallet
Ledger
Débitos
Créditos
Premios
Reembolsos

STREAMING DOMAIN
OBS
RTMP
Media Server
HLS
Player
Estado de transmisión
```

Estos dominios podrán comunicarse mediante eventos, pero no deberán mezclarse en una única capa de aplicación.

Esta separación permitirá que el sistema evolucione desde un proyecto inicial hacia una plataforma de producción con múltiples eventos simultáneos, múltiples operadores, mayor cantidad de usuarios y diferentes proveedores de streaming.

---

# 67. Nota final de implementación

La prioridad técnica debe ser:

**Integridad financiera → Concurrencia → Seguridad → Operación en tiempo real → Streaming → Escalabilidad.**

El streaming no deberá condicionar la integridad de las apuestas.

Si el servidor de streaming falla:

- El sistema deberá detectar el incidente.
- El evento podrá pasar a estado `stream_interrupted`.
- El operador podrá suspender apuestas.
- Las operaciones financieras ya confirmadas deberán permanecer intactas.
- PostgreSQL seguirá siendo la fuente de verdad.

La pérdida del streaming nunca deberá provocar pérdida o corrupción de información financiera.

