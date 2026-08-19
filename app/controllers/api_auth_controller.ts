import User from '#models/user'
import Role from '#models/role'
import {
  apiLoginValidator,
  apiSignupValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '#validators/api_auth'
import EmailService from '#services/email_service'
import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@adonisjs/auth'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import logger from '@adonisjs/core/services/logger'
import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import { appUrl } from '#config/app'

export default class ApiAuthController {
  async register({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(apiSignupValidator)
    const user = await User.create({ ...payload, status: 'active', isBettingEnabled: false })
    const defaultRole = await Role.findBy('code', 'user')

    if (defaultRole) {
      await user.related('roles').attach([defaultRole.id])
    }

    await auth.use('web').login(user)
    return response.created({ data: this.serializeUser(user) })
  }

  async login({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(apiLoginValidator)
    let user: User

    try {
      user = await User.verifyCredentials(email, password)
    } catch (error) {
      if (error instanceof errors.E_INVALID_CREDENTIALS) {
        return response.unauthorized({
          error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas.' },
        })
      }
      throw error
    }

    if (user.status !== 'active') {
      return response.forbidden({
        error: { code: 'ACCOUNT_INACTIVE', message: 'La cuenta no está habilitada.' },
      })
    }

    user.lastAccessAt = DateTime.now()
    await user.save()
    await auth.use('web').login(user)
    return response.ok({ data: this.serializeUser(user) })
  }

  async me({ auth, response }: HttpContext) {
    return response.ok({ data: this.serializeUser(auth.user!) })
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.ok({ data: null })
  }

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const genericResponse = {
      data: {
        message:
          'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.',
      },
    }
    const user = await User.findBy('email', email.toLowerCase())

    if (!user || user.status !== 'active') {
      return response.accepted(genericResponse)
    }

    const rawToken = randomBytes(32).toString('base64url')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const now = DateTime.now()

    await db.transaction(async (trx) => {
      await trx
        .from('password_reset_tokens')
        .where('user_id', user.id)
        .whereNull('used_at')
        .update({ used_at: now.toSQL() })
      await trx.table('password_reset_tokens').insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: now.plus({ minutes: 60 }).toSQL(),
        created_at: now.toSQL(),
      })
    })

    const resetUrl = `${appUrl}/restablecer-contrasena?token=${encodeURIComponent(rawToken)}`
    try {
      await new EmailService().sendPasswordResetEmail(user.email, user.fullName, resetUrl)
    } catch (error) {
      await db
        .from('password_reset_tokens')
        .where('token_hash', tokenHash)
        .update({ used_at: DateTime.now().toSQL() })
      logger.error({ err: error }, 'Unable to send password reset email')
    }

    return response.accepted(genericResponse)
  }

  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const now = DateTime.now()
    const resetToken = await db
      .from('password_reset_tokens')
      .where('token_hash', tokenHash)
      .whereNull('used_at')
      .where('expires_at', '>', now.toSQL())
      .first()

    if (!resetToken) {
      return response.unprocessableEntity({
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'El enlace de recuperación no es válido o expiró.',
        },
      })
    }

    const user = await User.find(resetToken.user_id)
    if (!user || user.status !== 'active') {
      return response.unprocessableEntity({
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'El enlace de recuperación no es válido o expiró.',
        },
      })
    }

    await db.transaction(async (trx) => {
      const claimedResult = await trx
        .from('password_reset_tokens')
        .where('id', resetToken.id)
        .whereNull('used_at')
        .where('expires_at', '>', now.toSQL())
        .update({ used_at: now.toSQL() })
      const claimed = Array.isArray(claimedResult) ? claimedResult.length : claimedResult

      if (claimed !== 1) {
        throw new Error('Password reset token was already used')
      }

      const passwordHash = await hash.make(password)
      await trx.from('users').where('id', user.id).update({ password: passwordHash })
    })

    return response.ok({ data: { message: 'Tu contraseña fue actualizada correctamente.' } })
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      status: user.status,
      isBettingEnabled: user.isBettingEnabled,
    }
  }
}
