import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Event from '#models/event'
import BettingSide from '#models/betting_side'

export default class Round extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare eventId: number

  @column()
  declare roundNumber: number

  @column()
  declare status: string

  @column()
  declare bettingStatus: string

  @column.dateTime()
  declare openedAt: DateTime | null

  @column.dateTime()
  declare bettingClosedAt: DateTime | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare finishedAt: DateTime | null

  @column()
  declare winningSideId: number | null

  @column()
  declare totalPool: string

  @column()
  declare totalRed: string

  @column()
  declare totalGreen: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasMany(() => BettingSide)
  declare bettingSides: HasMany<typeof BettingSide>
}
