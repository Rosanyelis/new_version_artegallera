import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('events', (table) => {
      table.increments('id').notNullable()
      table.string('name', 160).notNullable()
      table.string('slug', 180).notNullable().unique()
      table.text('description').nullable()
      table.string('location', 160).nullable()
      table.timestamp('scheduled_at').nullable()
      table.string('status', 20).notNullable().defaultTo('draft')
      table.string('betting_status', 20).notNullable().defaultTo('closed')
      table.string('stream_status', 20).notNullable().defaultTo('offline')
      table.string('playback_url', 500).nullable()
      table.string('cover_image', 500).nullable()
      table.boolean('is_featured').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.index(['status', 'scheduled_at'])
      table.index(['is_featured', 'status'])
      table.check("status IN ('draft', 'scheduled', 'live', 'paused', 'finished', 'cancelled')")
      table.check("betting_status IN ('closed', 'open', 'suspended', 'finished')")
      table.check(
        "stream_status IN ('offline', 'starting', 'live', 'interrupted', 'ended', 'error')"
      )
    })

    this.schema.createTable('rounds', (table) => {
      table.increments('id').notNullable()
      table.integer('event_id').unsigned().notNullable()
      table.integer('round_number').notNullable()
      table.string('status', 20).notNullable().defaultTo('pending')
      table.string('betting_status', 20).notNullable().defaultTo('closed')
      table.timestamp('opened_at').nullable()
      table.timestamp('betting_closed_at').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('finished_at').nullable()
      table.integer('winning_side_id').unsigned().nullable()
      table.decimal('total_pool', 15, 2).notNullable().defaultTo(0)
      table.decimal('total_red', 15, 2).notNullable().defaultTo(0)
      table.decimal('total_green', 15, 2).notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.foreign('event_id').references('events.id').onDelete('CASCADE')
      table.unique(['event_id', 'round_number'])
      table.check('round_number > 0')
      table.check('total_pool >= 0')
      table.check('total_red >= 0')
      table.check('total_green >= 0')
      table.check(
        "status IN ('pending', 'betting_open', 'betting_closed', 'in_progress', 'settling', 'settled', 'cancelled')"
      )
      table.check("betting_status IN ('closed', 'open', 'suspended', 'finished')")
      table.index(['event_id', 'round_number'])
      table.index(['status', 'betting_status'])
    })

    this.schema.createTable('betting_sides', (table) => {
      table.increments('id').notNullable()
      table.integer('event_id').unsigned().notNullable()
      table.integer('round_id').unsigned().notNullable()
      table.string('code', 20).notNullable()
      table.string('name', 80).notNullable()
      table.string('color', 20).notNullable()
      table.jsonb('metadata').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.foreign('event_id').references('events.id').onDelete('CASCADE')
      table.foreign('round_id').references('rounds.id').onDelete('CASCADE')
      table.unique(['round_id', 'code'])
    })

    this.schema.alterTable('rounds', (table) => {
      table.foreign('winning_side_id').references('betting_sides.id').onDelete('RESTRICT')
    })
  }

  async down() {
    this.schema.alterTable('rounds', (table) => table.dropForeign(['winning_side_id']))
    this.schema.dropTable('betting_sides')
    this.schema.dropTable('rounds')
    this.schema.dropTable('events')
  }
}
