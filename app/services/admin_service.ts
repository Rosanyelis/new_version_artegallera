import db from '@adonisjs/lucid/services/db'

export type DateRange = { from?: string; to?: string }

function buildDateRange(query: any, column: string, range: DateRange) {
  if (range.from) query.andWhere(column, '>=', range.from)
  if (range.to) query.andWhere(column, '<=', range.to)
}

export default class AdminService {
  private async count(
    table: string,
    where: { column: string; value: string | number | boolean }[] = []
  ) {
    const query = db.from(table)
    for (const condition of where) query.where(condition.column, condition.value)
    const row = await query.count('* as total').first()
    return Number(row?.total || 0)
  }

  private async sum(
    table: string,
    column: string,
    where: { column: string; value: string | number | boolean }[] = []
  ) {
    const query = db.from(table)
    for (const condition of where) query.where(condition.column, condition.value)
    const row = await query.sum(`${column} as total`).first()
    return Number(row?.total || 0)
  }

  async dashboardMetrics() {
    const today = new Date().toISOString().slice(0, 10)
    const [
      users,
      usersActive,
      usersSuspended,
      events,
      eventsLive,
      eventsScheduled,
      rounds,
      bets,
      volumeTotal,
      poolTotal,
      payoutTotal,
      commissionTotal,
      walletBalance,
    ] = await Promise.all([
      this.count('users'),
      this.count('users', [{ column: 'status', value: 'active' }]),
      this.count('users', [{ column: 'status', value: 'suspended' }]),
      this.count('events'),
      this.count('events', [{ column: 'status', value: 'live' }]),
      this.count('events', [{ column: 'status', value: 'scheduled' }]),
      this.count('rounds'),
      this.count('bets'),
      this.sum('bets', 'amount'),
      this.sum('round_results', 'total_pool'),
      this.sum('round_results', 'total_payout'),
      this.sum('round_results', 'house_commission'),
      this.sum('wallets', 'available_balance'),
    ])

    const [betsToday, volumeToday, walletHeld, recentBets, recentAudit, liveStreams] =
      await Promise.all([
        db.from('bets').where('placed_at', '>=', today).count('* as total').first(),
        db.from('bets').where('placed_at', '>=', today).sum('amount as total').first(),
        this.sum('wallets', 'held_balance'),
        db
          .from('bets')
          .join('users', 'users.id', 'bets.user_id')
          .join('events', 'events.id', 'bets.event_id')
          .join('betting_sides', 'betting_sides.id', 'bets.betting_side_id')
          .select(
            'bets.id',
            'bets.amount',
            'bets.status',
            'bets.placed_at',
            'users.email',
            'users.full_name',
            'events.name as event_name',
            'events.slug',
            'betting_sides.name as side_name'
          )
          .orderBy('bets.id', 'desc')
          .limit(8),
        db
          .from('audit_logs')
          .leftJoin('users', 'users.id', 'audit_logs.user_id')
          .select(
            'audit_logs.id',
            'audit_logs.action',
            'audit_logs.entity_type',
            'audit_logs.entity_id',
            'audit_logs.created_at',
            'users.email as actor_email'
          )
          .orderBy('audit_logs.id', 'desc')
          .limit(8),
        db.from('events').where('stream_status', 'live').select('id', 'name', 'slug', 'status'),
      ])

    return {
      users,
      usersActive,
      usersSuspended,
      events,
      eventsLive,
      eventsScheduled,
      rounds,
      bets,
      betsToday: Number(betsToday?.total || 0),
      volumeToday: Number(volumeToday?.total || 0),
      volumeTotal,
      poolTotal,
      payoutTotal,
      commissionTotal,
      walletBalance,
      walletHeld,
      recentBets,
      recentAudit,
      liveStreams,
    }
  }

  async listRoles() {
    return db.from('roles').select('code', 'name').orderBy('id')
  }

  async findUser(userId: number) {
    return db.from('users').where('id', userId).first()
  }

  async listUsers(filters: {
    search?: string
    status?: string
    roleCode?: string
    betting?: string
    page?: number
  }) {
    const page = Math.max(Number(filters.page || 1), 1)
    const perPage = 50

    const applyFilters = (query: any) => {
      if (filters.search) {
        query.where((q: any) => {
          q.where('email', 'ilike', `%${filters.search}%`)
            .orWhere('full_name', 'ilike', `%${filters.search}%`)
            .orWhere('username', 'ilike', `%${filters.search}%`)
        })
      }
      if (filters.status) query.where('status', filters.status)
      if (filters.betting) query.where('is_betting_enabled', filters.betting === '1')
      if (filters.roleCode) {
        query.whereIn(
          'users.id',
          db
            .from('user_roles')
            .join('roles', 'roles.id', 'user_roles.role_id')
            .where('roles.code', filters.roleCode)
            .select('user_roles.user_id')
        )
      }
    }

    const countQuery = db.from('users')
    applyFilters(countQuery)
    const totalRow = await countQuery.count('* as total').first()

    const query = db
      .from('users')
      .select(
        'users.*',
        db.raw(
          "(SELECT string_agg(r.code, ', ') FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = users.id) as roles"
        )
      )
    applyFilters(query)
    query
      .orderBy('users.id', 'desc')
      .limit(perPage)
      .offset((page - 1) * perPage)

    return { rows: await query, total: Number(totalRow?.total || 0), page, perPage }
  }

  async getUserDetail(userId: number) {
    const user = await db
      .from('users')
      .select(
        'users.*',
        db.raw(
          "(SELECT string_agg(r.code, ', ') FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = users.id) as roles"
        )
      )
      .where('users.id', userId)
      .first()
    if (!user) return null

    const [wallet, transactions, betStats, recentBets, allRoles] = await Promise.all([
      db.from('wallets').where('user_id', userId).first(),
      db.from('wallet_transactions').where('user_id', userId).orderBy('id', 'desc').limit(20),
      db
        .from('bets')
        .select(
          db.raw('count(*)::int as total'),
          db.raw('COALESCE(sum(amount), 0) as wagered'),
          db.raw('COALESCE(sum(payout_amount), 0) as payouts'),
          db.raw("count(*) FILTER (WHERE status = 'won')::int as won")
        )
        .where('user_id', userId)
        .first(),
      db
        .from('bets')
        .join('events', 'events.id', 'bets.event_id')
        .join('rounds', 'rounds.id', 'bets.round_id')
        .join('betting_sides', 'betting_sides.id', 'bets.betting_side_id')
        .select(
          'bets.id',
          'bets.amount',
          'bets.status',
          'bets.placed_at',
          'events.name as event_name',
          'rounds.round_number',
          'betting_sides.name as side_name'
        )
        .where('bets.user_id', userId)
        .orderBy('bets.id', 'desc')
        .limit(10),
      db.from('roles').select('code', 'name').orderBy('id'),
    ])

    return { ...user, wallet, transactions, betStats, recentBets, allRoles }
  }

  async changeUserStatus(
    userId: number,
    status: 'active' | 'suspended' | 'blocked',
    actorUserId: number
  ) {
    return db.transaction(async (trx) => {
      const user = await trx.from('users').where('id', userId).forUpdate().first()
      if (!user) return null
      const previous = user.status
      await trx.from('users').where('id', userId).update({ status, updated_at: new Date() })
      await trx.table('audit_logs').insert({
        user_id: actorUserId,
        action: 'user.status_changed',
        entity_type: 'user',
        entity_id: String(userId),
        old_values: { status: previous },
        new_values: { status },
        created_at: new Date(),
      })
      return trx.from('users').where('id', userId).first()
    })
  }

  async toggleBetting(userId: number, actorUserId: number) {
    return db.transaction(async (trx) => {
      const user = await trx.from('users').where('id', userId).forUpdate().first()
      if (!user) return null
      const previous = Boolean(user.is_betting_enabled)
      await trx
        .from('users')
        .where('id', userId)
        .update({ is_betting_enabled: !previous, updated_at: new Date() })
      await trx.table('audit_logs').insert({
        user_id: actorUserId,
        action: 'user.betting_toggled',
        entity_type: 'user',
        entity_id: String(userId),
        old_values: { isBettingEnabled: previous },
        new_values: { isBettingEnabled: !previous },
        created_at: new Date(),
      })
      return trx.from('users').where('id', userId).first()
    })
  }

  async assignRole(userId: number, roleCode: string, actorUserId: number) {
    return db.transaction(async (trx) => {
      const user = await trx.from('users').where('id', userId).forUpdate().first()
      if (!user) return null
      const role = await trx.from('roles').where('code', roleCode).first()
      if (!role) throw new Error('ROLE_NOT_FOUND')

      const current = await trx
        .from('user_roles')
        .join('roles', 'roles.id', 'user_roles.role_id')
        .where('user_roles.user_id', userId)
        .select('roles.code')
      const previousCodes = current.map((row: any) => row.code)

      if (previousCodes.includes(roleCode)) {
        await trx.from('user_roles').where('user_id', userId).where('role_id', role.id).delete()
      } else {
        await trx
          .table('user_roles')
          .insert({ user_id: userId, role_id: role.id, created_at: new Date() })
      }

      const after = await trx
        .from('user_roles')
        .join('roles', 'roles.id', 'user_roles.role_id')
        .where('user_roles.user_id', userId)
        .select('roles.code')

      await trx.table('audit_logs').insert({
        user_id: actorUserId,
        action: 'user.role_changed',
        entity_type: 'user',
        entity_id: String(userId),
        old_values: { roles: previousCodes },
        new_values: { roles: after.map((row: any) => row.code) },
        created_at: new Date(),
      })
      return after.map((row: any) => row.code)
    })
  }

  async listEventsBrief() {
    return db.from('events').select('id', 'name', 'slug', 'status').orderBy('id', 'desc').limit(200)
  }

  async listEventsReport(filters: { status?: string; search?: string } & DateRange) {
    const query = db
      .from('events as e')
      .select(
        'e.*',
        db.raw('(SELECT count(*) FROM rounds r WHERE r.event_id = e.id)::int as rounds_count'),
        db.raw('(SELECT count(*) FROM bets b WHERE b.event_id = e.id)::int as bets_count'),
        db.raw(
          '(SELECT COALESCE(sum(b.amount), 0) FROM bets b WHERE b.event_id = e.id) as bets_volume'
        ),
        db.raw(
          '(SELECT COALESCE(sum(rs.total_pool), 0) FROM round_results rs WHERE rs.event_id = e.id) as pool_total'
        ),
        db.raw(
          '(SELECT COALESCE(sum(rs.total_payout), 0) FROM round_results rs WHERE rs.event_id = e.id) as payout_total'
        ),
        db.raw(
          '(SELECT COALESCE(sum(rs.house_commission), 0) FROM round_results rs WHERE rs.event_id = e.id) as commission_total'
        )
      )
    if (filters.status) query.where('e.status', filters.status)
    if (filters.search) {
      query.where((q: any) => {
        q.where('e.name', 'ilike', `%${filters.search}%`).orWhere(
          'e.slug',
          'ilike',
          `%${filters.search}%`
        )
      })
    }
    buildDateRange(query, 'e.created_at', filters)
    query.orderBy('e.id', 'desc').limit(500)
    return query
  }

  async listBetsReport(
    filters: { eventId?: string; status?: string; search?: string } & DateRange
  ) {
    const applyFilters = (query: any) => {
      if (filters.eventId) query.where('b.event_id', Number(filters.eventId))
      if (filters.status) query.where('b.status', filters.status)
      if (filters.search) {
        query.where((q: any) => {
          q.where('u.email', 'ilike', `%${filters.search}%`).orWhere(
            'u.full_name',
            'ilike',
            `%${filters.search}%`
          )
        })
      }
      buildDateRange(query, 'b.placed_at', filters)
    }

    const rowsQuery = db
      .from('bets as b')
      .join('users as u', 'u.id', 'b.user_id')
      .join('events as e', 'e.id', 'b.event_id')
      .join('rounds as r', 'r.id', 'b.round_id')
      .join('betting_sides as s', 's.id', 'b.betting_side_id')
      .select(
        'b.id',
        'b.amount',
        'b.status',
        'b.payout_amount',
        'b.placed_at',
        'u.email',
        'u.full_name',
        'e.name as event_name',
        'e.slug',
        'r.round_number',
        's.name as side_name'
      )
    applyFilters(rowsQuery)
    rowsQuery.orderBy('b.id', 'desc').limit(500)

    const totalsQuery = db
      .from('bets as b')
      .join('users as u', 'u.id', 'b.user_id')
      .select(
        db.raw('count(*)::int as total'),
        db.raw('COALESCE(sum(b.amount), 0) as volume'),
        db.raw('COALESCE(sum(b.payout_amount), 0) as payouts')
      )
    applyFilters(totalsQuery)

    const [rows, totals] = await Promise.all([rowsQuery, totalsQuery.first()])
    return { rows, totals }
  }

  async listFinancialReport(filters: DateRange) {
    const transactionsQuery = db
      .from('wallet_transactions')
      .select(
        'type',
        db.raw('count(*)::int as tx_count'),
        db.raw('COALESCE(sum(amount), 0) as gross'),
        db.raw(
          'COALESCE(sum(CASE WHEN balance_after > balance_before THEN balance_after - balance_before ELSE 0 END), 0) as credited'
        ),
        db.raw(
          'COALESCE(sum(CASE WHEN balance_after < balance_before THEN balance_before - balance_after ELSE 0 END), 0) as debited'
        )
      )
    buildDateRange(transactionsQuery, 'created_at', filters)
    transactionsQuery.groupBy('type').orderBy('type')

    const totalsQuery = db
      .from('wallet_transactions')
      .select(
        db.raw('count(*)::int as total'),
        db.raw('COALESCE(sum(amount), 0) as gross'),
        db.raw(
          'COALESCE(sum(CASE WHEN balance_after > balance_before THEN balance_after - balance_before ELSE 0 END), 0) as credited'
        ),
        db.raw(
          'COALESCE(sum(CASE WHEN balance_after < balance_before THEN balance_before - balance_after ELSE 0 END), 0) as debited'
        )
      )
    buildDateRange(totalsQuery, 'created_at', filters)

    const resultsQuery = db
      .from('round_results')
      .select(
        db.raw('count(*)::int as rounds'),
        db.raw('COALESCE(sum(total_pool), 0) as pool'),
        db.raw('COALESCE(sum(total_payout), 0) as payout'),
        db.raw('COALESCE(sum(house_commission), 0) as commission'),
        db.raw('COALESCE(sum(total_winners), 0)::int as winners')
      )
    buildDateRange(resultsQuery, 'settled_at', filters)

    const [byType, totals, results] = await Promise.all([
      transactionsQuery,
      totalsQuery.first(),
      resultsQuery.first(),
    ])
    return { byType, totals, results }
  }

  async listUsersReport(filters: { search?: string; status?: string } & DateRange) {
    const query = db
      .from('users as u')
      .leftJoin('wallets as w', 'w.user_id', 'u.id')
      .select(
        'u.id',
        'u.email',
        'u.full_name',
        'u.username',
        'u.status',
        'u.is_betting_enabled',
        'u.created_at',
        'w.available_balance',
        'w.held_balance',
        db.raw('(SELECT count(*) FROM bets b WHERE b.user_id = u.id)::int as bets_count'),
        db.raw('(SELECT COALESCE(sum(b.amount), 0) FROM bets b WHERE b.user_id = u.id) as wagered'),
        db.raw(
          "(SELECT COALESCE(sum(b.payout_amount), 0) FROM bets b WHERE b.user_id = u.id AND b.status IN ('won', 'refunded')) as winnings"
        ),
        db.raw(
          "(SELECT string_agg(r.code, ', ') FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id) as roles"
        )
      )
    if (filters.search) {
      query.where((q: any) => {
        q.where('u.email', 'ilike', `%${filters.search}%`).orWhere(
          'u.full_name',
          'ilike',
          `%${filters.search}%`
        )
      })
    }
    if (filters.status) query.where('u.status', filters.status)
    buildDateRange(query, 'u.created_at', filters)
    query.orderBy('u.id', 'desc').limit(500)
    return query
  }

  async listAudit(
    filters: {
      action?: string
      entityType?: string
      entityId?: string
      search?: string
    } & DateRange
  ) {
    const query = db
      .from('audit_logs as a')
      .leftJoin('users as u', 'u.id', 'a.user_id')
      .select(
        'a.id',
        'a.action',
        'a.entity_type',
        'a.entity_id',
        'a.old_values',
        'a.new_values',
        'a.ip_address',
        'a.created_at',
        'u.email as actor_email'
      )
    if (filters.action) query.where('a.action', 'ilike', `%${filters.action}%`)
    if (filters.entityType) query.where('a.entity_type', filters.entityType)
    if (filters.entityId) query.where('a.entity_id', String(filters.entityId))
    if (filters.search) query.where('u.email', 'ilike', `%${filters.search}%`)
    buildDateRange(query, 'a.created_at', filters)
    query.orderBy('a.id', 'desc').limit(300)
    return query
  }

  async listModerationMessages(
    filters: { eventId?: string; status?: string; search?: string } & DateRange
  ) {
    const query = db
      .from('messages as m')
      .join('users as u', 'u.id', 'm.user_id')
      .leftJoin('users as mod', 'mod.id', 'm.moderated_by')
      .join('events as e', 'e.id', 'm.event_id')
      .select(
        'm.id',
        'm.content',
        'm.message_type',
        'm.status',
        'm.created_at',
        'm.moderated_at',
        'm.moderated_by',
        'u.email',
        'u.full_name',
        'e.name as event_name',
        'e.slug',
        'mod.email as moderator_email'
      )
    if (filters.eventId) query.where('m.event_id', Number(filters.eventId))
    if (filters.status) query.where('m.status', filters.status)
    if (filters.search) query.where('m.content', 'ilike', `%${filters.search}%`)
    buildDateRange(query, 'm.created_at', filters)
    query.orderBy('m.id', 'desc').limit(300)
    return query
  }

  async moderateMessage(
    messageId: number,
    action: 'hide' | 'show' | 'delete',
    actorUserId: number
  ) {
    return db.transaction(async (trx) => {
      const message = await trx.from('messages').where('id', messageId).forUpdate().first()
      if (!message) return null

      const status = action === 'show' ? 'visible' : action === 'delete' ? 'deleted' : 'hidden'
      const values: Record<string, unknown> = {
        status,
        moderated_at: new Date(),
        moderated_by: actorUserId,
      }
      if (action === 'delete') values.content = ''
      await trx.from('messages').where('id', messageId).update(values)
      await trx.table('audit_logs').insert({
        user_id: actorUserId,
        action: `chat.message_${action}`,
        entity_type: 'message',
        entity_id: String(messageId),
        old_values: { status: message.status },
        new_values: { status, moderatedBy: actorUserId },
        created_at: new Date(),
      })
      return trx.from('messages').where('id', messageId).first()
    })
  }
}
