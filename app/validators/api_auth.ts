import vine from '@vinejs/vine'

const password = vine.string().minLength(8).maxLength(72)

export const apiLoginValidator = vine.create({
  email: vine.string().trim().email().maxLength(254),
  password,
})

export const apiSignupValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(120),
  email: vine.string().trim().email().maxLength(254).unique({ table: 'users', column: 'email' }),
  password: password.confirmed({ confirmationField: 'passwordConfirmation' }),
})

export const forgotPasswordValidator = vine.create({
  email: vine.string().trim().email().maxLength(254),
})

export const resetPasswordValidator = vine.create({
  token: vine.string().trim().minLength(32).maxLength(128),
  password: password.confirmed({ confirmationField: 'passwordConfirmation' }),
})
