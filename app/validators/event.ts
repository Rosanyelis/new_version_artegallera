import vine from '@vinejs/vine'

export const eventCreateValidator = vine.create({
  name: vine.string().trim().minLength(3).maxLength(160),
  slug: vine.string().trim().minLength(3).maxLength(180).optional(),
  description: vine.string().trim().maxLength(5000).optional(),
  location: vine.string().trim().maxLength(160).optional(),
  scheduledAt: vine.string().trim().maxLength(40).optional(),
  coverImage: vine.string().trim().url().maxLength(500).optional(),
  isFeatured: vine.boolean().optional(),
})

export const roundCreateValidator = vine.create({
  roundNumber: vine.number().positive(),
})

export const roundResultValidator = vine.create({
  winningSideId: vine.number().positive(),
})
