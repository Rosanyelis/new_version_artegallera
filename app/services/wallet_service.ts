import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import AuditService from '#services/audit_service'
import {
  IdempotencyConflictError,
  InsufficientFundsError,
  WalletError,
  WalletNotFoundError,
} from '#exceptions/wallet'

export type WalletOperationType =
  'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'adjustment' | 'commission' | 'reversal'
export type WalletDirection = 'credit' | 'debit'

export type OperationOptions = {
  idempotencyKey: string
  reference?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
  actorUserId?: number | null
  ipAddress?: string | null
  userAgent?: string | null
}

export function parseMoney(value: string | number) {
  const normalized = String(value)
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new WalletError('El monto monetario no es válido.')
  }
  const [whole, fraction = ''] = normalized.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
}

export function formatMoney(cents: bigint) {
  const sign = cents < 0n ? '-' : ''
  const absolute = cents < 0n ? -cents : cents
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`
}

export default class WalletService {
  private audit = new AuditService()

  async ensureWallet(userId: number) {
    return db.transaction(async (trx) => this.ensureWalletInTransaction(trx, userId, false))
  }

  async getBalance(userId: number) {
    const wallet = await db.from('wallets').where('user_id', userId).first()
    if (!wallet) {
      return { availableBalance: '0.00', heldBalance: '0.00', totalBalance: '0.00' }
    }

    const available = parseMoney(wallet.available_balance)
    const held = parseMoney(wallet.held_balance)
    return {
      availableBalance: formatMoney(available),
      heldBalance: formatMoney(held),
      totalBalance: formatMoney(available + held),
    }
  }

  async getTransactions(userId: number, limit = 50, cursor?: number) {
    const query = db
      .from('wallet_transactions')
      .where('user_id', userId)
      .orderBy('id', 'desc')
      .limit(Math.min(limit, 100))

    if (cursor) query.where('id', '<', cursor)
    return query
  }

  async credit(userId: number, amount: string, options: OperationOptions) {
    return this.mutate(userId, amount, 'credit', 'deposit', options)
  }

  async debit(userId: number, amount: string, options: OperationOptions) {
    return this.mutate(userId, amount, 'debit', 'withdrawal', options)
  }

  async creditInTransaction(
    trx: TransactionClientContract,
    userId: number,
    amount: string,
    type: WalletOperationType,
    options: OperationOptions
  ) {
    return this.mutateInTransaction(trx, userId, amount, 'credit', type, options)
  }

  async debitInTransaction(
    trx: TransactionClientContract,
    userId: number,
    amount: string,
    type: WalletOperationType,
    options: OperationOptions
  ) {
    return this.mutateInTransaction(trx, userId, amount, 'debit', type, options)
  }

  async refund(userId: number, amount: string, options: OperationOptions) {
    return this.mutate(userId, amount, 'credit', 'refund', options)
  }

  async adjust(
    userId: number,
    amount: string,
    direction: WalletDirection,
    options: OperationOptions
  ) {
    return this.mutate(userId, amount, direction, 'adjustment', options)
  }

  async reverse(transactionId: number, options: OperationOptions) {
    return db.transaction(async (trx) => {
      const original = await trx.from('wallet_transactions').where('id', transactionId).first()
      if (!original) throw new WalletNotFoundError()

      const direction: WalletDirection = ['deposit', 'win', 'refund'].includes(original.type)
        ? 'debit'
        : 'credit'
      return this.mutateInTransaction(
        trx,
        original.user_id,
        original.amount,
        direction,
        'reversal',
        {
          ...options,
          reference: options.reference || String(transactionId),
          metadata: { ...(options.metadata || {}), reversedTransactionId: transactionId },
        }
      )
    })
  }

  private async mutate(
    userId: number,
    amount: string,
    direction: WalletDirection,
    type: WalletOperationType,
    options: OperationOptions
  ) {
    return db.transaction(async (trx) =>
      this.mutateInTransaction(trx, userId, amount, direction, type, options)
    )
  }

  private async mutateInTransaction(
    trx: TransactionClientContract,
    userId: number,
    amount: string,
    direction: WalletDirection,
    type: WalletOperationType,
    options: OperationOptions
  ) {
    const amountCents = parseMoney(amount)
    if (amountCents <= 0n) throw new WalletError('El monto debe ser mayor que cero.')

    await this.ensureWalletInTransaction(trx, userId, false)
    const wallet = await trx.from('wallets').where('user_id', userId).forUpdate().first()
    if (!wallet) throw new WalletNotFoundError()

    const existing = await trx
      .from('wallet_transactions')
      .where('idempotency_key', options.idempotencyKey)
      .first()
    if (existing) {
      if (existing.user_id !== userId) throw new IdempotencyConflictError()
      return existing
    }

    const before = parseMoney(wallet.available_balance)
    const after = direction === 'credit' ? before + amountCents : before - amountCents
    if (after < 0n) throw new InsufficientFundsError()

    const now = new Date()
    await trx
      .from('wallets')
      .where('id', wallet.id)
      .update({
        available_balance: formatMoney(after),
        updated_at: now,
      })
    await trx.table('wallet_transactions').insert({
      wallet_id: wallet.id,
      user_id: userId,
      type,
      amount: formatMoney(amountCents),
      balance_before: formatMoney(before),
      balance_after: formatMoney(after),
      status: 'posted',
      idempotency_key: options.idempotencyKey,
      reference: options.reference || null,
      description: options.description || null,
      metadata: options.metadata || null,
      created_at: now,
    })

    const transaction = await trx
      .from('wallet_transactions')
      .where('idempotency_key', options.idempotencyKey)
      .first()
    await this.audit.record({
      trx,
      userId: options.actorUserId ?? userId,
      action: `wallet.${type}`,
      entityType: 'wallet',
      entityId: wallet.id,
      oldValues: { availableBalance: formatMoney(before) },
      newValues: { availableBalance: formatMoney(after), transactionId: transaction.id },
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    })

    return transaction
  }

  private async ensureWalletInTransaction(
    trx: TransactionClientContract,
    userId: number,
    lock: boolean
  ) {
    await trx
      .table('wallets')
      .insert({
        user_id: userId,
        available_balance: '0.00',
        held_balance: '0.00',
        created_at: new Date(),
      })
      .onConflict('user_id')
      .ignore()

    const query = trx.from('wallets').where('user_id', userId)
    if (lock) query.forUpdate()
    return query.first()
  }
}
