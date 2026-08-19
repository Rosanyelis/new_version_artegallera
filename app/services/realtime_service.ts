import transmit from '@adonisjs/transmit/services/main'
import logger from '@adonisjs/core/services/logger'

export default class RealtimeService {
  async event(eventId: number, type: string, data: Record<string, unknown>) {
    return this.broadcast(`events/${eventId}`, { type, ...data })
  }

  async chat(eventId: number, data: Record<string, unknown>) {
    return this.broadcast(`chat/${eventId}`, data)
  }

  private async broadcast(topic: string, payload: Record<string, unknown>) {
    try {
      await transmit.broadcast(topic, payload as never)
    } catch (error) {
      logger.warn({ err: error, topic }, 'Realtime broadcast failed')
    }
  }
}
