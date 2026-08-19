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
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
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
  .get('/api/v1/admin/access-check', [
    () => import('#controllers/admin_access_controller'),
    'check',
  ])
  .use([
    middleware.apiAuth(),
    middleware.permission({ permissions: ['admin.access'] }),
    apiThrottle,
  ])
