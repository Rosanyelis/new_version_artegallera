import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import Wallet from '#models/wallet'

export default class WalletTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare walletId: number

  @column()
  declare userId: number

  @column()
  declare type: string

  @column()
  declare amount: string

  @column()
  declare balanceBefore: string

  @column()
  declare balanceAfter: string

  @column()
  declare status: string

  @column()
  declare idempotencyKey: string

  @column()
  declare reference: string | null

  @column()
  declare description: string | null

  @column()
  declare metadata: Record<string, unknown> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Wallet)
  declare wallet: BelongsTo<typeof Wallet>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
