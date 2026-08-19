import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'

export default class HealthController {
  async health({ response }: HttpContext) {
    return response.ok({ status: 'ok', service: 'artegallera-api' })
  }

  async ready({ response }: HttpContext) {
    const checks = { postgres: false, redis: false }

    try {
      await db.rawQuery('select 1')
      checks.postgres = true
    } catch {}

    try {
      await redis.ping()
      checks.redis = true
    } catch {}

    const ready = checks.postgres && checks.redis
    return response.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      checks,
    })
  }
}
