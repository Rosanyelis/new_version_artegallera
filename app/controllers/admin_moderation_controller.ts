import type { HttpContext } from '@adonisjs/core/http'
import AdminService from '#services/admin_service'
import { moderationValidator } from '#validators/admin'

export default class AdminModerationController {
  private admin = new AdminService()

  async index({ request, view }: HttpContext) {
    const filters = request.qs()
    const messages = await this.admin.listModerationMessages({
      eventId: filters.eventId,
      status: filters.status,
      search: filters.search,
      from: filters.from,
      to: filters.to,
    })
    const events = await this.admin.listEventsBrief()
    return view.render('pages/admin/moderation/index', { messages, events, filters })
  }

  async moderate({ params, auth, request, response, session }: HttpContext) {
    const { action } = await request.validateUsing(moderationValidator)
    const message = await this.admin.moderateMessage(Number(params.id), action, auth.user!.id)
    if (!message) return response.notFound()
    const label = action === 'hide' ? 'ocultado' : action === 'show' ? 'restaurado' : 'eliminado'
    session.flash('success', `Mensaje ${label}.`)
    return response.redirect().back()
  }
}
