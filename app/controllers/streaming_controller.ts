import type { HttpContext } from '@adonisjs/core/http'
import StreamingService from '#services/streaming_service'

export default class StreamingController {
  private streaming = new StreamingService()

  async create({ auth, params, response }: HttpContext) {
    const config = await this.streaming.create(Number(params.eventId), auth.user!.id)
    if (!config)
      return response.notFound({
        error: { code: 'EVENT_NOT_FOUND', message: 'Evento no encontrado.' },
      })
    return response.ok({ data: config })
  }

  async config({ params, response }: HttpContext) {
    const config = await this.streaming.getAdminConfig(Number(params.eventId))
    if (!config)
      return response.notFound({
        error: { code: 'STREAM_NOT_FOUND', message: 'Stream no configurado.' },
      })
    return response.ok({ data: config })
  }
}
