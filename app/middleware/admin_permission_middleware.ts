import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuthorizationService from '#services/authorization_service'

export default class AdminPermissionMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user
    if (!user) return response.redirect('/login')

    const allowed = await new AuthorizationService().userHasPermission(user.id, 'admin.access')
    if (!allowed)
      return response.status(403).send('No tienes permisos para acceder al panel administrativo.')

    return next()
  }
}
