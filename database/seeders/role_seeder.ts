import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    const roles = [
      ['super_admin', 'Super Admin'],
      ['admin', 'Admin'],
      ['operator', 'Operador'],
      ['moderator', 'Moderador'],
      ['user', 'Usuario'],
    ]

    const permissions = [
      ['admin.access', 'Acceder al panel administrativo'],
      ['users.read', 'Consultar usuarios'],
      ['users.manage', 'Gestionar usuarios'],
      ['events.manage', 'Gestionar eventos'],
      ['rounds.operate', 'Operar rondas'],
      ['wallets.manage', 'Gestionar wallets'],
      ['audit.read', 'Consultar auditoría'],
      ['chat.moderate', 'Moderar el chat'],
      ['reports.read', 'Consultar reportes'],
    ]

    for (const [code, name] of roles) {
      await db
        .table('roles')
        .insert({ code, name, created_at: new Date() })
        .onConflict('code')
        .ignore()
    }
    for (const [code, name] of permissions) {
      await db
        .table('permissions')
        .insert({ code, name, created_at: new Date() })
        .onConflict('code')
        .ignore()
    }

    const adminRoles = await db.from('roles').whereIn('code', ['super_admin', 'admin']).select('id')
    const permissionRows = await db.from('permissions').select('id')
    for (const role of adminRoles) {
      for (const permission of permissionRows) {
        await db
          .table('role_permissions')
          .insert({
            role_id: role.id,
            permission_id: permission.id,
          })
          .onConflict(['role_id', 'permission_id'])
          .ignore()
      }
    }
  }
}
