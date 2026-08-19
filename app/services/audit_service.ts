import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

type AuditInput = {
  trx?: TransactionClientContract
  userId?: number | null
  action: string
  entityType: string
  entityId: number | string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export default class AuditService {
  async record(input: AuditInput) {
    const client = input.trx || db
    await client.table('audit_logs').insert({
      user_id: input.userId ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: String(input.entityId),
      old_values: input.oldValues ?? null,
      new_values: input.newValues ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      created_at: new Date(),
    })
  }
}
