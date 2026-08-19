import db from '@adonisjs/lucid/services/db'

export default class AuthorizationService {
  async userHasPermission(userId: number, permission: string) {
    const row = await db
      .from('user_roles')
      .join('roles', 'roles.id', 'user_roles.role_id')
      .join('role_permissions', 'role_permissions.role_id', 'roles.id')
      .join('permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('user_roles.user_id', userId)
      .where('permissions.code', permission)
      .first()

    return Boolean(row)
  }

  async userHasRole(userId: number, role: string) {
    const row = await db
      .from('user_roles')
      .join('roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .where('roles.code', role)
      .first()

    return Boolean(row)
  }
}
