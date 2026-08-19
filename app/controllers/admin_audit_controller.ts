import type { HttpContext } from '@adonisjs/core/http'
import AdminService from '#services/admin_service'

export default class AdminAuditController {
  private admin = new AdminService()

  async index({ request, view }: HttpContext) {
    const filters = request.qs()
    const entries = await this.admin.listAudit({
      action: filters.action,
      entityType: filters.entityType,
      entityId: filters.entityId,
      search: filters.search,
      from: filters.from,
      to: filters.to,
    })
    return view.render('pages/admin/audit/index', { entries, filters })
  }
}
