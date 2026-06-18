import { CATEGORIES } from '../data'

export default function Categories() {
  return (
    <section className="categories-section" id="categorias">
      <div className="container">
        <div className="text-center">
          <span className="section-badge">🛠️ Servicios</span>
          <h2 className="section-title">Todo lo que necesitas,<br />en un solo lugar</h2>
          <p className="section-subtitle">
            12 categorías de servicios con técnicos especializados disponibles para ti.
          </p>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <a href="#contacto" className="category-card" key={cat.name}>
              <span className="category-emoji">{cat.emoji}</span>
              <div className="category-name">{cat.name}</div>
              <div className="category-desc">{cat.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}


