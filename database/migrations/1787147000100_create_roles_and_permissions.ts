import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('roles', (table) => {
      table.increments('id').notNullable()
      table.string('code', 40).notNullable().unique()
      table.string('name', 80).notNullable()
      table.string('description', 255).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('permissions', (table) => {
      table.increments('id').notNullable()
      table.string('code', 80).notNullable().unique()
      table.string('name', 120).notNullable()
      table.string('description', 255).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('role_permissions', (table) => {
      table.integer('role_id').unsigned().notNullable()
      table.integer('permission_id').unsigned().notNullable()
      table.primary(['role_id', 'permission_id'])
      table.foreign('role_id').references('roles.id').onDelete('CASCADE')
      table.foreign('permission_id').references('permissions.id').onDelete('CASCADE')
    })

    this.schema.createTable('user_roles', (table) => {
      table.integer('user_id').unsigned().notNullable()
      table.integer('role_id').unsigned().notNullable()
      table.timestamp('created_at').notNullable()
      table.primary(['user_id', 'role_id'])
      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.foreign('role_id').references('roles.id').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable('user_roles')
    this.schema.dropTable('role_permissions')
    this.schema.dropTable('permissions')
    this.schema.dropTable('roles')
  }
}
