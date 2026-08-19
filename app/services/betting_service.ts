import db from '@adonisjs/lucid/services/db'
import AuditService from '#services/audit_service'
import WalletService, { parseMoney, formatMoney } from '#services/wallet_service'
import { BettingClosedError, InvalidBetError } from '#exceptions/betting'
import { IdempotencyConflictError } from '#exceptions/wallet'

type PlaceBetOptions = {
  idempotencyKey: string
  reference?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export default class BettingService {
  private wallet = new WalletService()
  private audit = new AuditService()

  async placeBet(
    userId: number,
    eventId: number,
    roundId: number,
    bettingSideId: number,
    amount: string,
    options: PlaceBetOptions
  ) {
    return db.transaction(async (trx) => {
      const round = await trx
        .from('rounds')
        .where({ id: roundId, event_id: eventId })
        .forUpdate()
        .first()
      if (!round || round.status !== 'betting_open' || round.betting_status !== 'open') {
        throw new BettingClosedError()
      }

      const user = await trx.from('users').where('id', userId).first()
      if (!user || user.status !== 'active' || !user.is_betting_enabled) {
        throw new InvalidBetError()
      }

      const side = await trx
        .from('betting_sides')
        .where({ id: bettingSideId, event_id: eventId, round_id: roundId })
        .first()
      if (!side) throw new InvalidBetError()

      const existing = await trx
        .from('bets')
        .where('idempotency_key', options.idempotencyKey)
        .first()
      if (existing) {
        if (existing.user_id !== userId) throw new IdempotencyConflictError()
        return existing
      }

      const walletTransaction = await this.wallet.debitInTransaction(trx, userId, amount, 'bet', {
        idempotencyKey: `bet:${options.idempotencyKey}`,
        reference: options.reference,
        description: `Apuesta en ronda ${round.round_number}`,
        metadata: options.metadata,
        actorUserId: userId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      })
      const amountCents = parseMoney(amount)
      const totalPool = parseMoney(round.total_pool) + amountCents
      const sideTotalColumn = side.code === 'RED' ? 'total_red' : 'total_green'
      const sideTotal = parseMoney(round[sideTotalColumn]) + amountCents
      await trx
        .from('rounds')
        .where('id', roundId)
        .update({
          total_pool: formatMoney(totalPool),
          [sideTotalColumn]: formatMoney(sideTotal),
          updated_at: new Date(),
        })

      await trx.table('bets').insert({
        user_id: userId,
        event_id: eventId,
        round_id: roundId,
        betting_side_id: bettingSideId,
        amount: formatMoney(amountCents),
        status: 'accepted',
        placed_at: new Date(),
        payout_amount: '0.00',
        transaction_id: walletTransaction.id,
        idempotency_key: options.idempotencyKey,
        reference: options.reference || null,
        metadata: options.metadata || null,
        created_at: new Date(),
      })
      const bet = await trx.from('bets').where('idempotency_key', options.idempotencyKey).first()
      await this.audit.record({
        trx,
        userId,
        action: 'bet.created',
        entityType: 'bet',
        entityId: bet.id,
        newValues: { amount: formatMoney(amountCents), eventId, roundId, bettingSideId },
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      })
      return bet
    })
  }

  async listUserBets(userId: number, limit = 50) {
    return db
      .from('bets')
      .where('user_id', userId)
      .orderBy('id', 'desc')
      .limit(Math.min(limit, 100))
  }
}
