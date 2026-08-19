import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Event from '#models/event'
import Round from '#models/round'
import BettingSide from '#models/betting_side'

export default class RoundResult extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare eventId: number

  @column()
  declare roundId: number

  @column()
  declare winningSideId: number

  @column()
  declare redTotal: string

  @column()
  declare greenTotal: string

  @column()
  declare totalPool: string

  @column()
  declare totalWinners: number

  @column()
  declare totalPayout: string

  @column()
  declare houseCommission: string

  @column.dateTime()
  declare settledAt: DateTime

  @column()
  declare metadata: Record<string, unknown> | null

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => Round)
  declare round: BelongsTo<typeof Round>

  @belongsTo(() => BettingSide)
  declare winningSide: BelongsTo<typeof BettingSide>
}
