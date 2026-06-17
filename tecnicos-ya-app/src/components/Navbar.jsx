import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <a href="#" className="navbar-logo">
          <div className="navbar-logo-icon">🔧</div>
          <span className="navbar-logo-text">
            Técnicos<span> Ya</span>
          </span>
        </a>

        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú de navegación"
        >
          <span /><span /><span />
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><a href="#como-funciona" onClick={() => setMenuOpen(false)}>¿Cómo funciona?</a></li>
          <li><a href="#categorias" onClick={() => setMenuOpen(false)}>Servicios</a></li>
          <li><a href="#precios" onClick={() => setMenuOpen(false)}>Precios</a></li>
          <li><a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a></li>
          <li className="navbar-links-mobile-cta">
            <a href="#contacto" className="btn btn-secondary" onClick={() => setMenuOpen(false)}>Iniciar Sesión</a>
            <a href="#contacto" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Comenzar gratis</a>
          </li>
        </ul>

        <div className="navbar-cta">
          <a href="#contacto" className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '14px' }}>
            Iniciar Sesión
          </a>
          <a href="#contacto" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
            Comenzar gratis
          </a>
        </div>
      </div>
    </nav>
  )
}
