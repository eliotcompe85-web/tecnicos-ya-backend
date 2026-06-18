export default function Hero() {
  const stats = [
    { value: '2.400+', label: 'Técnicos activos' },
    { value: '98%', label: 'Satisfacción' },
    { value: '<30min', label: 'Tiempo respuesta' },
  ]

  const phoneCards = [
    { emoji: '⚡', name: 'Carlos Méndez', detail: 'Electricista · 2.3 km · ⭐ 4.9', badge: 'Disponible', badgeClass: 'badge-available', bg: 'rgba(59,130,246,0.15)' },
    { emoji: '🔧', name: 'Ana Rojas', detail: 'Gasfiter · 4.1 km · ⭐ 4.8', badge: 'Premium', badgeClass: 'badge-premium', bg: 'rgba(245,158,11,0.15)' },
    { emoji: '🔩', name: 'Luis Torres', detail: 'Mecánico · 5.8 km · ⭐ 4.7', badge: 'Agendando', badgeClass: 'badge-busy', bg: 'rgba(139,92,246,0.15)' },
  ]

  return (
    <section className="hero" id="inicio">
      <div className="hero-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="hero-grid" />
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Plataforma N°1 en Chile
            </div>
            <h1 className="hero-title">
              Técnicos expertos<br />
              a un <span className="accent-text">clic</span> de<br />
              <span className="gradient-text">distancia</span>
            </h1>
            <p className="hero-subtitle">
              Conectamos clientes con técnicos verificados en tu ciudad.
              Electricistas, gasfiteros, mecánicos y más — disponibles
              ahora mismo, con precios transparentes y pago seguro.
            </p>
            <div className="hero-actions">
              <a href="#contacto" className="btn btn-primary btn-lg">
                Solicitar un Técnico
              </a>
              <a href="#como-funciona" className="btn btn-secondary btn-lg">
                Ver cómo funciona
              </a>
            </div>
            <div className="hero-stats">
              {stats.map((s) => (
                <div className="stat-item" key={s.label}>
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="phone-header">
                  <div className="phone-header-title">🔧 Técnicos Ya</div>
                  <div className="phone-header-subtitle">3 técnicos disponibles cerca</div>
                </div>
                <div className="phone-cards">
                  {phoneCards.map((card) => (
                    <div className="phone-card" key={card.name}>
                      <div className="phone-card-icon" style={{ background: card.bg }}>{card.emoji}</div>
                      <div className="phone-card-info">
                        <div className="phone-card-name">{card.name}</div>
                        <div className="phone-card-detail">{card.detail}</div>
                      </div>
                      <span className={`phone-card-badge ${card.badgeClass}`}>{card.badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <div className="trust-strip">
          <div className="container">
            <div className="trust-inner">
              {[
                { icon: '✅', text: 'Técnicos verificados' },
                { icon: '🔒', text: 'Pagos seguros' },
                { icon: '📍', text: 'Precio por distancia' },
                { icon: '⭐', text: 'Calificaciones reales' },
                { icon: '🔔', text: 'Notificaciones al instante' },
              ].map((item) => (
                <div className="trust-item" key={item.text}>
                  <span className="trust-item-icon">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


