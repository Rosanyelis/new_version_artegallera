# Design: Plataforma de apuestas y transmisiones de gallos

## 1. Arquitectura del repositorio

```text
artegallera/
  app/                         # Dominio AdonisJS
    controllers/               # API y panel, delgados
    models/                    # Lucid
    services/                  # Casos de uso y transacciones
    validators/                # VineJS
    policies/                  # Autorización
    middleware/
    providers/                 # Streaming y servicios externos
    contracts/
    events/ listeners/
  database/
    migrations/ seeders/ factories/
  resources/
    views/admin/                # Panel Edge administrativo
    client/                     # Fuente React de la landing
  public/assets/                # Assets generados por Adonis Vite, no editar
  start/routes.ts               # Web pública, API y panel
  tests/                        # Unit, functional, integration y concurrency
  openspec/changes/              # Propuestas y planificación
```

AdonisJS ejecutará la API en `/api/v1`, el panel en `/admin` y servirá las vistas Edge que montan los assets compilados de React para las rutas públicas (`/`, `/eventos/:slug`). El build de React formará parte del pipeline de CI y del artefacto de despliegue de AdonisJS.

## 2. Separación de responsabilidades

### Backend y dominio

- `BettingService`: validar y registrar apuestas.
- `WalletService`: débito, crédito, reembolso y ajustes, siempre dentro de transacciones.
- `SettlementService`: resultado, premios y liquidación idempotente.
- `EventService` y `RoundService`: transiciones de estado.
- `StreamingService`: fachada sobre `StreamingProviderInterface`.
- `ChatService`, `PromotionService`, `NotificationService` y `AuditService`.

Los controllers solo orquestan request, autorización, validación y response. Los modelos no ejecutan liquidaciones ni modifican balances por su cuenta.

### Panel administrativo

Vistas Edge bajo `/admin` con policies por permiso. Incluirá dashboard, CRUD operativo, operación de evento, wallets/transacciones, streaming, moderación, promociones, auditoría y reportes. Las acciones críticas usarán POST explícito, confirmación y registro de auditoría.

### Landing React

`resources/client` tendrá las páginas de inicio, listado/detalle de eventos, autenticación, wallet, mis apuestas y perfil. Usará React Router para navegación y un cliente HTTP tipado hacia `/api/v1`; se recomienda TanStack Query para cache/invalidation y un cliente WebSocket para eventos en vivo. React no calculará premios ni decidirá si una apuesta es válida.

## 3. Modelo de datos inicial

Entidades: `users`, `roles`, `permissions`, `user_roles`, `wallets`, `wallet_transactions`, `events`, `rounds`, `betting_sides`, `bets`, `round_results`, `messages`, `promotions`, `audit_logs`, `notifications` y `stream_configurations`.

Reglas obligatorias:

- Dinero en `DECIMAL(15,2)` o una precisión única definida antes de la primera migración.
- `wallet_transactions` es inmutable; las correcciones son reversals.
- `wallets` se bloquea durante las operaciones financieras.
- `idempotency_key` con constraint único para apuesta, movimientos y liquidación.
- Foreign keys, estados controlados, montos positivos y `round_number > 0`.
- El matching (`bet_matches`) no se crea en MVP; se agrega solo si el negocio confirma ese modelo.

## 4. Flujos críticos

### Colocar apuesta

1. Autenticar y autorizar usuario.
2. Validar evento, ronda, lado, límites y reglas regulatorias.
3. Abrir transacción PostgreSQL.
4. Bloquear wallet, comprobar saldo y deducir.
5. Crear `bet` y `wallet_transaction` con referencia/idempotencia.
6. Confirmar transacción.
7. Publicar `bet.accepted` y `balance.updated` después del commit.

### Liquidar ronda

1. Bloquear ronda y verificar que no esté liquidada.
2. Cerrar apuestas y registrar lado ganador.
3. Calcular pool, premios y comisión en el servicio.
4. Crear resultado, créditos y ledger dentro de una transacción.
5. Marcar apuestas y ronda como liquidadas.
6. Emitir eventos únicamente después del commit.

### Streaming

`StreamingService` ocultará el proveedor concreto. Las claves se generan, cifran, rotan y revocan en backend. El cliente React recibe solo `playback_url` HLS y estado normalizado.

## 5. API y tiempo real

Rutas base: `/api/v1/auth`, `/users`, `/events`, `/events/:event/rounds`, `/events/:event/bets`, `/wallet`, `/transactions`, `/streaming`, `/chat` y `/admin`.

WebSockets/Redis publicarán, como mínimo: `event.updated`, estados de stream, apertura/cierre/resultado/liquidación de rondas, aceptación de apuestas, actualización de balance y mensajes de chat. PostgreSQL seguirá siendo la fuente de verdad.

## 6. Seguridad y operación

- Hash de contraseñas, sesiones seguras, verificación de correo y rate limiting.
- VineJS en entradas y policies en cada acción administrativa.
- Correlation/request ID, logs estructurados, `/health` y `/ready`.
- Sin credenciales de RTMP en respuestas públicas ni logs.
- Retención y backup PostgreSQL con pruebas de restauración.
- HTTPS, CSP, CORS restringido al mismo origen y protección contra solicitudes duplicadas.

## 7. Estrategia de despliegue

CI instala dependencias, ejecuta tests, compila React, compila AdonisJS y construye un único artefacto. Nginx termina TLS y enruta hacia AdonisJS; PostgreSQL, Redis y el media server pueden estar separados. El media server no se ejecuta dentro de Node.

## 8. Decisiones pendientes antes de producción

- Jurisdicción, KYC, edad, geolocalización, límites y juego responsable.
- Precisión monetaria definitiva y moneda soportada.
- MediaMTX o Nginx RTMP según carga esperada.
- Modelo de pool versus matching individual.
- Proveedor de correo, almacenamiento de imágenes y observabilidad.
