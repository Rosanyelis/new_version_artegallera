import vine from '@vinejs/vine'

export const placeBetValidator = vine.create({
  bettingSideId: vine.number().positive(),
  amount: vine.string().regex(/^\d+(\.\d{1,2})?$/),
  idempotencyKey: vine.string().trim().minLength(8).maxLength(120),
})
