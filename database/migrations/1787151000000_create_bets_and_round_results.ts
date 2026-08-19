import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('bets', (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().notNullable()
      table.integer('event_id').unsigned().notNullable()
      table.integer('round_id').unsigned().notNullable()
      table.integer('betting_side_id').unsigned().notNullable()
      table.decimal('amount', 15, 2).notNullable()
      table.string('status', 20).notNullable().defaultTo('accepted')
      table.timestamp('placed_at').notNullable()
      table.timestamp('settled_at').nullable()
      table.decimal('payout_amount', 15, 2).notNullable().defaultTo(0)
      table.integer('transaction_id').unsigned().nullable()
      table.string('idempotency_key', 120).notNullable().unique()
      table.string('reference', 120).nullable()
      table.jsonb('metadata').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.foreign('user_id').references('users.id').onDelete('RESTRICT')
      table.foreign('event_id').references('events.id').onDelete('RESTRICT')
      table.foreign('round_id').references('rounds.id').onDelete('RESTRICT')
      table.foreign('betting_side_id').references('betting_sides.id').onDelete('RESTRICT')
      table.foreign('transaction_id').references('wallet_transactions.id').onDelete('RESTRICT')
      table.check('amount > 0')
      table.check('payout_amount >= 0')
      table.check(
        "status IN ('pending', 'accepted', 'cancelled', 'won', 'lost', 'refunded', 'rejected')"
      )
      table.index(['user_id', 'created_at'])
      table.index(['event_id', 'round_id'])
      table.index(['round_id', 'betting_side_id'])
      table.index(['round_id', 'status'])
    })

    this.schema.createTable('round_results', (table) => {
      table.increments('id').notNullable()
      table.integer('event_id').unsigned().notNullable()
      table.integer('round_id').unsigned().notNullable().unique()
      table.integer('winning_side_id').unsigned().notNullable()
      table.decimal('red_total', 15, 2).notNullable().defaultTo(0)
      table.decimal('green_total', 15, 2).notNullable().defaultTo(0)
      table.decimal('total_pool', 15, 2).notNullable().defaultTo(0)
      table.integer('total_winners').notNullable().defaultTo(0)
      table.decimal('total_payout', 15, 2).notNullable().defaultTo(0)
      table.decimal('house_commission', 15, 2).notNullable().defaultTo(0)
      table.timestamp('settled_at').notNullable()
      table.jsonb('metadata').nullable()
      table.foreign('event_id').references('events.id').onDelete('RESTRICT')
      table.foreign('round_id').references('rounds.id').onDelete('RESTRICT')
      table.foreign('winning_side_id').references('betting_sides.id').onDelete('RESTRICT')
      table.check('red_total >= 0')
      table.check('green_total >= 0')
      table.check('total_pool >= 0')
      table.check('total_winners >= 0')
      table.check('total_payout >= 0')
      table.check('house_commission >= 0')
    })
  }

  async down() {
    this.schema.dropTable('round_results')
    this.schema.dropTable('bets')
  }
}
