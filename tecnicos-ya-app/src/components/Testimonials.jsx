import { TESTIMONIALS } from '../data'

export default function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="text-center">
          <span className="section-badge">💬 Testimonios</span>
          <h2 className="section-title">Lo que dicen<br />nuestros usuarios</h2>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div className="testimonial-card" key={t.name}>
              <div className="testimonial-stars">{t.stars}</div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: t.bg }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


