/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'
import app from '@adonisjs/core/services/app'

export const apiThrottle = limiter.define('api', (ctx) => {
  return limiter
    .allowRequests(100)
    .every('1 hour')
    .usingKey(ctx.auth.user?.id?.toString() || ctx.request.ip())
})

export const authThrottle = limiter.define('auth', (ctx) => {
  return limiter
    .allowRequests(app.inTest ? 100 : 5)
    .every('15 minutes')
    .blockFor('1 hour')
    .usingKey(`${ctx.request.ip()}:${ctx.request.url()}`)
})

export const throttle = limiter.define('global', (ctx) => {
  return limiter.allowRequests(60).every('1 minute').usingKey(ctx.request.ip())
})
