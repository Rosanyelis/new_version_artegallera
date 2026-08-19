import type { HttpContext } from '@adonisjs/core/http'
import EventService, { type EventStatus } from '#services/event_service'
import RoundService, { type RoundStatus } from '#services/round_service'
import SettlementService from '#services/settlement_service'
import { eventCreateValidator, roundCreateValidator, roundResultValidator } from '#validators/event'

export default class EventController {
  private events = new EventService()
  private rounds = new RoundService()
  private settlement = new SettlementService()

  async index({ response }: HttpContext) {
    return response.ok({ data: await this.events.listPublic() })
  }

  async show({ params, response }: HttpContext) {
    const event = await this.events.findPublic(params.slug)
    if (!event)
      return response.notFound({
        error: { code: 'EVENT_NOT_FOUND', message: 'Evento no encontrado.' },
      })
    return response.ok({ data: event })
  }

  async create({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(eventCreateValidator)
    const event = await this.events.create(payload, auth.user!.id)
    return response.created({ data: event })
  }

  async transition({ auth, params, response }: HttpContext) {
    const event = await this.events.transition(
      Number(params.id),
      params.action as EventStatus,
      auth.user!.id
    )
    if (!event)
      return response.notFound({
        error: { code: 'EVENT_NOT_FOUND', message: 'Evento no encontrado.' },
      })
    return response.ok({ data: event })
  }

  async createRound({ auth, params, request, response }: HttpContext) {
    const { roundNumber } = await request.validateUsing(roundCreateValidator)
    const round = await this.rounds.create(Number(params.eventId), roundNumber, auth.user!.id)
    if (!round)
      return response.notFound({
        error: { code: 'EVENT_NOT_FOUND', message: 'Evento no encontrado.' },
      })
    return response.created({ data: round })
  }

  async transitionRound({ auth, params, request, response }: HttpContext) {
    if (params.action === 'settled') {
      const result = await this.settlement.settle(Number(params.id), auth.user!.id)
      if (!result)
        return response.notFound({
          error: { code: 'ROUND_NOT_FOUND', message: 'Ronda no encontrada.' },
        })
      return response.ok({ data: result })
    }

    let winningSideId: number | undefined
    if (params.action === 'settling') {
      const result = await request.validateUsing(roundResultValidator)
      winningSideId = result.winningSideId
    }
    const round = await this.rounds.transition(
      Number(params.id),
      params.action as RoundStatus,
      auth.user!.id,
      winningSideId
    )
    if (!round)
      return response.notFound({
        error: { code: 'ROUND_NOT_FOUND', message: 'Ronda no encontrada.' },
      })
    return response.ok({ data: round })
  }
}
