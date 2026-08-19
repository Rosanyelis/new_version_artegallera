import type { HttpContext } from '@adonisjs/core/http'
import AdminService from '#services/admin_service'
import WalletService from '#services/wallet_service'
import {
  adminWalletAdjustValidator,
  bettingToggleValidator,
  roleAssignmentValidator,
  userStatusValidator,
} from '#validators/admin'
import { randomUUID } from 'node:crypto'

export default class AdminUserController {
  private admin = new AdminService()

  async index({ request, view }: HttpContext) {
    const filters = request.qs()
    const data = await this.admin.listUsers({
      search: filters.search,
      status: filters.status,
      roleCode: filters.roleCode,
      betting: filters.betting,
      page: filters.page,
    })
    const roles = await this.admin.listRoles()
    return view.render('pages/admin/users/index', {
      users: data.rows,
      total: data.total,
      page: data.page,
      perPage: data.perPage,
      filters,
      roles,
    })
  }

  async show({ params, view, response }: HttpContext) {
    const user = await this.admin.getUserDetail(Number(params.id))
    if (!user) return response.notFound()
    return view.render('pages/admin/users/show', { user })
  }

  async changeStatus({ params, auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(userStatusValidator)
    const user = await this.admin.findUser(Number(params.id))
    if (!user) return response.notFound()

    if (!payload.confirmed || payload.confirmation !== user.email) {
      session.flash('error', 'Debes confirmar escribiendo el correo exacto del usuario.')
      return response.redirect().back()
    }

    const statusMap = { suspend: 'suspended', activate: 'active', block: 'blocked' } as const
    await this.admin.changeUserStatus(user.id, statusMap[payload.action], auth.user!.id)
    session.flash(
      'success',
      `Usuario ${payload.action === 'activate' ? 'activado' : payload.action === 'suspend' ? 'suspendido' : 'bloqueado'}.`
    )
    return response.redirect().back()
  }

  async toggleBetting({ params, auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(bettingToggleValidator)
    if (!payload.confirmed) {
      session.flash('error', 'Debes confirmar la acción.')
      return response.redirect().back()
    }
    const user = await this.admin.toggleBetting(Number(params.id), auth.user!.id)
    if (!user) return response.notFound()
    session.flash(
      'success',
      user.is_betting_enabled ? 'Apuestas habilitadas.' : 'Apuestas deshabilitadas.'
    )
    return response.redirect().back()
  }

  async assignRole({ params, auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(roleAssignmentValidator)
    if (!payload.confirmed) {
      session.flash('error', 'Debes confirmar el cambio de rol.')
      return response.redirect().back()
    }
    if (Number(params.id) === auth.user!.id) {
      session.flash('error', 'No puedes modificar tu propio rol.')
      return response.redirect().back()
    }
    const roles = await this.admin.assignRole(Number(params.id), payload.roleCode, auth.user!.id)
    if (!roles) return response.notFound()
    session.flash('success', 'Rol actualizado.')
    return response.redirect().back()
  }

  async adjustWallet({ auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(adminWalletAdjustValidator)
    const user = await this.admin.findUser(payload.userId)
    if (!user) return response.notFound()

    if (!payload.confirmed || payload.confirmation !== user.email) {
      session.flash('error', 'Debes confirmar escribiendo el correo exacto del usuario.')
      return response.redirect().back()
    }

    await new WalletService().adjust(payload.userId, payload.amount, payload.direction, {
      idempotencyKey: `admin-adj-${randomUUID()}`,
      description: payload.description,
      actorUserId: auth.user!.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
    })
    session.flash('success', 'Ajuste de wallet aplicado y auditado.')
    return response.redirect().back()
  }
}
