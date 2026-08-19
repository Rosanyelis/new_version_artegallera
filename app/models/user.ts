import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Role from '#models/role'

/**
 * User model represents a user in the application.
 * It extends UserSchema and includes authentication capabilities
 * through the withAuthFinder mixin.
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @column()
  declare username: string | null

  @column()
  declare status: 'active' | 'suspended' | 'blocked' | 'inactive'

  @column()
  declare isBettingEnabled: boolean

  @column.dateTime()
  declare lastAccessAt: DateTime | null

  @manyToMany(() => Role, { pivotTable: 'user_roles', pivotTimestamps: true })
  declare roles: ManyToMany<typeof Role>

  get isActive() {
    return this.status === 'active'
  }

  /**
   * Get the user's initials from their full name or email.
   * Returns the first letter of first and last name if available,
   * otherwise returns the first two characters of the email username.
   */
  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
