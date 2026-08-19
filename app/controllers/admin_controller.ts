import type { HttpContext } from '@adonisjs/core/http'
import EventService from '#services/event_service'
import RoundService from '#services/round_service'
import { eventCreateValidator, roundCreateValidator, roundResultValidator } from '#validators/event'

export default class AdminController {
  private events = new EventService()
  private rounds = new RoundService()

  async dashboard({ view }: HttpContext) {
    const events = await this.events.listAdmin()
    return view.render('pages/admin/dashboard', { events })
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
    let winningSideId: number | undefined
    if (params.action === 'settling') {
      const payload = await request.validateUsing(roundResultValidator)
      winningSideId = payload.winningSideId
    }
    await this.rounds.transition(Number(params.id), params.action, auth.user!.id, winningSideId)
    return response.redirect(`/admin/events/${params.slug}`)
  }
}
