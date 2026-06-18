import { FEATURES } from '../data'

export default function Features() {
  return (
    <section className="features-section">
      <div className="container">
        <div className="text-center">
          <span className="section-badge">💡 Características</span>
          <h2 className="section-title">¿Por qué elegir<br />Técnicos Ya?</h2>
          <p className="section-subtitle">
            Una plataforma construida para la confianza, la velocidad y la transparencia.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon-wrap" style={{ background: f.color }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


