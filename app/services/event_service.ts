import db from '@adonisjs/lucid/services/db'
import AuditService from '#services/audit_service'
import InvalidStateTransitionError from '#exceptions/state_transition'

export type EventStatus = 'draft' | 'scheduled' | 'live' | 'paused' | 'finished' | 'cancelled'

type EventInput = {
  name: string
  slug?: string
  description?: string | null
  location?: string | null
  scheduledAt?: string | null
  coverImage?: string | null
  isFeatured?: boolean
}

export default class EventService {
  private audit = new AuditService()

  async create(input: EventInput, actorUserId: number) {
    const slug = this.slugify(input.slug || input.name)
    const [event] = await db
      .table('events')
      .insert({
        name: input.name,
        slug,
        description: input.description || null,
        location: input.location || null,
        scheduled_at: input.scheduledAt || null,
        cover_image: input.coverImage || null,
        is_featured: input.isFeatured || false,
        status: 'draft',
        betting_status: 'closed',
        stream_status: 'offline',
        created_at: new Date(),
      })
      .returning('*')

    await this.audit.record({
      userId: actorUserId,
      action: 'event.created',
      entityType: 'event',
      entityId: event.id,
      newValues: event,
    })
    return event
  }

  async listPublic() {
    return db
      .from('events')
      .whereIn('status', ['scheduled', 'live', 'paused'])
      .orderBy('scheduled_at', 'asc')
  }

  async findPublic(slug: string) {
    const event = await db
      .from('events')
      .where('slug', slug)
      .whereNot('status', 'cancelled')
      .first()
    if (!event) return null
    event.rounds = await db
      .from('rounds')
      .where('event_id', event.id)
      .orderBy('round_number', 'asc')
    for (const round of event.rounds) {
      round.bettingSides = await db
        .from('betting_sides')
        .where('round_id', round.id)
        .orderBy('id', 'asc')
    }
    return event
  }

  async listAdmin() {
    return db.from('events').orderBy('scheduled_at', 'desc').orderBy('id', 'desc')
  }

  async transition(id: number, to: EventStatus, actorUserId: number) {
    return db.transaction(async (trx) => {
      const event = await trx.from('events').where('id', id).forUpdate().first()
      if (!event) return null
      if (!this.canTransition(event.status, to)) {
        throw new InvalidStateTransitionError('evento', event.status, to)
      }

      const values: Record<string, unknown> = { status: to, updated_at: new Date() }
      if (to === 'finished' || to === 'cancelled') values.betting_status = 'finished'
      await trx.from('events').where('id', id).update(values)
      await this.audit.record({
        trx,
        userId: actorUserId,
        action: 'event.state_changed',
        entityType: 'event',
        entityId: id,
        oldValues: { status: event.status },
        newValues: { status: to },
      })
      return trx.from('events').where('id', id).first()
    })
  }

  canTransition(from: EventStatus, to: EventStatus) {
    const transitions: Record<EventStatus, EventStatus[]> = {
      draft: ['scheduled', 'cancelled'],
      scheduled: ['live', 'cancelled'],
      live: ['paused', 'finished'],
      paused: ['live', 'finished'],
      finished: [],
      cancelled: [],
    }
    return transitions[from]?.includes(to) || false
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
