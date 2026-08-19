import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import type Hls from 'hls.js'
import './styles.css'

type User = {
  id: number
  fullName: string | null
  email: string
  status: string
  isBettingEnabled: boolean
}

type Side = { id: number; name: string; code: string; color: string }
type Round = {
  id: number
  round_number: number
  status: string
  betting_status: string
  bettingSides: Side[]
}
type Event = {
  id: number
  name: string
  slug: string
  status: string
  betting_status: string
  stream_status: string
  playback_url: string | null
  location: string | null
  scheduled_at: string | null
  rounds?: Round[]
}
type Wallet = { availableBalance: string; heldBalance: string; totalBalance: string }
type ChatMessage = { name: string; color: string; message: string }

const initialChat: ChatMessage[] = [
  { name: 'ESTEBANR', color: 'gold', message: 'Buena. No me agarra las puestas.' },
  { name: 'AGPAY', color: 'green', message: 'De cuanto estas apostando?' },
  { name: 'AGPAY', color: 'green', message: 'Puntos. A ver cual entra.' },
  { name: 'LOVERA26', color: 'pink', message: 'Me puedes checar mis últimas 2 ganancias?' },
  { name: 'admin', color: 'red', message: 'Échenle señores, ÚLTIMA PELEA!!!!!' },
]

async function api<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.error?.message || 'No se pudo completar la solicitud.')
  }
  return body.data as T
}

function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<User>('/api/v1/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return { user, setUser, loading }
}

function ClientHeader({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <header className="arena-header">
      <Link className="arena-brand" to="/">
        <span className="arena-brand-icon">♟</span>
        <span>ARTE GALLERA</span>
      </Link>
      <div className="arena-account">
        {user ? (
          <>
            <div className="arena-balance">
              <span>SALDO</span>
              <strong>$ 0 MXN</strong>
            </div>
            <span className="arena-greeting">
              Hola, {user.fullName?.split(' ')[0] || 'jugador'}
            </span>
            <span className="arena-avatar">
              {(user.fullName || user.email).slice(0, 1).toUpperCase()}
            </span>
            <button className="arena-logout" onClick={onLogout} type="button">
              Salir
            </button>
          </>
        ) : (
          <Link className="arena-login-link" to="/login">
            Ingresar
          </Link>
        )}
      </div>
    </header>
  )
}

function Home() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    api<Event[]>('/api/v1/events')
      .then(setEvents)
      .catch(() => setEvents([]))
  }, [])

  return (
    <section className="home-page">
      <p className="eyebrow">Transmisiones en vivo</p>
      <h1>Vive cada jornada. Apuesta con control.</h1>
      <p className="hero-copy">
        Entra a un evento, mira la transmisión y participa en las rondas abiertas.
      </p>
      <div className="hero-actions">
        <Link className="button button-primary" to="/eventos">
          Ver eventos
        </Link>
        <Link className="button button-quiet" to="/registro">
          Crear cuenta
        </Link>
      </div>
      <div className="home-events">
        <p className="eyebrow">Agenda</p>
        <h2>Eventos disponibles</h2>
        {events.length ? (
          events.map((event) => (
            <Link className="home-event-card" key={event.id} to={`/eventos/${event.slug}`}>
              <span className={`status-pill ${event.status}`}>{event.status}</span>
              <strong>{event.name}</strong>
              <small>{event.location || 'Transmisión online'}</small>
            </Link>
          ))
        ) : (
          <p className="hero-copy">No hay eventos publicados en este momento.</p>
        )}
      </div>
    </section>
  )
}

function EventList() {
  const [events, setEvents] = useState<Event[]>([])
  useEffect(() => {
    api<Event[]>('/api/v1/events')
      .then(setEvents)
      .catch(() => setEvents([]))
  }, [])
  return (
    <section className="public-page">
      <p className="eyebrow">Agenda pública</p>
      <h1>Eventos disponibles</h1>
      <div className="event-list-grid">
        {events.map((event) => (
          <Link className="home-event-card" key={event.id} to={`/eventos/${event.slug}`}>
            <span className={`status-pill ${event.status}`}>{event.status}</span>
            <strong>{event.name}</strong>
            <small>{event.location || 'Online'}</small>
          </Link>
        ))}
      </div>
    </section>
  )
}

function AuthPage({
  mode,
  onAuthenticated,
}: {
  mode: 'login' | 'register'
  onAuthenticated: (user: User) => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await api<User>(
        mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(
            mode === 'login' ? { email: form.email, password: form.password } : form
          ),
        }
      )
      onAuthenticated(user)
      navigate((location.state as { from?: string } | null)?.from || '/eventos')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-page">
      <p className="eyebrow">Arte Gallera</p>
      <h1>{mode === 'login' ? 'Ingresa para continuar' : 'Crea tu cuenta'}</h1>
      <p className="auth-copy">
        Necesitas una cuenta para entrar a los eventos y realizar apuestas.
      </p>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Nombre completo
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>
        )}
        <label>
          Correo electrónico
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Contraseña
          <input
            required
            minLength={8}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        {mode === 'register' && (
          <label>
            Confirmar contraseña
            <input
              required
              minLength={8}
              type="password"
              value={form.passwordConfirmation}
              onChange={(e) => setForm({ ...form, passwordConfirmation: e.target.value })}
            />
          </label>
        )}
        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary" disabled={busy} type="submit">
          {busy ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Registrarme'}
        </button>
      </form>
      <Link className="text-link" to={mode === 'login' ? '/registro' : '/login'}>
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo una cuenta'}
      </Link>
    </section>
  )
}

function ProtectedRoute({
  user,
  loading,
  children,
}: {
  user: User | null
  loading: boolean
  children: React.ReactNode
}) {
  const location = useLocation()
  if (loading) return <div className="loading-state">Verificando sesión...</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function ChatPanel() {
  const [messages, setMessages] = useState(initialChat)
  const [message, setMessage] = useState('')
  function sendMessage(event: React.FormEvent) {
    event.preventDefault()
    if (!message.trim()) return
    setMessages([...messages, { name: 'TÚ', color: 'gold', message: message.trim() }])
    setMessage('')
  }
  return (
    <aside className="chat-panel">
      <div className="chat-title">
        CHAT <span>EN VIVO</span>
      </div>
      <div className="chat-messages">
        {messages.map((item, index) => (
          <p key={`${item.name}-${index}`}>
            <strong className={item.color}>{item.name}:</strong> {item.message}
          </p>
        ))}
      </div>
      <form className="chat-form" onSubmit={sendMessage}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button aria-label="Enviar mensaje" type="submit">
          ➤
        </button>
      </form>
    </aside>
  )
}

export function HlsVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let hls: Hls | null = null
    let cancelled = false
    const nativeHls =
      video.canPlayType('application/vnd.apple.mpegurl') && 'ManagedMediaSource' in window

    if (nativeHls) {
      video.src = src
    } else {
      import('hls.js').then(({ default: HlsModule }) => {
        if (cancelled) return
        if (HlsModule.isSupported()) {
          hls = new HlsModule()
          hls.loadSource(src)
          hls.attachMedia(video)
        } else {
          video.src = src
        }
      })
    }

    return () => {
      cancelled = true
      hls?.destroy()
      video.removeAttribute('src')
      video.load()
    }
  }, [src])

  return <video ref={videoRef} controls autoPlay playsInline />
}

export function BettingPanel({
  event,
  round,
  wallet,
  onBet,
}: {
  event: Event
  round: Round | undefined
  wallet: Wallet
  onBet: (side: Side, amount: string) => Promise<void>
}) {
  const [selectedSide, setSelectedSide] = useState<Side | null>(null)
  const [amount, setAmount] = useState('')
  const [notice, setNotice] = useState('')
  const open = round?.status === 'betting_open' && round.betting_status === 'open'
  const sides = round?.bettingSides || []
  async function submit() {
    if (!selectedSide || !amount) return setNotice('Selecciona un lado e ingresa un monto.')
    try {
      await onBet(selectedSide, amount)
      setNotice('Apuesta aceptada')
      setAmount('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo aceptar la apuesta.')
    }
  }
  return (
    <aside className="betting-panel">
      <div className={`betting-status ${open ? 'open' : ''}`}>
        {open ? 'APUESTAS ABIERTAS' : 'APUESTAS CERRADAS'}
      </div>
      <div className="side-cards">
        {sides.map((side) => (
          <button
            className={`side-card ${side.color} ${selectedSide?.id === side.id ? 'selected' : ''}`}
            key={side.id}
            disabled={!open}
            onClick={() => setSelectedSide(side)}
            type="button"
          >
            <strong>Apuesta al {side.name}</strong>
            <span>$ {amount || '0'}</span>
            <small>
              {selectedSide?.id === side.id ? 'Seleccionado' : 'Apostar al ' + side.name}
            </small>
          </button>
        ))}
      </div>
      <div className="playing-row">
        <span>JUGANDO</span>
        <strong>$ {wallet.availableBalance}</strong>
      </div>
      <div className="amount-row">
        <button type="button" onClick={() => setAmount('')}>
          Ingresa un monto
        </button>
        <button type="button" onClick={() => setAmount(wallet.availableBalance)}>
          ALL-IN
        </button>
      </div>
      <div className="quick-amounts">
        {['100', '200', '300', '500', '1000', '2000', '3000', '5000', '10000', '20000'].map(
          (value) => (
            <button key={value} type="button" onClick={() => setAmount(value)}>
              {value}
            </button>
          )
        )}
      </div>
      <button
        className="place-bet-button"
        disabled={!open || !selectedSide || !amount}
        onClick={submit}
        type="button"
      >
        CONFIRMAR APUESTA
      </button>
      {notice && <p className="bet-notice">{notice}</p>}
      <p className="wallet-note">Saldo disponible: ${wallet.availableBalance} MXN</p>
      <span className="event-name">{event.name}</span>
    </aside>
  )
}

function EventRoom({ user }: { user: User }) {
  const { slug } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [wallet, setWallet] = useState<Wallet>({
    availableBalance: '0.00',
    heldBalance: '0.00',
    totalBalance: '0.00',
  })
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api<Event>(`/api/v1/events/${slug}`), api<Wallet>('/api/v1/wallet')])
      .then(([loadedEvent, loadedWallet]) => {
        setEvent(loadedEvent)
        setWallet(loadedWallet)
      })
      .catch((requestError) =>
        setError(
          requestError instanceof Error ? requestError.message : 'No se pudo cargar el evento.'
        )
      )
  }, [slug])
  if (error) return <div className="loading-state">{error}</div>
  if (!event) return <div className="loading-state">Cargando evento...</div>
  const currentEvent = event
  const round =
    event.rounds?.find(
      (candidate) => candidate.status === 'betting_open' || candidate.status === 'in_progress'
    ) || event.rounds?.[event.rounds.length - 1]
  async function placeBet(side: Side, amount: string) {
    if (!round) throw new Error('No hay una ronda disponible para apostar.')
    await api(`/api/v1/events/${currentEvent.id}/rounds/${round.id}/bets`, {
      method: 'POST',
      body: JSON.stringify({
        bettingSideId: side.id,
        amount,
        idempotencyKey: window.crypto.randomUUID(),
      }),
    })
    setWallet(await api<Wallet>('/api/v1/wallet'))
  }
  return (
    <section className="arena-room">
      <BettingPanel event={event} round={round} wallet={wallet} onBet={placeBet} />
      <main className="stream-panel">
        <div className="stream-heading">
          <h1>"{event.name}"</h1>
          <span>
            ♟ 236
            <br />
            <small>espectadores</small>
          </span>
        </div>
        <div className="video-frame">
          {event.playback_url ? (
            <HlsVideo src={event.playback_url} />
          ) : (
            <p>La transmisión estará disponible cuando el operador inicie el evento.</p>
          )}
        </div>
        <div className="round-strip">
          <span>RONDA ACTUAL</span>
          <strong>{round ? `Ronda ${round.round_number}` : 'Esperando ronda'}</strong>
          <em>{round?.status || 'pending'}</em>
        </div>
      </main>
      <ChatPanel />
      <p className="room-user-note">Sesión activa: {user.email}</p>
    </section>
  )
}

function App() {
  const { user, setUser, loading } = useCurrentUser()
  async function logout() {
    await api('/api/v1/auth/logout', { method: 'POST' }).catch(() => undefined)
    setUser(null)
  }
  return (
    <div className="client-shell">
      <ClientHeader user={user} onLogout={logout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eventos" element={<EventList />} />
        <Route path="/login" element={<AuthPage mode="login" onAuthenticated={setUser} />} />
        <Route path="/registro" element={<AuthPage mode="register" onAuthenticated={setUser} />} />
        <Route
          path="/eventos/:slug"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <EventRoom user={user!} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="client-footer">
        <span>Arte Gallera</span>
        <span>Juego responsable y operaciones transparentes.</span>
      </footer>
    </div>
  )
}

const root = document.getElementById('client-app')
if (root)
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  )
