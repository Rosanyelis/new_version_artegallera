import type { HttpContext } from '@adonisjs/core/http'
import WalletService from '#services/wallet_service'
import { walletAdjustmentValidator } from '#validators/wallet'

export default class WalletController {
  private walletService = new WalletService()

  async balance({ auth, response }: HttpContext) {
    return response.ok({ data: await this.walletService.getBalance(auth.user!.id) })
  }

  async transactions({ auth, request, response }: HttpContext) {
    const limit = Number(request.input('limit', 50))
    const cursor = request.input('cursor') ? Number(request.input('cursor')) : undefined
    const transactions = await this.walletService.getTransactions(auth.user!.id, limit, cursor)
    return response.ok({ data: transactions })
  }

  async adjust({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(walletAdjustmentValidator)
    const transaction = await this.walletService.adjust(
      payload.userId,
      payload.amount,
      payload.direction,
      {
        idempotencyKey: payload.idempotencyKey,
        description: payload.description,
        actorUserId: auth.user!.id,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
      }
    )

    return response.ok({ data: transaction })
  }
}
