import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('event_id').unsigned().notNullable()
      table.integer('user_id').unsigned().notNullable()
      table.text('content').notNullable()
      table.string('message_type', 20).notNullable().defaultTo('text')
      table.string('status', 20).notNullable().defaultTo('visible')
      table.timestamp('moderated_at').nullable()
      table.integer('moderated_by').unsigned().nullable()
      table.timestamp('created_at').notNullable()
      table.foreign('event_id').references('events.id').onDelete('CASCADE')
      table.foreign('user_id').references('users.id').onDelete('RESTRICT')
      table.foreign('moderated_by').references('users.id').onDelete('SET NULL')
      table.check("message_type IN ('text', 'image', 'system')")
      table.check("status IN ('visible', 'hidden', 'deleted', 'reported')")
      table.index(['event_id', 'created_at'])
      table.index(['event_id', 'status', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
