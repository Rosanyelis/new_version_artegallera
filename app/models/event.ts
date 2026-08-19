import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Round from '#models/round'

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare location: string | null

  @column.dateTime()
  declare scheduledAt: DateTime | null

  @column()
  declare status: string

  @column()
  declare bettingStatus: string

  @column()
  declare streamStatus: string

  @column()
  declare playbackUrl: string | null

  @column()
  declare coverImage: string | null

  @column()
  declare isFeatured: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Round)
  declare rounds: HasMany<typeof Round>
}
