#!/usr/bin/env node
/**
 * Monitor de salud para cron/sistema: verifica la API, la BD, Redis y el
 * stream HLS de MediaMTX. Sale con código 0 si todo está bien y 1 si algo falla.
 *
 * Uso:
 *   node scripts/monitor.mjs                 # comprobación única
 *   node scripts/monitor.mjs --stream http://localhost:8888/live   # además valida HLS
 *
 * La salida es JSON (una línea) y un resumen legible en stderr.
 */

const BASE = process.env.APP_URL || 'http://localhost:3333'
const STREAM_URL = process.argv.find((a) => a.startsWith('--stream='))?.split('=')[1]

const results = {}
const start = Date.now()

async function check(name, fn) {
  const began = Date.now()
  try {
    const ok = await fn()
    results[name] = { ok, latencyMs: Date.now() - began }
  } catch (error) {
    results[name] = { ok: false, error: error.message, latencyMs: Date.now() - began }
  }
}

async function getJson(path, timeout = 5000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(`${BASE}${path}`, { signal: controller.signal })
    const body = await response.json().catch(() => ({}))
    return { status: response.status, body }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  await check('health', async () => (await getJson('/health')).status === 200)

  await check('ready', async () => {
    const { status, body } = await getJson('/ready')
    return status === 200 && body.checks?.postgres && body.checks?.redis
  })

  await check('metrics', async () => {
    const { status, body } = await getJson('/metrics')
    return status === 200 && body.status === 'ok'
  })

  if (STREAM_URL) {
    await check('stream_hls', async () => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      try {
        const response = await fetch(STREAM_URL, { signal: controller.signal })
        return response.status === 200
      } finally {
        clearTimeout(timer)
      }
    })
  }

  const ok = Object.values(results).every((r) => r.ok)
  const report = {
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - start,
    healthy: ok,
    checks: results,
  }
  console.log(JSON.stringify(report, null, 2))
  if (!ok) {
    console.error(`[monitor] ERROR: ${Object.entries(results).filter(([, r]) => !r.ok).map(([k]) => k).join(', ')}`)
    process.exit(1)
  }
  console.error(`[monitor] OK: todas las comprobaciones pasaron.`)
}

main()