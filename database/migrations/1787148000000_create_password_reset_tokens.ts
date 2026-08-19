import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'password_reset_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().notNullable()
      table.string('token_hash', 64).notNullable().unique()
      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()
      table.timestamp('created_at').notNullable()
      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.index(['user_id', 'expires_at'])
      table.index(['token_hash', 'used_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
