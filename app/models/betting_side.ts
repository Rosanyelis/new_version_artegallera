import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Event from '#models/event'
import Round from '#models/round'

export default class BettingSide extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare eventId: number

  @column()
  declare roundId: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare color: string

  @column()
  declare metadata: Record<string, unknown> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => Round)
  declare round: BelongsTo<typeof Round>
}
