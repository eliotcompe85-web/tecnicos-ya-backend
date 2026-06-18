import { CATEGORIES, CONTACT_INFO } from '../data'

export default function ContactForm({ formRef, sending, selectedType, onTypeChange, onSubmit }) {
  return (
    <section className="contact-section" id="contacto">
      <div className="container">
        <div>
          <span className="section-badge">📬 Contacto</span>
          <h2 className="section-title">¿Necesitas un servicio?</h2>
          <p className="section-subtitle">
            Completa el formulario y te conectamos con el técnico ideal en minutos.
          </p>
        </div>
        <div className="contact-grid">
          <div className="contact-info">
            {CONTACT_INFO.map((item) => (
              <div className="contact-item" key={item.title}>
                <div className="contact-item-icon">{item.icon}</div>
                <div>
                  <div className="contact-item-title" dangerouslySetInnerHTML={{ __html: item.title }} />
                  <div className="contact-item-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="contact-form">
            <form ref={formRef} onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input type="text" name="nombre" className="form-input" placeholder="Tu nombre completo" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input type="tel" name="telefono" className="form-input" placeholder="+56 9 1234 5678" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-input" placeholder="tu@email.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de servicio</label>
                <select
                  name="servicio"
                  className="form-input form-select"
                  required
                  value={selectedType}
                  onChange={(e) => onTypeChange(e.target.value)}
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción del problema</label>
                <textarea name="mensaje" className="form-input" placeholder="Describe qué necesitas reparar o instalar..." required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={sending}>
                {sending ? '⏳ Enviando...' : '🚀 Solicitar Técnico'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}


