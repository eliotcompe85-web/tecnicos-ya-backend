import { HOW_IT_WORKS } from '../data'

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="como-funciona">
      <div className="container">
        <div className="text-center">
          <span className="section-badge">📋 Proceso</span>
          <h2 className="section-title">Tan fácil como 1, 2, 3</h2>
          <p className="section-subtitle">
            En minutos conectamos tu necesidad con el técnico ideal para resolverla.
          </p>
        </div>
        <div className="steps-grid">
          {HOW_IT_WORKS.map((step) => (
            <div className="step-card" key={step.n}>
              <div className="step-number">{step.n}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


