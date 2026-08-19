import type { HttpContext } from '@adonisjs/core/http'
import AdminService from '#services/admin_service'

type CsvRow = Record<string, unknown>

function csvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv(rows: CsvRow[], columns: { key: string; label: string }[]): string {
  const header = columns.map((column) => csvValue(column.label)).join(',')
  const lines = rows.map((row) => columns.map((column) => csvValue(row[column.key])).join(','))
  return [header, ...lines].join('\n')
}

function money(value: unknown) {
  return value === null || value === undefined ? '0.00' : String(value)
}

export default class AdminReportController {
  private admin = new AdminService()

  private parseRange(request: HttpContext['request']) {
    return {
      from: request.input('from'),
      to: request.input('to'),
    }
  }

  private qs(request: HttpContext['request']) {
    return new URLSearchParams(request.qs()).toString()
  }

  async events({ request, view }: HttpContext) {
    const filters = { ...request.qs(), ...this.parseRange(request) }
    const rows = await this.admin.listEventsReport(filters)
    return view.render('pages/admin/reports/events', { rows, filters, qs: this.qs(request) })
  }

  async bets({ request, view }: HttpContext) {
    const filters = { ...request.qs(), ...this.parseRange(request) }
    const { rows, totals } = await this.admin.listBetsReport(filters)
    return view.render('pages/admin/reports/bets', { rows, totals, filters, qs: this.qs(request) })
  }

  async financial({ request, view }: HttpContext) {
    const filters = this.parseRange(request)
    const report = await this.admin.listFinancialReport(filters)
    return view.render('pages/admin/reports/financial', { report, filters, qs: this.qs(request) })
  }

  async users({ request, view }: HttpContext) {
    const filters = { ...request.qs(), ...this.parseRange(request) }
    const rows = await this.admin.listUsersReport(filters)
    return view.render('pages/admin/reports/users', { rows, filters, qs: this.qs(request) })
  }

  async eventsCsv({ request, response }: HttpContext) {
    const filters = { ...request.qs(), ...this.parseRange(request) }
    const rows = await this.admin.listEventsReport(filters)
    const columns = [
      { key: 'id', label: 'id' },
      { key: 'name', label: 'nombre' },
      { key: 'slug', label: 'slug' },
      { key: 'status', label: 'estado' },
      { key: 'scheduled_at', label: 'programado' },
      { key: 'rounds_count', label: 'rondas' },
      { key: 'bets_count', label: 'apuestas' },
      { key: 'bets_volume', label: 'volumen' },
      { key: 'pool_total', label: 'pool' },
      { key: 'payout_total', label: 'premios' },
      { key: 'commission_total', label: 'comision' },
    ]
    return this.sendCsv(response, 'eventos.csv', toCsv(rows, columns))
  }

  async betsCsv({ request, response }: HttpContext) {
    const filters = { ...request.qs(), ...this.parseRange(request) }
    const { rows } = await this.admin.listBetsReport(filters)
    const columns = [
      { key: 'id', label: 'id' },
      { key: 'event_name', label: 'evento' },
      { key: 'round_number', label: 'ronda' },
      { key: 'side_name', label: 'lado' },
      { key: 'email', label: 'email' },
      { key: 'full_name', label: 'nombre' },
      { key: 'amount', label: 'monto' },
      { key: 'payout_amount', label: 'premio' },
      { key: 'status', label: 'estado' },
      { key: 'placed_at', label: 'colocada' },
    ]
    return this.sendCsv(response, 'apuestas.csv', toCsv(rows, columns))
  }

  async financialCsv({ request, response }: HttpContext) {
    const filters = this.parseRange(request)
    const { byType, totals, results } = await this.admin.listFinancialReport(filters)
    const rows: CsvRow[] = [
      { tipo: 'movimientos (total)', valor: totals.total, detalle: `bruto ${totals.gross}` },
      { tipo: 'acreditado', valor: totals.credited, detalle: 'suma de variaciones positivas' },
      { tipo: 'debitado', valor: totals.debited, detalle: 'suma de variaciones negativas' },
      { tipo: 'pool liquidado', valor: results.pool, detalle: `${results.rounds} rondas` },
      { tipo: 'premios pagados', valor: results.payout, detalle: `${results.winners} ganadores` },
      { tipo: 'comision de la casa', valor: results.commission, detalle: '' },
      ...byType.map((row: CsvRow) => ({
        tipo: `por tipo: ${row.type}`,
        valor: row.credited,
        detalle: `${row.tx_count} tx (bruto ${row.gross})`,
      })),
    ]
    return this.sendCsv(
      response,
      'financiero.csv',
      toCsv(rows, [
        { key: 'tipo', label: 'concepto' },
        { key: 'valor', label: 'valor' },
        { key: 'detalle', label: 'detalle' },
      ])
    )
  }

  async usersCsv({ request, response }: HttpContext) {
    const filters = { ...request.qs(), ...this.parseRange(request) }
    const rows = await this.admin.listUsersReport(filters)
    const columns = [
      { key: 'id', label: 'id' },
      { key: 'email', label: 'email' },
      { key: 'full_name', label: 'nombre' },
      { key: 'status', label: 'estado' },
      { key: 'roles', label: 'roles' },
      { key: 'bets_count', label: 'apuestas' },
      { key: 'wagered', label: 'apostado' },
      { key: 'winnings', label: 'ganancias' },
      { key: 'available_balance', label: 'saldo' },
      { key: 'created_at', label: 'registro' },
    ]
    return this.sendCsv(response, 'usuarios.csv', toCsv(rows, columns))
  }

  private sendCsv(response: HttpContext['response'], filename: string, content: string) {
    response
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(content)
  }
}

export { money }
