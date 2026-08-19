/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import { apiThrottle, authThrottle } from '#start/limiter'
import router from '@adonisjs/core/services/router'

router.get('/health', [() => import('#controllers/health_controller'), 'health']).as('health')
router.get('/ready', [() => import('#controllers/health_controller'), 'ready']).as('ready')

router.on('/').render('pages/home').as('home')
router
  .get('/eventos', [() => import('#controllers/client_shell_controller'), 'show'])
  .as('client.events')
router
  .get('/eventos/:slug', [() => import('#controllers/client_shell_controller'), 'show'])
  .as('client.event')
router
  .get('/login', [() => import('#controllers/client_shell_controller'), 'show'])
  .as('session.create')
router
  .get('/registro', [() => import('#controllers/client_shell_controller'), 'show'])
  .as('client.register')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

router
  .group(() => {
    router
      .post('register', [() => import('#controllers/api_auth_controller'), 'register'])
      .use(authThrottle)
    router
      .post('login', [() => import('#controllers/api_auth_controller'), 'login'])
      .use(authThrottle)
    router
      .post('forgot-password', [() => import('#controllers/api_auth_controller'), 'forgotPassword'])
      .use(authThrottle)
    router
      .post('reset-password', [() => import('#controllers/api_auth_controller'), 'resetPassword'])
      .use(authThrottle)
  })
  .prefix('/api/v1/auth')

router
  .group(() => {
    router.get('me', [() => import('#controllers/api_auth_controller'), 'me'])
    router.post('logout', [() => import('#controllers/api_auth_controller'), 'logout'])
  })
  .prefix('/api/v1/auth')
  .use([middleware.apiAuth(), apiThrottle])

router
  .group(() => {
    router.get('/', [() => import('#controllers/wallet_controller'), 'balance'])
    router.get('/transactions', [() => import('#controllers/wallet_controller'), 'transactions'])
  })
  .prefix('/api/v1/wallet')
  .use([middleware.apiAuth(), apiThrottle])

router
  .post('/api/v1/admin/wallets/adjust', [() => import('#controllers/wallet_controller'), 'adjust'])
  .use([
    middleware.apiAuth(),
    middleware.permission({ permissions: ['wallets.manage'] }),
    apiThrottle,
  ])

router.get('/api/v1/events', [() => import('#controllers/event_controller'), 'index'])
router.get('/api/v1/events/:slug', [() => import('#controllers/event_controller'), 'show'])
router.get('/api/v1/events/:eventId/rounds/:roundId/result', [
  () => import('#controllers/bet_controller'),
  'result',
])

router
  .post('/api/v1/events/:eventId/rounds/:roundId/bets', [
    () => import('#controllers/bet_controller'),
    'place',
  ])
  .use([middleware.apiAuth(), apiThrottle])

router
  .get('/api/v1/bets', [() => import('#controllers/bet_controller'), 'mine'])
  .use([middleware.apiAuth(), apiThrottle])

router
  .group(() => {
    router.post('/', [() => import('#controllers/event_controller'), 'create'])
    router.post('/:id/state/:action', [() => import('#controllers/event_controller'), 'transition'])
    router.post('/:eventId/rounds', [() => import('#controllers/event_controller'), 'createRound'])
    router.post('/rounds/:id/state/:action', [
      () => import('#controllers/event_controller'),
      'transitionRound',
    ])
  })
  .prefix('/api/v1/admin/events')
  .use([
    middleware.apiAuth(),
    middleware.permission({ permissions: ['events.manage'] }),
    apiThrottle,
  ])

router
  .post('/api/v1/admin/rounds/:roundId/settle', [
    () => import('#controllers/bet_controller'),
    'settle',
  ])
  .use([
    middleware.apiAuth(),
    middleware.permission({ permissions: ['rounds.operate'] }),
    apiThrottle,
  ])

router
  .get('/api/v1/admin/access-check', [
    () => import('#controllers/admin_access_controller'),
    'check',
  ])
  .use([
    middleware.apiAuth(),
    middleware.permission({ permissions: ['admin.access'] }),
    apiThrottle,
  ])

router
  .group(() => {
    router
      .get('/', [() => import('#controllers/admin_controller'), 'dashboard'])
      .as('admin.dashboard')
    router
      .get('/events/:slug', [() => import('#controllers/admin_controller'), 'event'])
      .as('admin.event')
    router
      .post('/events', [() => import('#controllers/admin_controller'), 'storeEvent'])
      .as('admin.events.store')
    router
      .post('/events/:eventId/:slug/rounds', [
        () => import('#controllers/admin_controller'),
        'storeRound',
      ])
      .as('admin.rounds.store')
    router
      .post('/events/:id/state/:action', [
        () => import('#controllers/admin_controller'),
        'transitionEvent',
      ])
      .as('admin.events.transition')
    router
      .post('/events/:slug/rounds/:id/state/:action', [
        () => import('#controllers/admin_controller'),
        'transitionRound',
      ])
      .as('admin.rounds.transition')
  })
  .prefix('/admin')
  .use([middleware.auth(), middleware.adminPermission()])
