import db from '@adonisjs/lucid/services/db'
import AuditService from '#services/audit_service'
import WalletService, { parseMoney, formatMoney } from '#services/wallet_service'
import InvalidStateTransitionError from '#exceptions/state_transition'
import RealtimeService from '#services/realtime_service'

export default class SettlementService {
  private wallet = new WalletService()
  private audit = new AuditService()
  private realtime = new RealtimeService()

  async settle(roundId: number, actorUserId: number) {
    const result = await db.transaction(async (trx) => {
      const round = await trx.from('rounds').where('id', roundId).forUpdate().first()
      if (!round) return null

      const existingResult = await trx.from('round_results').where('round_id', roundId).first()
      if (existingResult) return existingResult
      if (round.status !== 'settling' || !round.winning_side_id) {
        throw new InvalidStateTransitionError('ronda', round.status, 'settled')
      }

      const bets = await trx
        .from('bets')
        .where({ round_id: roundId, status: 'accepted' })
        .orderBy('id', 'asc')
      const winners = bets.filter((bet) => bet.betting_side_id === round.winning_side_id)
      const totalPool = parseMoney(round.total_pool)
      const winningPool = winners.reduce((sum, bet) => sum + parseMoney(bet.amount), 0n)
      const commission = 0n
      const distributable = totalPool - commission
      let distributed = 0n

      if (winners.length === 0) {
        for (const bet of bets) {
          const refund = await this.wallet.creditInTransaction(
            trx,
            bet.user_id,
            bet.amount,
            'refund',
            {
              idempotencyKey: `settlement:${roundId}:refund:${bet.id}`,
              reference: String(roundId),
              description: `Reembolso de ronda ${round.round_number}`,
              actorUserId,
            }
          )
          await trx.from('bets').where('id', bet.id).update({
            status: 'refunded',
            payout_amount: bet.amount,
            settled_at: new Date(),
            transaction_id: refund.id,
            updated_at: new Date(),
          })
        }
      } else {
        for (let index = 0; index < winners.length; index += 1) {
          const bet = winners[index]
          const betAmount = parseMoney(bet.amount)
          const payout =
            index === winners.length - 1
              ? distributable - distributed
              : (betAmount * distributable) / winningPool
          distributed += payout
          const win = await this.wallet.creditInTransaction(
            trx,
            bet.user_id,
            formatMoney(payout),
            'win',
            {
              idempotencyKey: `settlement:${roundId}:win:${bet.id}`,
              reference: String(roundId),
              description: `Premio de ronda ${round.round_number}`,
              metadata: { betId: bet.id },
              actorUserId,
            }
          )
          await trx
            .from('bets')
            .where('id', bet.id)
            .update({
              status: 'won',
              payout_amount: formatMoney(payout),
              settled_at: new Date(),
              transaction_id: win.id,
              updated_at: new Date(),
            })
        }
        await trx
          .from('bets')
          .where('round_id', roundId)
          .where('status', 'accepted')
          .whereNot('betting_side_id', round.winning_side_id)
          .update({
            status: 'lost',
            settled_at: new Date(),
            updated_at: new Date(),
          })
      }

      const [roundResult] = await trx
        .table('round_results')
        .insert({
          event_id: round.event_id,
          round_id: roundId,
          winning_side_id: round.winning_side_id,
          red_total: round.total_red,
          green_total: round.total_green,
          total_pool: formatMoney(totalPool),
          total_winners: winners.length,
          total_payout: formatMoney(winners.length ? distributable : totalPool),
          house_commission: formatMoney(commission),
          settled_at: new Date(),
          metadata: { model: 'pool', commissionRate: '0.00' },
        })
        .returning('*')

      await trx.from('rounds').where('id', roundId).update({
        status: 'settled',
        betting_status: 'finished',
        finished_at: new Date(),
        updated_at: new Date(),
      })
      await trx
        .from('events')
        .where('id', round.event_id)
        .update({ betting_status: 'finished', updated_at: new Date() })
      await this.audit.record({
        trx,
        userId: actorUserId,
        action: 'round.settled',
        entityType: 'round',
        entityId: roundId,
        newValues: {
          resultId: roundResult.id,
          totalPool: formatMoney(totalPool),
          totalPayout: formatMoney(distributable),
        },
      })
      return roundResult
    })
    if (!result) return null
    await this.realtime.event(result.event_id, 'round.settled', {
      roundId,
      resultId: result.id,
    })
    return result
  }
}
