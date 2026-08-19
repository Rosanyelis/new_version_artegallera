import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('username', 40).nullable().unique()
      table.string('status', 20).notNullable().defaultTo('active')
      table.boolean('is_betting_enabled').notNullable().defaultTo(false)
      table.timestamp('last_access_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('username')
      table.dropColumn('status')
      table.dropColumn('is_betting_enabled')
      table.dropColumn('last_access_at')
    })
  }
}
