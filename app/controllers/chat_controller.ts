import type { HttpContext } from '@adonisjs/core/http'
import ChatService from '#services/chat_service'
import { chatMessageValidator } from '#validators/chat'

export default class ChatController {
  private chat = new ChatService()

  async index({ params, response }: HttpContext) {
    const messages = await this.chat.list(Number(params.eventId))
    if (!messages) {
      return response.notFound({
        error: { code: 'EVENT_NOT_FOUND', message: 'Evento no encontrado.' },
      })
    }
    return response.ok({ data: messages })
  }

  async store({ auth, params, request, response }: HttpContext) {
    const { content } = await request.validateUsing(chatMessageValidator)
    const message = await this.chat.send(Number(params.eventId), auth.user!.id, content)
    if (!message) {
      return response.notFound({
        error: { code: 'EVENT_NOT_FOUND', message: 'Evento no encontrado.' },
      })
    }
    return response.created({ data: message })
  }
}
