import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('wallets', (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().notNullable().unique()
      table.decimal('available_balance', 15, 2).notNullable().defaultTo(0)
      table.decimal('held_balance', 15, 2).notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.foreign('user_id').references('users.id').onDelete('RESTRICT')
      table.check('available_balance >= 0')
      table.check('held_balance >= 0')
    })

    this.schema.createTable('wallet_transactions', (table) => {
      table.increments('id').notNullable()
      table.integer('wallet_id').unsigned().notNullable()
      table.integer('user_id').unsigned().notNullable()
      table.string('type', 30).notNullable()
      table.decimal('amount', 15, 2).notNullable()
      table.decimal('balance_before', 15, 2).notNullable()
      table.decimal('balance_after', 15, 2).notNullable()
      table.string('status', 20).notNullable().defaultTo('posted')
      table.string('idempotency_key', 120).notNullable().unique()
      table.string('reference', 120).nullable()
      table.string('description', 255).nullable()
      table.jsonb('metadata').nullable()
      table.timestamp('created_at').notNullable()
      table.foreign('wallet_id').references('wallets.id').onDelete('RESTRICT')
      table.foreign('user_id').references('users.id').onDelete('RESTRICT')
      table.check('amount > 0')
      table.check('balance_before >= 0')
      table.check('balance_after >= 0')
      table.index(['user_id', 'created_at'])
      table.index(['wallet_id', 'created_at'])
      table.index(['type', 'status'])
    })

    this.schema.raw(`
      CREATE OR REPLACE FUNCTION prevent_wallet_transaction_mutation()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'wallet_transactions is immutable';
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER wallet_transactions_immutable
      BEFORE UPDATE OR DELETE ON wallet_transactions
      FOR EACH ROW EXECUTE FUNCTION prevent_wallet_transaction_mutation();
    `)
  }

  async down() {
    this.schema.raw('DROP TRIGGER IF EXISTS wallet_transactions_immutable ON wallet_transactions')
    this.schema.raw('DROP FUNCTION IF EXISTS prevent_wallet_transaction_mutation()')
    this.schema.dropTable('wallet_transactions')
    this.schema.dropTable('wallets')
  }
}
