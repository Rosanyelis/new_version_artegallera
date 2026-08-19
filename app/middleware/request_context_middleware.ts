import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { randomUUID } from 'node:crypto'

export default class RequestContextMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const requestId = ctx.request.id() || randomUUID()
    ctx.response.header('x-request-id', requestId)
    return next()
  }
}
