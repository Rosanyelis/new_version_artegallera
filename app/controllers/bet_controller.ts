import type { HttpContext } from '@adonisjs/core/http'
import BettingService from '#services/betting_service'
import SettlementService from '#services/settlement_service'
import { placeBetValidator } from '#validators/bet'
import db from '@adonisjs/lucid/services/db'

export default class BetController {
  private betting = new BettingService()
  private settlement = new SettlementService()

  async place({ auth, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(placeBetValidator)
    const bet = await this.betting.placeBet(
      auth.user!.id,
      Number(params.eventId),
      Number(params.roundId),
      payload.bettingSideId,
      payload.amount,
      {
        idempotencyKey: payload.idempotencyKey,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }
    )
    return response.created({ data: bet })
  }

  async mine({ auth, request, response }: HttpContext) {
    const bets = await this.betting.listUserBets(auth.user!.id, Number(request.input('limit', 50)))
    return response.ok({ data: bets })
  }

  async result({ params, response }: HttpContext) {
    const result = await db
      .from('round_results')
      .where({ event_id: Number(params.eventId), round_id: Number(params.roundId) })
      .first()
    if (!result)
      return response.notFound({
        error: { code: 'RESULT_NOT_FOUND', message: 'Resultado no encontrado.' },
      })
    return response.ok({ data: result })
  }

  async settle({ auth, params, response }: HttpContext) {
    const result = await this.settlement.settle(Number(params.roundId), auth.user!.id)
    if (!result)
      return response.notFound({
        error: { code: 'ROUND_NOT_FOUND', message: 'Ronda no encontrada.' },
      })
    return response.ok({ data: result })
  }
}
