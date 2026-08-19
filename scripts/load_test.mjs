#!/usr/bin/env node
/**
 * Prueba de carga ligera (sin dependencias) contra una instancia en ejecución.
 *
 * Flujo:
 *  1. Sesión de administrador (crea evento, lo programa, abre una ronda).
 *  2. Registra N usuarios y los fondea mediante el ajuste admin.
 *  3. Dispara B apuestas concurrentes + lecturas de eventos y wallets.
 *  4. (Opcional) cierra y liquida la ronda para verificar conciliación.
 *
 * Uso:
 *  node scripts/load_test.mjs [--url http://localhost:3333] [--bets 200] [--users 4] [--concurrency 10] [--settle]
 */

const args = new Map()
for (let i = 2; i < process.argv.length; i++) {
  const value = process.argv[i]
  if (value.startsWith('--')) {
    const key = value.slice(2)
    const next = process.argv[i + 1]
    if (next && !next.startsWith('--')) {
      args.set(key, next)
      i++
    } else {
      args.set(key, true)
    }
  }
}

const BASE = args.get('url') || 'http://localhost:3333'
const TOTAL_BETS = Number(args.get('bets') || 200)
const USERS = Number(args.get('users') || 4)
const CONCURRENCY = Number(args.get('concurrency') || 10)
const SETTLE = args.has('settle')

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@artegallera.test'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

import { readFileSync } from 'node:fs'

function readEnv(file = '.env') {
  try {
    const fs = { readFileSync }
    return fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .reduce((acc, line) => {
        const match = line.match(/^([A-Z_]+)=(.*)$/)
        if (match) acc[match[1]] = match[2].replace(/^"|"$/g, '')
        return acc
      }, {})
  } catch {
    return {}
  }
}

class Jar {
  constructor() {
    this.values = new Map()
  }
  apply(setCookies = []) {
    for (const setCookie of setCookies) {
      const pair = setCookie.split(';', 1)[0]
      const index = pair.indexOf('=')
      this.values.set(pair.slice(0, index).trim(), pair.slice(index + 1))
    }
  }
  get(name) {
    return this.values.get(name)
  }
  header() {
    return [...this.values.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }
}

async function request(path, { method = 'GET', jar, json, form, xsrf } = {}) {
  const headers = {}
  if (jar) headers.cookie = jar.header()
  if (xsrf) headers['x-xsrf-token'] = xsrf
  if (json) {
    headers['content-type'] = 'application/json'
  } else if (form) {
    headers['content-type'] = 'application/x-www-form-urlencoded'
  }
  const body = json ? JSON.stringify(json) : form ? new URLSearchParams(form).toString() : undefined
  const started = performance.now()
  const response = await fetch(`${BASE}${path}`, { method, headers, body, redirect: 'manual' })
  if (jar) jar.apply(response.headers.getSetCookie())
  let data = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  } else {
    await response.arrayBuffer().catch(() => null)
  }
  return { status: response.status, data, latency: performance.now() - started, jar }
}

function now() {
  return new Date().toISOString()
}

async function main() {
  const env = readEnv()
  const adminEmail = process.env.ADMIN_EMAIL || env.ADMIN_EMAIL || ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD || ADMIN_PASSWORD
  if (!adminPassword) {
    console.error('Falta ADMIN_PASSWORD en .env o env.')
    process.exit(1)
  }

  console.log(`[${now()}] Iniciando prueba de carga en ${BASE}`)
  console.log(`[${now()}] apuestas=${TOTAL_BETS} usuarios=${USERS} concurrencia=${CONCURRENCY} settle=${SETTLE}`)

  /* ---- Sesión de administrador ---- */
  const adminJar = new Jar()
  await request('/login', { jar: adminJar })
  const xsrf = adminJar.get('XSRF-TOKEN')
  const login = await request('/login', {
    method: 'POST',
    jar: adminJar,
    xsrf,
    form: { email: adminEmail, password: adminPassword },
  })
  if (login.status !== 302) {
    console.error(`[${now()}] Login de administrador falló (${login.status}).`)
    process.exit(1)
  }
  console.log(`[${now()}] Administrador autenticado`)

  const api = async (path, options) =>
    request(path, { ...options, jar: adminJar, xsrf: adminJar.get('XSRF-TOKEN') })

  /* ---- Setup: evento + ronda abierta ---- */
  const eventName = `Carga ${Date.now()}`
  const created = await api('/api/v1/admin/events', {
    method: 'POST',
    json: { name: eventName },
  })
  if (created.status !== 201) throw new Error(`Crear evento: ${created.status}`)
  const eventId = created.data.data.id
  await api(`/api/v1/admin/events/${eventId}/state/scheduled`, { method: 'POST' })
  await api(`/api/v1/admin/events/${eventId}/state/live`, { method: 'POST' })
  const round = await api(`/api/v1/admin/events/${eventId}/rounds`, {
    method: 'POST',
    json: { roundNumber: 1 },
  })
  const roundId = round.data.data.id
  await api(`/api/v1/admin/events/rounds/${roundId}/state/betting_open`, { method: 'POST' })

  const eventSlug = created.data.data.slug
  const shown = await request(`/api/v1/events/${eventSlug}`)
  const openRound = shown.data.data.rounds.find((r) => r.id === roundId)
  const sides = openRound.bettingSides.map((s) => s.id)
  console.log(`[${now()}] Evento #${eventId}, ronda #${roundId} abierta a apuestas (lados ${sides.join(', ')})`)

  /* ---- Usuarios + fondeo ---- */
  const bettors = []
  for (let i = 0; i < USERS; i++) {
    const email = `load-${Date.now()}-${i}@example.com`
    const jar = new Jar()
    const registered = await request('/api/v1/auth/register', {
      method: 'POST',
      jar,
      json: {
        fullName: `Carga ${i}`,
        email,
        password: 'Secreta123!',
        passwordConfirmation: 'Secreta123!',
      },
    })
    if (registered.status !== 201) throw new Error(`Registrar usuario: ${registered.status}`)
    const userId = registered.data.data.id
    const adjusted = await api('/api/v1/admin/wallets/adjust', {
      method: 'POST',
      json: {
        userId,
        amount: '1000.00',
        direction: 'credit',
        idempotencyKey: `load-fund-${userId}-${Date.now()}`,
        description: 'fondeo de prueba de carga',
      },
    })
    if (adjusted.status !== 200) throw new Error(`Fondear usuario: ${adjusted.status}`)
    bettors.push({ email, jar, userId })
  }
  console.log(`[${now()}] ${USERS} usuarios registrados y fondeados`)

  /* ---- Carga: apuestas + lecturas ---- */
  const betsPerUser = Math.max(1, Math.floor(TOTAL_BETS / USERS))
  const jobs = []
  for (const bettor of bettors) {
    for (let i = 0; i < betsPerUser; i++) {
      jobs.push({ kind: 'bet', bettor })
    }
  }
  // Lecturas: una por cada 4 apuestas, distribuidas entre eventos y wallets
  for (let i = 0; i < Math.floor(jobs.length / 4); i++) {
    const bettor = bettors[i % bettors.length]
    jobs.push({ kind: i % 2 === 0 ? 'events' : 'wallet', bettor })
  }

  const results = { bet: [], events: [], wallet: [] }
  let cursor = 0
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++]
      const t0 = performance.now()
      let status
      try {
        if (job.kind === 'bet') {
          const side = sides[Math.floor(Math.random() * sides.length)]
          const response = await request(
            `/api/v1/events/${eventId}/rounds/${roundId}/bets`,
            {
              method: 'POST',
              jar: job.bettor.jar,
              json: { bettingSideId: side, amount: '1.00', idempotencyKey: `load-${Date.now()}-${job.bettor.userId}-${cursor}` },
            }
          )
          status = response.status
        } else if (job.kind === 'events') {
          status = (await request('/api/v1/events')).status
        } else {
          status = (await request('/api/v1/wallet', { jar: job.bettor.jar })).status
        }
      } catch {
        status = 0
      }
      results[job.kind].push({ status, latency: performance.now() - t0 })
    }
  })
  await Promise.all(workers)

  /* ---- Reporte ---- */
  const report = (name, samples) => {
    const latencies = samples.map((s) => s.latency).sort((a, b) => a - b)
    const ok = samples.filter((s) => s.status >= 200 && s.status < 300).length
    const errors = samples.length - ok
    const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0
    console.log(
      `[${now()}] ${name}: ${samples.length} req, ok=${ok}, err=${errors}, RPS=${(samples.length / (avg || 1) * 1000).toFixed(1)}, avg=${avg.toFixed(1)}ms, p95=${p95.toFixed(1)}ms`
    )
    return { total: samples.length, ok, errors }
  }
  const betReport = report('apuestas', results.bet)
  report('lectura eventos', results.events)
  report('lectura wallets', results.wallet)

  const statusCounts = {}
  for (const sample of [...results.bet, ...results.events, ...results.wallet]) {
    statusCounts[sample.status] = (statusCounts[sample.status] || 0) + 1
  }
  console.log(`[${now()}] Distribución de estados HTTP: ${JSON.stringify(statusCounts)}`)

  /* ---- (Opcional) liquidación y conciliación ---- */
  if (SETTLE) {
    await api(`/api/v1/admin/events/rounds/${roundId}/state/betting_closed`, { method: 'POST' })
    await api(`/api/v1/admin/events/rounds/${roundId}/state/in_progress`, { method: 'POST' })
    await api(`/api/v1/admin/events/rounds/${roundId}/state/settling`, {
      method: 'POST',
      json: { winningSideId: sides[Math.floor(Math.random() * sides.length)] },
    })
    const settled = await api(`/api/v1/admin/rounds/${roundId}/settle`, { method: 'POST' })
    if (settled.status === 200) {
      const result = settled.data.data
      console.log(
        `[${now()}] Liquidación: pool=${result.total_pool}, premios=${result.total_payout}, ganadores=${result.total_winners}, comisión=${result.house_commission}`
      )
      const expectedPool = betReport.ok * 1
      console.log(
        `[${now()}] Conciliación: pool esperado=${expectedPool.toFixed(2)} vs pool real=${result.total_pool} (${
          Number(result.total_pool) === expectedPool ? 'OK' : 'REVISAR'
        })`
      )
    } else {
      console.warn(`[${now()}] Liquidación respondió ${settled.status}`)
    }
  }

  console.log(`[${now()}] Fin de la prueba. Evento #${eventId} (${eventName}).`)
}

main().catch((error) => {
  console.error(`[${now()}] Error:`, error)
  process.exit(1)
})