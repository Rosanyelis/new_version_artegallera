import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stream_configurations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('event_id').unsigned().notNullable().unique()
      table.string('provider', 40).notNullable()
      table.string('ingest_url', 500).notNullable()
      table.text('stream_key_encrypted').notNullable()
      table.string('playback_url', 500).notNullable()
      table.string('status', 20).notNullable().defaultTo('offline')
      table.timestamp('started_at').nullable()
      table.timestamp('ended_at').nullable()
      table.jsonb('metadata').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.foreign('event_id').references('events.id').onDelete('CASCADE')
      table.check("status IN ('offline', 'starting', 'live', 'interrupted', 'ended', 'error')")
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
