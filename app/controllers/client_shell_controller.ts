import type { HttpContext } from '@adonisjs/core/http'

export default class ClientShellController {
  async show({ view }: HttpContext) {
    return view.render('pages/home')
  }
}
