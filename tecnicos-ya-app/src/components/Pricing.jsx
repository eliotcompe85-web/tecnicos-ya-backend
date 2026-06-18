import { PRICING_PLANS } from '../data'

export default function Pricing() {
  return (
    <section className="pricing-section" id="precios">
      <div className="container">
        <div className="text-center">
          <span className="section-badge">💳 Planes</span>
          <h2 className="section-title">Membresía para Técnicos</h2>
          <p className="section-subtitle">
            Empieza gratis y escala cuando estés listo. Primer mes sin costo.
          </p>
        </div>
        <div className="pricing-grid">
          {PRICING_PLANS.map((plan) => (
            <div className={`pricing-card ${plan.isFeatured ? 'featured' : ''}`} key={plan.name}>
              {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
              <div className="pricing-plan">{plan.name}</div>
              <div className="pricing-price">${plan.price}<span>/mes</span></div>
              <div className="pricing-period">{plan.period}</div>
              <div className="pricing-divider" />
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f.text} className={f.included ? '' : 'disabled'}>{f.text}</li>
                ))}
              </ul>
              <a href="#contacto" className={`btn ${plan.btnClass}`} style={{ width: '100%', justifyContent: 'center' }}>
                {plan.btnText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


