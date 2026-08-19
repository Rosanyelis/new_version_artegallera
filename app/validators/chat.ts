import vine from '@vinejs/vine'

export const chatMessageValidator = vine.create({
  content: vine.string().trim().minLength(1).maxLength(500),
})
