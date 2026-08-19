import db from '@adonisjs/lucid/services/db'
import AuditService from '#services/audit_service'
import RealtimeService from '#services/realtime_service'

export default class ChatService {
  private audit = new AuditService()
  private realtime = new RealtimeService()

  async list(eventId: number) {
    const event = await db.from('events').where('id', eventId).first()
    if (!event) return null
    return db
      .from('messages')
      .join('users', 'users.id', 'messages.user_id')
      .where('messages.event_id', eventId)
      .where('messages.status', 'visible')
      .select(
        'messages.id',
        'messages.event_id',
        'messages.user_id',
        'messages.content',
        'messages.message_type',
        'messages.created_at',
        'users.full_name',
        'users.email'
      )
      .orderBy('messages.id', 'desc')
      .limit(100)
  }

  async send(eventId: number, userId: number, content: string) {
    const event = await db.from('events').where('id', eventId).first()
    if (!event) return null
    const [message] = await db
      .table('messages')
      .insert({
        event_id: eventId,
        user_id: userId,
        content: content.trim(),
        message_type: 'text',
        status: 'visible',
        created_at: new Date(),
      })
      .returning('*')
    const user = await db.from('users').where('id', userId).first()
    const payload = {
      id: message.id,
      eventId,
      userId,
      name: user?.full_name || user?.email || 'Usuario',
      content: message.content,
      createdAt: message.created_at,
    }
    await this.audit.record({
      userId,
      action: 'chat.message_created',
      entityType: 'message',
      entityId: message.id,
      newValues: payload,
    })
    await this.realtime.chat(eventId, payload)
    return payload
  }
}
