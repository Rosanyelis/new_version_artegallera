import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import Event from '#models/event'
import Round from '#models/round'
import BettingSide from '#models/betting_side'
import WalletTransaction from '#models/wallet_transaction'

export default class Bet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare eventId: number

  @column()
  declare roundId: number

  @column()
  declare bettingSideId: number

  @column()
  declare amount: string

  @column()
  declare status: string

  @column.dateTime()
  declare placedAt: DateTime

  @column.dateTime()
  declare settledAt: DateTime | null

  @column()
  declare payoutAmount: string

  @column()
  declare transactionId: number | null

  @column()
  declare idempotencyKey: string

  @column()
  declare reference: string | null

  @column()
  declare metadata: Record<string, unknown> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => Round)
  declare round: BelongsTo<typeof Round>

  @belongsTo(() => BettingSide)
  declare bettingSide: BelongsTo<typeof BettingSide>

  @belongsTo(() => WalletTransaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof WalletTransaction>
}
