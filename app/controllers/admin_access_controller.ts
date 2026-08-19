import type { HttpContext } from '@adonisjs/core/http'

export default class AdminAccessController {
  async check({ auth, response }: HttpContext) {
    return response.ok({
      data: {
        authorized: true,
        userId: auth.user!.id,
      },
    })
  }
}
