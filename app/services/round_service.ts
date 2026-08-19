import db from '@adonisjs/lucid/services/db'
import AuditService from '#services/audit_service'
import InvalidStateTransitionError from '#exceptions/state_transition'

export type RoundStatus =
  | 'pending'
  | 'betting_open'
  | 'betting_closed'
  | 'in_progress'
  | 'settling'
  | 'settled'
  | 'cancelled'

export default class RoundService {
  private audit = new AuditService()

  async create(eventId: number, roundNumber: number, actorUserId: number) {
    return db.transaction(async (trx) => {
      const event = await trx.from('events').where('id', eventId).first()
      if (!event) return null
      const [round] = await trx
        .table('rounds')
        .insert({
          event_id: eventId,
          round_number: roundNumber,
          status: 'pending',
          betting_status: 'closed',
          total_pool: '0.00',
          total_red: '0.00',
          total_green: '0.00',
          created_at: new Date(),
        })
        .returning('*')
      await trx.table('betting_sides').insert([
        {
          event_id: eventId,
          round_id: round.id,
          code: 'RED',
          name: 'Rojo',
          color: 'red',
          created_at: new Date(),
        },
        {
          event_id: eventId,
          round_id: round.id,
          code: 'GREEN',
          name: 'Verde',
          color: 'green',
          created_at: new Date(),
        },
      ])
      await this.audit.record({
        trx,
        userId: actorUserId,
        action: 'round.created',
        entityType: 'round',
        entityId: round.id,
        newValues: { eventId, roundNumber },
      })
      return trx.from('rounds').where('id', round.id).first()
    })
  }

  async list(eventId: number) {
    const rounds = await db.from('rounds').where('event_id', eventId).orderBy('round_number', 'asc')
    for (const round of rounds) {
      round.bettingSides = await db
        .from('betting_sides')
        .where('round_id', round.id)
        .orderBy('id', 'asc')
    }
    return rounds
  }

  async transition(id: number, to: RoundStatus, actorUserId: number, winningSideId?: number) {
    return db.transaction(async (trx) => {
      const round = await trx.from('rounds').where('id', id).forUpdate().first()
      if (!round) return null
      if (!this.canTransition(round.status, to)) {
        throw new InvalidStateTransitionError('ronda', round.status, to)
      }

      const now = new Date()
      const values: Record<string, unknown> = { status: to, updated_at: now }
      if (to === 'betting_open') {
        values.betting_status = 'open'
        values.opened_at = now
        await trx
          .from('events')
          .where('id', round.event_id)
          .update({ betting_status: 'open', updated_at: now })
      }
      if (to === 'betting_closed') {
        values.betting_status = 'closed'
        values.betting_closed_at = now
        await trx
          .from('events')
          .where('id', round.event_id)
          .update({ betting_status: 'closed', updated_at: now })
      }
      if (to === 'settled' || to === 'cancelled') {
        values.betting_status = 'finished'
        values.finished_at = now
      }
      if (winningSideId) {
        const side = await trx
          .from('betting_sides')
          .where({ id: winningSideId, round_id: id })
          .first()
        if (!side)
          throw new InvalidStateTransitionError('ronda', round.status, 'resultado inválido')
        values.winning_side_id = winningSideId
      }
      await trx.from('rounds').where('id', id).update(values)
      await this.audit.record({
        trx,
        userId: actorUserId,
        action: 'round.state_changed',
        entityType: 'round',
        entityId: id,
        oldValues: { status: round.status },
        newValues: { status: to, winningSideId: winningSideId || null },
      })
      return trx.from('rounds').where('id', id).first()
    })
  }

  canTransition(from: RoundStatus, to: RoundStatus) {
    const transitions: Record<RoundStatus, RoundStatus[]> = {
      pending: ['betting_open', 'cancelled'],
      betting_open: ['betting_closed', 'cancelled'],
      betting_closed: ['in_progress', 'cancelled'],
      in_progress: ['settling', 'cancelled'],
      settling: ['settled'],
      settled: [],
      cancelled: [],
    }
    return transitions[from]?.includes(to) || false
  }
}
