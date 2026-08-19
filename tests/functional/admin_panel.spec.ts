import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import AdminService from '#services/admin_service'
import WalletService from '#services/wallet_service'

const baseUrl = 'http://localhost:3333'

function cookieHeader(setCookies: string[]): { cookie: string; xsrf: string } {
  const values = new Map<string, string>()
  for (const setCookie of setCookies) {
    const pair = setCookie.split(';', 1)[0]
    const index = pair.indexOf('=')
    values.set(pair.slice(0, index).trim(), pair.slice(index + 1))
  }
  const cookie = [...values.entries()].map(([key, value]) => `${key}=${value}`).join('; ')
  return { cookie, xsrf: values.get('XSRF-TOKEN') || '' }
}

async function authenticate(email: string, password: string) {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return cookieHeader(response.headers.getSetCookie())
}

test.group('Administración y permisos', () => {
  test('el ajuste de wallet exige permisos y quedó bloqueado sin ellos', async ({ assert }) => {
    const user = await User.create({
      fullName: 'Regular User',
      email: `regular-${Date.now()}@example.com`,
      password: 'Secreta123!',
      status: 'active',
      isBettingEnabled: false,
    })
    const { cookie } = await authenticate(user.email, 'Secreta123!')

    const response = await fetch(`${baseUrl}/api/v1/admin/wallets/adjust`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({
        userId: user.id,
        amount: '10.00',
        direction: 'credit',
        idempotencyKey: `adj-${user.id}-${Date.now()}`,
      }),
    })
    assert.equal(response.status, 403)
  })

  test('un operador con wallets.manage ajusta y el saldo refleja el crédito', async ({
    assert,
  }) => {
    const operator = await User.create({
      fullName: 'Operator Admin',
      email: `operator-admin-${Date.now()}@example.com`,
      password: 'Secreta123!',
      status: 'active',
      isBettingEnabled: false,
    })
    const adminRole = await db.from('roles').where('code', 'admin').first()
    await operator.related('roles').attach([adminRole.id])

    const target = await User.create({
      fullName: 'Target User',
      email: `target-${Date.now()}@example.com`,
      password: 'Secreta123!',
      status: 'active',
      isBettingEnabled: false,
    })
    await new WalletService().ensureWallet(target.id)

    const { cookie, xsrf } = await authenticate(operator.email, 'Secreta123!')
    const adjust = await fetch(`${baseUrl}/api/v1/admin/wallets/adjust`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
        'x-xsrf-token': xsrf,
      },
      body: JSON.stringify({
        userId: target.id,
        amount: '10.00',
        direction: 'credit',
        idempotencyKey: `adj-${target.id}-${Date.now()}`,
        description: 'test de ajuste',
      }),
    })
    assert.equal(adjust.status, 200)

    const balance = await new WalletService().getBalance(target.id)
    assert.equal(balance.availableBalance, '10.00')
    const audit = await db
      .from('audit_logs')
      .where('action', 'wallet.adjustment')
      .orderBy('id', 'desc')
      .first()
    assert.isNotNull(audit)
  })

  test('changeUserStatus actualiza el estado y audita la transición', async ({ assert }) => {
    const actor = await User.create({
      fullName: 'Actor',
      email: `actor-${Date.now()}@example.com`,
      password: 'Secreta123!',
      status: 'active',
      isBettingEnabled: false,
    })
    const target = await User.create({
      fullName: 'Target Status',
      email: `target-status-${Date.now()}@example.com`,
      password: 'Secreta123!',
      status: 'active',
      isBettingEnabled: false,
    })

    await new AdminService().changeUserStatus(target.id, 'suspended', actor.id)

    const updated = await db.from('users').where('id', target.id).first()
    assert.equal(updated.status, 'suspended')
    const audit = await db
      .from('audit_logs')
      .where('action', 'user.status_changed')
      .where('entity_type', 'user')
      .where('entity_id', String(target.id))
      .first()
    assert.isNotNull(audit)
    assert.deepEqual(audit.old_values, { status: 'active' })
    assert.deepEqual(audit.new_values, { status: 'suspended' })
  })

  test('assignRole alterna el rol y audita el cambio', async ({ assert }) => {
    const actor = await User.create({
      fullName: 'Role Actor',
      email: `role-actor-${Date.now()}@example.com`,
      password: 'Secreta123!',
      status: 'active',
      isBettingEnabled: false,
    })
    const target = await User.create({
      fullName: 'Role Target',
      email: `role-target-${Date.now()}@example.com`,
      password: 'Secreta123!',
      status: 'active',
      isBettingEnabled: false,
    })

    const afterFirst = await new AdminService().assignRole(target.id, 'moderator', actor.id)
    assert.isNotNull(afterFirst)
    assert.isTrue(afterFirst!.includes('moderator'))

    const afterSecond = await new AdminService().assignRole(target.id, 'moderator', actor.id)
    assert.isNotNull(afterSecond)
    assert.isFalse(afterSecond!.includes('moderator'))

    const audit = await db
      .from('audit_logs')
      .where('action', 'user.role_changed')
      .where('entity_type', 'user')
      .where('entity_id', String(target.id))
      .first()
    assert.isNotNull(audit)
  })

  test('las métricas del dashboard devuelven valores numéricos', async ({ assert }) => {
    const metrics = await new AdminService().dashboardMetrics()
    assert.isNumber(metrics.users)
    assert.isNumber(metrics.events)
    assert.isNumber(metrics.bets)
    assert.isNumber(metrics.volumeTotal)
    assert.isArray(metrics.recentBets)
    assert.isArray(metrics.recentAudit)
  })

  test('listUsers filtra por rol y estado', async ({ assert }) => {
    const result = await new AdminService().listUsers({ roleCode: 'user', status: 'active' })
    assert.isArray(result.rows)
    assert.isNumber(result.total)
  })
})
