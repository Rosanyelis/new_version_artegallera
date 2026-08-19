import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { Resend } from 'resend'

export default class EmailService {
  async sendPasswordResetEmail(to: string, name: string | null, resetUrl: string) {
    if (app.inTest) {
      return { id: 'test-email' }
    }

    const apiKey = env.get('RESEND_API_KEY')
    if (!apiKey?.release()) {
      throw new Error('Resend API key is not configured')
    }

    const resend = new Resend(apiKey.release())
    const { data, error } = await resend.emails.send({
      from: `${env.get('RESEND_FROM_NAME')} <${env.get('RESEND_FROM_EMAIL')}>`,
      to: [to],
      subject: 'Restablece tu contraseña de Arte Gallera',
      html: this.passwordResetTemplate(name, resetUrl),
      text: `Restablece tu contraseña usando este enlace: ${resetUrl}`,
    })

    if (error) {
      throw new Error(`Resend rejected password reset email: ${error.name}`)
    }

    return data
  }

  private passwordResetTemplate(name: string | null, resetUrl: string) {
    const greeting = name ? `Hola ${this.escapeHtml(name)},` : 'Hola,'

    return `
      <div style="font-family: Arial, sans-serif; color: #20251f; line-height: 1.6;">
        <h2>Restablece tu contraseña</h2>
        <p>${greeting}</p>
        <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
        <p><a href="${resetUrl}" style="color: #8b641f;">Crear una nueva contraseña</a></p>
        <p>Este enlace vence en 60 minutos y solo puede utilizarse una vez.</p>
        <p>Si no realizaste esta solicitud, puedes ignorar este correo.</p>
      </div>
    `
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      }
      return entities[character]
    })
  }
}
