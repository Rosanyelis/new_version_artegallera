import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Permission from '#models/permission'
import User from '#models/user'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @manyToMany(() => User, { pivotTable: 'user_roles', pivotTimestamps: true })
  declare users: ManyToMany<typeof User>

  @manyToMany(() => Permission, { pivotTable: 'role_permissions' })
  declare permissions: ManyToMany<typeof Permission>
}
