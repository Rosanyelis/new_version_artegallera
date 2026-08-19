import type { HttpContext } from '@adonisjs/core/http'
import EventService from '#services/event_service'
import RoundService from '#services/round_service'
import SettlementService from '#services/settlement_service'
import AdminService from '#services/admin_service'
import { eventCreateValidator, roundCreateValidator, roundResultValidator } from '#validators/event'

export default class AdminController {
  private events = new EventService()
  private rounds = new RoundService()
  private settlement = new SettlementService()
  private admin = new AdminService()

  async dashboard({ view }: HttpContext) {
    const [events, metrics] = await Promise.all([
      this.events.listAdmin(),
      this.admin.dashboardMetrics(),
    ])
    return view.render('pages/admin/dashboard', { events, metrics })
  }

  async event({ params, view, response }: HttpContext) {
    const event = await this.events.findPublic(params.slug)
    if (!event) return response.notFound()
    return view.render('pages/admin/event', { event })
  }

  async storeEvent({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(eventCreateValidator)
    await this.events.create(payload, auth.user!.id)
    return response.redirect('/admin')
  }

  async storeRound({ auth, params, request, response }: HttpContext) {
    const { roundNumber } = await request.validateUsing(roundCreateValidator)
    const round = await this.rounds.create(Number(params.eventId), roundNumber, auth.user!.id)
    if (!round) return response.notFound()
    return response.redirect(`/admin/events/${params.slug}`)
  }

  async transitionEvent({ auth, params, response }: HttpContext) {
    await this.events.transition(Number(params.id), params.action, auth.user!.id)
    return response.redirect('/admin')
  }

  async transitionRound({ auth, params, request, response }: HttpContext) {
    if (params.action === 'settled') {
      await this.settlement.settle(Number(params.id), auth.user!.id)
      return response.redirect(`/admin/events/${params.slug}`)
    }

    let winningSideId: number | undefined
    if (params.action === 'settling') {
      const payload = await request.validateUsing(roundResultValidator)
      winningSideId = payload.winningSideId
    }
    await this.rounds.transition(Number(params.id), params.action, auth.user!.id, winningSideId)
    return response.redirect(`/admin/events/${params.slug}`)
  }
}
