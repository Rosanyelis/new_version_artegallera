import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD
    if (!email || !password) return

    const user = await User.updateOrCreate(
      { email },
      { fullName: 'Administrador', password, status: 'active', isBettingEnabled: false }
    )
    const role = await db.from('roles').where('code', 'super_admin').first()
    if (role) await user.related('roles').sync([role.id])
  }
}
