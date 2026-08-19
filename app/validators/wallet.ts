import vine from '@vinejs/vine'

const money = vine.string().regex(/^\d+(\.\d{1,2})?$/)

export const walletAdjustmentValidator = vine.create({
  userId: vine.number().positive(),
  amount: money,
  direction: vine.enum(['credit', 'debit'] as const),
  idempotencyKey: vine.string().trim().minLength(8).maxLength(120),
  description: vine.string().trim().maxLength(255).optional(),
})
