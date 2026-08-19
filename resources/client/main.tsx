import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './styles.css'

function Home() {
  return (
    <>
      <section className="client-hero">
        <p className="eyebrow">Transmisiones en vivo</p>
        <h1>Vive cada jornada. Apuesta con control.</h1>
        <p className="hero-copy">
          Encuentra los próximos eventos, sigue la transmisión y participa en
          cada ronda desde un solo lugar.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/eventos">Ver eventos</Link>
          <Link className="button button-quiet" to="/registro">Crear cuenta</Link>
        </div>
      </section>
      <section className="event-preview" aria-labelledby="featured-title">
        <p className="eyebrow">Agenda</p>
        <h2 id="featured-title">Próximamente en vivo</h2>
        <div className="event-card">
          <div className="event-card-art" aria-hidden="true">AG</div>
          <div className="event-card-content">
            <span className="status-pill">Próximo evento</span>
            <h3>La jornada comienza pronto</h3>
            <p>Los eventos disponibles aparecerán aquí.</p>
            <Link to="/eventos">Explorar agenda <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <section className="placeholder-page">
      <p className="eyebrow">Arte Gallera</p>
      <h1>{title}</h1>
      <p>Esta sección se conectará con la API de AdonisJS en la siguiente fase.</p>
      <Link className="button button-primary" to="/">Volver al inicio</Link>
    </section>
  )
}

function App() {
  return (
    <div className="client-shell">
      <header className="client-header">
        <Link className="brand" to="/" aria-label="Arte Gallera, inicio">
          <span className="brand-mark">AG</span>
          <span>Arte Gallera</span>
        </Link>
        <nav aria-label="Navegación principal">
          <Link to="/eventos">Eventos</Link>
          <Link className="nav-login" to="/login">Ingresar</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/eventos" element={<Placeholder title="Eventos en vivo" />} />
          <Route path="/login" element={<Placeholder title="Ingresa a tu cuenta" />} />
          <Route path="/registro" element={<Placeholder title="Crea tu cuenta" />} />
          <Route path="*" element={<Placeholder title="Página no encontrada" />} />
        </Routes>
      </main>
      <footer className="client-footer">
        <span>Arte Gallera</span>
        <span>Juego responsable y operaciones transparentes.</span>
      </footer>
    </div>
  )
}

const root = document.getElementById('client-app')

if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}
