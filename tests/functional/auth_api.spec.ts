import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import WalletService from '#services/wallet_service'
import { InsufficientFundsError } from '#exceptions/wallet'
import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

const baseUrl = 'http://localhost:3333'

test.group('Authentication API', () => {
  test('returns health and readiness status', async ({ assert }) => {
    const health = await fetch(`${baseUrl}/health`)
    assert.equal(health.status, 200)
    const healthBody = await health.json()
    assert.equal(healthBody.status, 'ok')

    const ready = await fetch(`${baseUrl}/ready`)
    assert.equal(ready.status, 200)
    const readyBody = await ready.json()
    assert.equal(readyBody.status, 'ready')
  })

  test('rejects unauthenticated access to the current user endpoint', async ({ assert }) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`)
    assert.equal(response.status, 401)
    const body = await response.json()
    assert.equal(body.error.code, 'AUTHENTICATION_REQUIRED')
  })

  test('registers a user with a default user role', async ({ assert }) => {
    const email = `phase1-${Date.now()}@example.com`
    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Usuario de Prueba',
        email,
        password: 'Secreta123!',
        passwordConfirmation: 'Secreta123!',
      }),
    })

    assert.equal(response.status, 201)
    const body = await response.json()
    assert.equal(body.data.email, email)
    assert.equal(body.data.status, 'active')

    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(';', 1)[0])
      .join('; ')
    const adminCheck = await fetch(`${baseUrl}/api/v1/admin/access-check`, {
      headers: { cookie },
    })
    assert.equal(adminCheck.status, 403)
  })

  test('does not reveal whether an email exists', async ({ assert }) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'does-not-exist@example.com' }),
    })

    assert.equal(response.status, 202)
    const body = await response.json()
    assert.match(body.data.message, /Si existe una cuenta/)
  })

  test('consumes a reset token once and updates the password', async ({ assert }) => {
    const email = `reset-${Date.now()}@example.com`
    const user = await User.create({
      fullName: 'Reset User',
      email,
      password: 'OldPassword123!',
      status: 'active',
      isBettingEnabled: false,
    })
    const token = randomBytes(32).toString('base64url')
    await db.table('password_reset_tokens').insert({
      user_id: user.id,
      token_hash: createHash('sha256').update(token).digest('hex'),
      expires_at: DateTime.now().plus({ minutes: 60 }).toSQL(),
      created_at: DateTime.now().toSQL(),
    })

    const reset = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        password: 'NewPassword123!',
        passwordConfirmation: 'NewPassword123!',
      }),
    })
    assert.equal(reset.status, 200)

    const reused = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        password: 'AnotherPassword123!',
        passwordConfirmation: 'AnotherPassword123!',
      }),
    })
    assert.equal(reused.status, 422)
  })

  test('credits, debits and replays an operation idempotently', async ({ assert }) => {
    const user = await User.create({
      fullName: 'Wallet User',
      email: `wallet-${Date.now()}@example.com`,
      password: 'WalletPassword123!',
      status: 'active',
      isBettingEnabled: false,
    })
    const wallet = new WalletService()
    await wallet.ensureWallet(user.id)

    const first = await wallet.credit(user.id, '100.00', {
      idempotencyKey: `credit-${user.id}-${Date.now()}`,
    })
    const replay = await wallet.credit(user.id, '100.00', {
      idempotencyKey: first.idempotency_key,
    })
    await wallet.debit(user.id, '35.25', {
      idempotencyKey: `debit-${user.id}-${Date.now()}`,
    })

    assert.equal(replay.id, first.id)
    assert.deepEqual(await wallet.getBalance(user.id), {
      availableBalance: '64.75',
      heldBalance: '0.00',
      totalBalance: '64.75',
    })
    const transactionCount = await db
      .from('wallet_transactions')
      .where('user_id', user.id)
      .count('* as total')
      .first()
    assert.equal(transactionCount.total, '2')
  })

  test('does not mutate balance when a debit lacks funds', async ({ assert }) => {
    const user = await User.create({
      fullName: 'Insufficient User',
      email: `insufficient-${Date.now()}@example.com`,
      password: 'WalletPassword123!',
      status: 'active',
      isBettingEnabled: false,
    })
    const wallet = new WalletService()
    await wallet.ensureWallet(user.id)

    await assert.rejects(
      () => wallet.debit(user.id, '1.00', { idempotencyKey: `debit-${user.id}-${Date.now()}` }),
      InsufficientFundsError
    )
    const balance = await wallet.getBalance(user.id)
    assert.equal(balance.availableBalance, '0.00')
  })

  test('serializes concurrent debits with a row lock', async ({ assert }) => {
    const user = await User.create({
      fullName: 'Concurrent Wallet User',
      email: `concurrent-${Date.now()}@example.com`,
      password: 'WalletPassword123!',
      status: 'active',
      isBettingEnabled: false,
    })
    const wallet = new WalletService()
    await wallet.ensureWallet(user.id)
    await wallet.credit(user.id, '10.00', { idempotencyKey: `credit-${user.id}-${Date.now()}` })

    const results = await Promise.allSettled([
      wallet.debit(user.id, '10.00', { idempotencyKey: `debit-a-${user.id}-${Date.now()}` }),
      wallet.debit(user.id, '10.00', { idempotencyKey: `debit-b-${user.id}-${Date.now()}` }),
    ])

    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
    assert.equal(results.filter((result) => result.status === 'rejected').length, 1)
    const balance = await wallet.getBalance(user.id)
    assert.equal(balance.availableBalance, '0.00')
  })
})
