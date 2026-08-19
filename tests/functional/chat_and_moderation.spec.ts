import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import AdminService from '#services/admin_service'

const baseUrl = 'http://localhost:3333'

test.group('Chat API y moderación', () => {
  test('envía un mensaje, lo lista y la moderación lo oculta', async ({ assert }) => {
    const event = await db.from('events').orderBy('id').first()
    assert.isNotNull(event, 'Se necesita un evento de prueba')

    const email = `chat-mod-${Date.now()}@example.com`
    const register = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Chat Mod Test',
        email,
        password: 'Secreta123!',
        passwordConfirmation: 'Secreta123!',
      }),
    })
    assert.equal(register.status, 201)
    const cookie = register.headers
      .getSetCookie()
      .map((value) => value.split(';', 1)[0])
      .join('; ')
    const registerJson = await register.json()
    const userId = registerJson.data.id

    const posted = await fetch(`${baseUrl}/api/v1/events/${event.id}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ content: 'mensaje a moderar' }),
    })
    assert.equal(posted.status, 201)
    const postedJson = await posted.json()
    const message = postedJson.data

    const beforeResponse = await fetch(`${baseUrl}/api/v1/events/${event.id}/chat`, {
      headers: { cookie },
    })
    const before = await beforeResponse.json()
    assert.isTrue(before.data.some((item: any) => item.id === message.id))

    await new AdminService().moderateMessage(message.id, 'hide', userId)

    const afterResponse = await fetch(`${baseUrl}/api/v1/events/${event.id}/chat`, {
      headers: { cookie },
    })
    const after = await afterResponse.json()
    assert.isFalse(after.data.some((item: any) => item.id === message.id))

    const deleted = await new AdminService().moderateMessage(message.id, 'delete', userId)
    assert.equal(deleted.content, '')
    const audit = await db
      .from('audit_logs')
      .where('entity_type', 'message')
      .where('entity_id', String(message.id))
      .orderBy('id', 'desc')
      .first()
    assert.equal(audit.action, 'chat.message_delete')
  })

  test('el chat exige sesión', async ({ assert }) => {
    const event = await db.from('events').orderBy('id').first()
    const response = await fetch(`${baseUrl}/api/v1/events/${event.id}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'sin sesión' }),
    })
    assert.equal(response.status, 401)
  })
})
