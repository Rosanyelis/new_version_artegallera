# Proposal: Plataforma de apuestas y transmisiones de gallos

## Estado

Propuesto

## Contexto

El PDR define una plataforma con tres dominios críticos: apuestas, finanzas y streaming. El repositorio está vacío salvo por el PDR, por lo que se necesita una planificación ejecutable que establezca la arquitectura, el orden de entrega y los límites entre backend, panel administrativo y experiencia pública.

## Objetivo

Construir un monolito modular en un único proyecto que permita:

- Operar usuarios, roles, eventos, rondas, apuestas, wallets y liquidaciones desde AdonisJS.
- Administrar eventos y streaming desde un panel protegido de AdonisJS.
- Ofrecer una landing React responsive para clientes, incluyendo eventos, reproducción HLS, apuestas, saldo, chat y resultados.
- Mantener PostgreSQL como fuente de verdad financiera y Redis como infraestructura temporal y de tiempo real.

## Decisiones de alcance

- AdonisJS + TypeScript será el backend, API versionada y panel administrativo.
- El panel administrativo se implementará con vistas Edge de AdonisJS y JavaScript progresivo donde sea suficiente; no será otra aplicación React.
- React será una aplicación pública dentro del mismo repositorio, compilada por Adonis Vite y servida por las vistas Edge de AdonisJS.
- La primera entrega usará un pool por lado. El matching individual se deja como decisión posterior y no bloquea el MVP.
- No se implementarán pagos externos ni una aplicación móvil nativa en esta etapa.
- El streaming será externo al proceso Node: OBS -> MediaMTX/Nginx RTMP -> HLS. AdonisJS administrará configuración y estado mediante un adapter.

## Resultado esperado

Un operador podrá crear y ejecutar un evento completo, y un usuario podrá registrarse, ver la transmisión, apostar en una ronda abierta, consultar su saldo y recibir el resultado sin recargar la página.

## Riesgos y mitigaciones

- **Integridad financiera:** ledger inmutable, DECIMAL, transacciones PostgreSQL, locking, idempotencia y pruebas de concurrencia.
- **Cambios inválidos de estado:** máquina de estados centralizada en servicios de dominio.
- **Exposición de credenciales de streaming:** stream keys cifradas y disponibles únicamente en el panel autorizado.
- **Caída del streaming:** estados desacoplados; una interrupción no revierte operaciones financieras confirmadas.
- **Regulación:** reglas configurables, feature flags y validaciones de jurisdicción antes de producción.

## Criterios de aprobación

- La estructura de un solo proyecto queda documentada y reproducible.
- El flujo de apuesta y liquidación es transaccional, idempotente y auditable.
- El panel puede operar el ciclo de evento/ronda.
- La landing React consume la API y WebSockets sin duplicar reglas de negocio.
- Las tareas están ordenadas por dependencias y cada fase tiene criterios verificables.
