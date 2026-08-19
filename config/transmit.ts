import { defineConfig } from '@adonisjs/transmit'
import env from '#start/env'
import { redis } from '@boringnode/bus/transports/redis'

export default defineConfig({
  pingInterval: '1m',
  transport: {
    driver: redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD')?.release(),
    }),
  },
})
