import env from '#start/env'
import encryption from '@adonisjs/core/services/encryption'
import db from '@adonisjs/lucid/services/db'
import { randomBytes } from 'node:crypto'
import AuditService from '#services/audit_service'

export default class StreamingService {
  private audit = new AuditService()

  async create(eventId: number, actorUserId: number) {
    const event = await db.from('events').where('id', eventId).first()
    if (!event) return null
    const streamKey = `event_${event.id}_${randomBytes(24).toString('base64url')}`
    const playbackUrl = `${env.get('STREAMING_PLAYBACK_BASE_URL').replace(/\/$/, '')}/${event.slug}/index.m3u8`
    const values = {
      event_id: eventId,
      provider: env.get('STREAMING_PROVIDER'),
      ingest_url: env.get('STREAMING_INGEST_URL'),
      stream_key_encrypted: encryption.encrypt(streamKey),
      playback_url: playbackUrl,
      status: 'offline',
      created_at: new Date(),
      updated_at: new Date(),
    }
    await db.table('stream_configurations').insert(values).onConflict('event_id').merge({
      provider: values.provider,
      ingest_url: values.ingest_url,
      stream_key_encrypted: values.stream_key_encrypted,
      playback_url: values.playback_url,
      status: 'offline',
      updated_at: new Date(),
    })
    await db
      .from('events')
      .where('id', eventId)
      .update({ playback_url: playbackUrl, stream_status: 'offline', updated_at: new Date() })
    await this.audit.record({
      userId: actorUserId,
      action: 'stream.configuration_created',
      entityType: 'event',
      entityId: eventId,
      newValues: { provider: values.provider, playbackUrl },
    })
    return {
      eventId,
      provider: values.provider,
      ingestUrl: values.ingest_url,
      streamKey,
      playbackUrl,
      status: 'offline',
    }
  }

  async getAdminConfig(eventId: number) {
    const config = await db.from('stream_configurations').where('event_id', eventId).first()
    if (!config) return null
    return {
      eventId,
      provider: config.provider,
      ingestUrl: config.ingest_url,
      streamKey: encryption.decrypt(config.stream_key_encrypted),
      playbackUrl: config.playback_url,
      status: config.status,
    }
  }
}
