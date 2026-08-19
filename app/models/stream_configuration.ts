import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Event from '#models/event'

export default class StreamConfiguration extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare eventId: number
  @column() declare provider: string
  @column() declare ingestUrl: string
  @column({ serializeAs: null }) declare streamKeyEncrypted: string
  @column() declare playbackUrl: string
  @column() declare status: string
  @column.dateTime() declare startedAt: DateTime | null
  @column.dateTime() declare endedAt: DateTime | null
  @column() declare metadata: Record<string, unknown> | null
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime | null
  @belongsTo(() => Event) declare event: BelongsTo<typeof Event>
}
