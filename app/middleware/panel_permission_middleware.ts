import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuthorizationService from '#services/authorization_service'

export default class PanelPermissionMiddleware {
  async handle(
    { auth, response }: HttpContext,
    next: NextFn,
    options: { permissions?: string[] } = {}
  ) {
    const user = auth.user
    if (!user) return response.redirect('/login')

    const authorization = new AuthorizationService()
    const allowed = await Promise.all(
      (options.permissions || []).map((permission) =>
        authorization.userHasPermission(user.id, permission)
      )
    )

    if (allowed.some((value) => !value)) {
      return response.status(403).send('No tienes permisos para acceder a esta sección.')
    }

    return next()
  }
}
