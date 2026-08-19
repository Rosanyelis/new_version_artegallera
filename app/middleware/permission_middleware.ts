import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuthorizationService from '#services/authorization_service'

export default class PermissionMiddleware {
  async handle(
    { auth, response }: HttpContext,
    next: NextFn,
    options: { permissions?: string[] } = {}
  ) {
    const user = auth.user
    if (!user) {
      return response.status(401).json({
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Autenticación requerida.' },
      })
    }

    const authorization = new AuthorizationService()
    const allowed = await Promise.all(
      (options.permissions || []).map((permission) =>
        authorization.userHasPermission(user.id, permission)
      )
    )

    if (allowed.some((value) => !value)) {
      return response.status(403).json({
        error: { code: 'FORBIDDEN', message: 'No tienes permisos para esta acción.' },
      })
    }

    return next()
  }
}
