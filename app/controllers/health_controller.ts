import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'
import { performance } from 'node:perf_hooks'

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

  async metrics({ response }: HttpContext) {
    const dbStart = performance.now()
    const dbOk = await db
      .rawQuery('select 1')
      .then(() => true)
      .catch(() => false)
    const dbLatency = Math.round(performance.now() - dbStart)

    const redisStart = performance.now()
    const redisOk = await redis
      .ping()
      .then(() => true)
      .catch(() => false)
    const redisLatency = Math.round(performance.now() - redisStart)

    const queries = await Promise.all([
      db.from('users').count('* as total'),
      db.from('events').count('* as total'),
      db.from('bets').count('* as total'),
      db.from('wallet_transactions').count('* as total'),
      db.from('rounds').count('* as total'),
      db.from('messages').count('* as total'),
    ])

    const memory = process.memoryUsage()

    return response.ok({
      status: dbOk && redisOk ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        postgres: { ok: dbOk, latencyMs: dbLatency },
        redis: { ok: redisOk, latencyMs: redisLatency },
      },
      process: {
        memory: {
          rssMb: Math.round(memory.rss / 1024 / 1024),
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        },
      },
      counts: {
        users: Number(queries[0][0].total),
        events: Number(queries[1][0].total),
        bets: Number(queries[2][0].total),
        walletTransactions: Number(queries[3][0].total),
        rounds: Number(queries[4][0].total),
        messages: Number(queries[5][0].total),
      },
    })
  }
}
