export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#" className="navbar-logo" style={{ textDecoration: 'none' }}>
              <div className="navbar-logo-icon">🔧</div>
              <span className="navbar-logo-text">
                Técnicos<span> Ya</span>
              </span>
            </a>
            <p className="footer-brand-desc">
              La plataforma líder en Chile que conecta clientes con técnicos
              profesionales verificados. Rápido, seguro y transparente.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Plataforma</div>
            <ul className="footer-links">
              <li><a href="#como-funciona">¿Cómo funciona?</a></li>
              <li><a href="#categorias">Servicios</a></li>
              <li><a href="#precios">Precios</a></li>
              <li><a href="#contacto">Contacto</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Para Técnicos</div>
            <ul className="footer-links">
              <li><a href="#precios">Planes de membresía</a></li>
              <li><a href="#contacto">Unirse como técnico</a></li>
              <li><a href="#contacto">Centro de ayuda</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Empresa</div>
            <ul className="footer-links">
              <li><a href="#contacto">Sobre nosotros</a></li>
              <li><a href="#contacto">Blog</a></li>
              <li><a href="#contacto">Carreras</a></li>
              <li><a href="#contacto">Prensa</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© {year} Técnicos Ya. Todos los derechos reservados.</span>
          <div className="footer-legal">
            <a href="#contacto">Privacidad</a>
            <a href="#contacto">Términos</a>
            <a href="#contacto">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}


