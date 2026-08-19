import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ApiAuthMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    try {
      await auth.authenticate()
      return next()
    } catch {
      return response.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Debes iniciar sesión para continuar.',
        },
      })
    }
  }
}
