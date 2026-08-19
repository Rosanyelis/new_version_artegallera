import vine from '@vinejs/vine'

export const userStatusValidator = vine.create({
  action: vine.enum(['suspend', 'activate', 'block'] as const),
  confirmation: vine.string().trim().minLength(3).maxLength(254),
  confirmed: vine.boolean(),
})

export const roleAssignmentValidator = vine.create({
  roleCode: vine.string().trim().minLength(2).maxLength(40),
  confirmed: vine.boolean(),
})

export const bettingToggleValidator = vine.create({
  confirmed: vine.boolean(),
})

const money = vine.string().regex(/^\d+(\.\d{1,2})?$/)

export const adminWalletAdjustValidator = vine.create({
  userId: vine.number().positive(),
  amount: money,
  direction: vine.enum(['credit', 'debit'] as const),
  description: vine.string().trim().maxLength(255).optional(),
  confirmation: vine.string().trim().minLength(3).maxLength(254),
  confirmed: vine.boolean(),
})

export const moderationValidator = vine.create({
  action: vine.enum(['hide', 'show', 'delete'] as const),
})
