import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().nullable()
      table.string('action', 80).notNullable()
      table.string('entity_type', 80).notNullable()
      table.string('entity_id', 80).notNullable()
      table.jsonb('old_values').nullable()
      table.jsonb('new_values').nullable()
      table.string('ip_address', 64).nullable()
      table.text('user_agent').nullable()
      table.timestamp('created_at').notNullable()
      table.foreign('user_id').references('users.id').onDelete('SET NULL')
      table.index(['entity_type', 'entity_id'])
      table.index(['user_id', 'created_at'])
      table.index(['action', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
