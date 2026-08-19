import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/limiter'
import type { InferLimiters } from '@adonisjs/limiter/types'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),
  stores: {
    redis: stores.redis({
      connectionName: 'main',
      keyPrefix: 'artegallera:limiter',
      rejectIfRedisNotReady: true,
    }),
    memory: stores.memory({
      keyPrefix: 'artegallera:limiter',
    }),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
