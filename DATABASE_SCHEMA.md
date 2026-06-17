# 🗄️ Esquema de Base de Datos

## Descripción General

Base de datos SQLite con 7 tablas relacionadas que forman el núcleo de la aplicación Técnicos Ya.

## Diagrama de Relaciones

```
┌─────────────┐
│   users     │
├─────────────┤
│ id (PK)     │
│ email       │
│ password    │
│ full_name   │
│ phone       │
│ role        │
│ rating_avg  │
│ rating_count│
└──────┬──────┘
       │
       ├─────────────────────────────────────────┐
       │                                         │
       │                              ┌──────────────────┐
       ▼                              │  technician_     │
┌──────────────────┐                 │  profiles        │
│ service_requests │                 ├──────────────────┤
├──────────────────┤                 │ id (PK)          │
│ id (PK)          │                 │ user_id (FK)     │
│ client_id (FK)   │                 │ category_ids     │
│ category_id (FK) │                 │ description      │
│ title            │                 │ experience_years │
│ description      │                 │ certifications   │
│ address          │                 │ portfolio_images │
│ location         │                 │ availability     │
│ status           │                 │ membership_type  │
│ budget_min       │                 │ location         │
│ budget_max       │                 │ created_at       │
│ created_at       │                 └──────────────────┘
└─────────┬────────┘
          │
          ▼
    ┌──────────────┐
    │ applications │
    ├──────────────┤
    │ id (PK)      │
    │ sr_id (FK)   │
    │ tech_id (FK) │
    │ message      │
    │ price        │
    │ status       │
    │ created_at   │
    └────┬─────────┘
         │
         ▼
    ┌────────────┐
    │   visits   │
    ├────────────┤
    │ id (PK)    │
    │ app_id(FK) │
    │ tech_id(FK)│
    │ client_id  │
    │ status     │
    │ lat_cliente│
    │ lng_cliente│
    │ created_at │
    └────┬───────┘
         │
         ▼
    ┌────────────┐
    │  reviews   │
    ├────────────┤
    │ id (PK)    │
    │ visit_id   │
    │ reviewer_id│
    │ reviewee_id│
    │ rating     │
    │ comment    │
    │ created_at │
    └────────────┘

┌──────────────┐
│  categories  │
├──────────────┤
│ id (PK)      │
│ name         │
│ created_at   │
└──────────────┘
```

## Tablas Detalladas

### 1. users

Tabla de usuarios. Clientes y técnicos en la misma tabla con role diferenciador.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    phone VARCHAR,
    role VARCHAR NOT NULL,  -- 'client' | 'technician'
    rating_avg FLOAT DEFAULT NULL,  -- Promedio de reseñas
    rating_count INTEGER DEFAULT 0,  -- Cantidad de reseñas
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Ejemplo de datos:**
```
id  | email              | full_name      | phone        | role        | rating_avg | rating_count
1   | cliente@test.com   | Juan Cliente   | +56912345678 | client      | 4.5        | 12
2   | tecnico@test.com   | Carlos Técnico | +56987654321 | technician  | 4.8        | 25
3   | otro@ejemplo.com   | María Otra     | +56912349999 | client      | NULL       | 0
```

**Índices:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

---

### 2. categories

Categorías de servicios técnicos.

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Datos iniciales:**
```
id | name
1  | Plomería
2  | Electricidad
3  | Gasfitería
4  | Carpintería
5  | Aire Acondicionado
```

---

### 3. technician_profiles

Perfiles extendidos de técnicos (solo para usuarios con role='technician').

```sql
CREATE TABLE technician_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    category_ids TEXT DEFAULT '[]',  -- JSON array: [1, 2, 3]
    description TEXT,
    experience_years INTEGER,
    certifications TEXT DEFAULT '[]',  -- JSON array: ["Cert1", "Cert2"]
    portfolio_images TEXT DEFAULT '[]',  -- JSON array: ["url1", "url2"]
    availability_status VARCHAR DEFAULT 'unavailable',  -- 'available' | 'scheduling' | 'unavailable'
    membership_type VARCHAR DEFAULT 'none',  -- 'none' | 'basic' | 'premium'
    location TEXT DEFAULT NULL,  -- GeoJSON: {"type": "Point", "coordinates": [...]}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Ejemplo de datos:**
```
id | user_id | category_ids | description              | experience_years | availability_status | membership_type | location
1  | 2       | [1, 2]       | 10 años de experiencia   | 10               | available           | premium         | {"type":"Point","coordinates":[-33.8688,-51.2093]}
```

**Campos JSON:**
- `category_ids`: Array de IDs de categorías en las que el técnico es especialista
- `certifications`: Array de nombres de certificaciones
- `portfolio_images`: Array de URLs de imágenes del portfolio
- `location`: GeoJSON Point con coordenadas [longitud, latitud]

---

### 4. service_requests

Solicitudes de servicio creadas por clientes.

```sql
CREATE TABLE service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    address VARCHAR NOT NULL,
    location TEXT DEFAULT NULL,  -- GeoJSON Point
    status VARCHAR DEFAULT 'open',  -- 'open' | 'in_progress' | 'completed' | 'cancelled'
    budget_min FLOAT,
    budget_max FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

**Ejemplo de datos:**
```
id | client_id | category_id | title           | description              | address                    | status | budget_min | budget_max
10 | 1         | 1           | Reparar tubería | Fuga en la cocina        | Av. Providencia 1234       | open   | 20000      | 50000
11 | 1         | 2           | Instalar foco   | 3 focos en sala y dormit  | Av. Providencia 1234       | open   | 15000      | 30000
```

**Índices:**
```sql
CREATE INDEX idx_service_requests_client_id ON service_requests(client_id);
CREATE INDEX idx_service_requests_category_id ON service_requests(category_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
```

---

### 5. applications

Aplicaciones/postulaciones de técnicos a solicitudes de servicio.

```sql
CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_request_id INTEGER NOT NULL,
    technician_id INTEGER NOT NULL,
    message TEXT,
    proposed_price FLOAT NOT NULL,
    status VARCHAR DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Ejemplo de datos:**
```
id | service_request_id | technician_id | message                                | proposed_price | status  | created_at
15 | 10                 | 2             | Tengo experiencia, lo haré en 2 horas  | 35000          | pending | 2026-06-15 10:35:00
16 | 10                 | 3             | Puedo hacerlo mañana                   | 30000          | pending | 2026-06-15 10:40:00
```

**Índices:**
```sql
CREATE INDEX idx_applications_sr_id ON applications(service_request_id);
CREATE INDEX idx_applications_tech_id ON applications(technician_id);
CREATE INDEX idx_applications_status ON applications(status);
```

---

### 6. visits

Registro de visitas (se crean cuando un cliente acepta una aplicación).

```sql
CREATE TABLE visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER,
    technician_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    status VARCHAR DEFAULT 'scheduled',  -- 'scheduled' | 'completed' | 'cancelled'
    latitud_cliente FLOAT,
    longitud_cliente FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Ejemplo de datos:**
```
id | application_id | technician_id | client_id | status    | latitud_cliente | longitud_cliente | created_at
8  | 15             | 2             | 1         | scheduled | -33.8688        | -51.2093         | 2026-06-15 11:00:00
```

**Índices:**
```sql
CREATE INDEX idx_visits_technician_id ON visits(technician_id);
CREATE INDEX idx_visits_client_id ON visits(client_id);
CREATE INDEX idx_visits_status ON visits(status);
```

---

### 7. reviews

Reseñas y calificaciones entre usuarios después de completar una visita.

```sql
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL UNIQUE,
    reviewer_id INTEGER NOT NULL,  -- Quien deja la reseña
    reviewee_id INTEGER NOT NULL,  -- Quien recibe la reseña
    rating INTEGER NOT NULL,  -- 1-5 estrellas
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Ejemplo de datos:**
```
id | visit_id | reviewer_id | reviewee_id | rating | comment                    | created_at
5  | 8        | 1           | 2           | 5      | Excelente trabajo!         | 2026-06-15 15:45:00
6  | 8        | 2           | 1           | 4      | Cliente amable y receptivo  | 2026-06-15 15:50:00
```

**Índices:**
```sql
CREATE INDEX idx_reviews_visit_id ON reviews(visit_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
```

---

## Flujos de Datos

### Flujo: Cliente crea solicitud → Técnico se postula → Cliente acepta

```
1. Cliente crea service_request
   ↓
2. Técnico ve solicitud en búsqueda
   ↓
3. Técnico crea application
   ↓
4. Cliente ve applications en request-detail
   ↓
5. Cliente acepta application (status='accepted')
   ↓
6. Sistema crea visit automáticamente
   ↓
7. Técnico confirma visit (status='completed')
   ↓
8. Cliente y Técnico crean reviews mutuamente
   ↓
9. Sistema actualiza rating_avg y rating_count en users
```

### Flujo: Rating automático

Cuando se crea una reseña:

```python
# En backend/server.py
review = Review(
    visit_id=1,
    reviewer_id=2,
    reviewee_id=3,
    rating=5,
    comment="Excelente"
)
db.add(review)
db.commit()

# Actualizar rating del reviewee
reviewee = db.query(User).filter_by(id=3).first()
reviews_count = db.query(Review).filter_by(reviewee_id=3).count()
reviews_avg = db.query(Review).filter_by(reviewee_id=3).with_entities(
    func.avg(Review.rating)
).scalar()

reviewee.rating_count = reviews_count
reviewee.rating_avg = float(reviews_avg) if reviews_avg else None
db.commit()
```

---

## Queries Útiles para Debugging

### Ver datos de usuarios

```sql
SELECT u.id, u.email, u.full_name, u.role, u.rating_avg, u.rating_count
FROM users u
ORDER BY u.created_at DESC;
```

### Ver solicitudes abiertas de un cliente

```sql
SELECT sr.id, sr.title, sr.status, COUNT(a.id) as applications_count
FROM service_requests sr
LEFT JOIN applications a ON sr.id = a.service_request_id
WHERE sr.client_id = 1
GROUP BY sr.id
ORDER BY sr.created_at DESC;
```

### Ver postulaciones de un técnico

```sql
SELECT a.id, sr.title, a.proposed_price, a.status, a.created_at
FROM applications a
JOIN service_requests sr ON a.service_request_id = sr.id
WHERE a.technician_id = 2
ORDER BY a.created_at DESC;
```

### Ver reseñas de un usuario

```sql
SELECT r.id, r.rating, r.comment, u.full_name as reviewer, r.created_at
FROM reviews r
JOIN users u ON r.reviewer_id = u.id
WHERE r.reviewee_id = 2
ORDER BY r.created_at DESC;
```

### Ver calificación promedio de técnicos

```sql
SELECT u.id, u.full_name, u.rating_avg, u.rating_count
FROM users u
WHERE u.role = 'technician'
ORDER BY u.rating_avg DESC NULLS LAST;
```

### Encontrar técnicos sin reseñas

```sql
SELECT u.id, u.full_name, tp.description
FROM users u
JOIN technician_profiles tp ON u.id = tp.user_id
WHERE u.rating_count = 0 OR u.rating_count IS NULL
ORDER BY u.created_at DESC;
```

---

## Triggers Útiles (Opcional)

### Auto-actualizar rating cuando hay nueva reseña

```sql
CREATE TRIGGER update_rating_after_review
AFTER INSERT ON reviews
BEGIN
  UPDATE users
  SET rating_avg = (
    SELECT AVG(rating) FROM reviews WHERE reviewee_id = NEW.reviewee_id
  ),
  rating_count = (
    SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id
  )
  WHERE id = NEW.reviewee_id;
END;
```

### Auto-crear Visit cuando application es aceptada

```sql
CREATE TRIGGER create_visit_on_accept
AFTER UPDATE ON applications
WHEN NEW.status = 'accepted'
BEGIN
  INSERT INTO visits (application_id, technician_id, client_id, status)
  SELECT NEW.id, NEW.technician_id, sr.client_id, 'scheduled'
  FROM service_requests sr
  WHERE sr.id = NEW.service_request_id;
END;
```

---

## Notas de Desarrollo

### JSON en SQLite

SQLite no tiene tipo JSON nativo (en versiones < 3.38), se almacena como TEXT:

```python
import json

# Guardar
category_ids = [1, 2, 3]
profile.category_ids = json.dumps(category_ids)

# Recuperar
category_ids = json.loads(profile.category_ids)
```

### GeoJSON para Ubicaciones

Se almacena como JSON:

```json
{
  "type": "Point",
  "coordinates": [-51.2093, -33.8688]
}
```

En backend se convierte a/desde dict de Python.

### Campos de Fecha

Usar ISO 8601 format en respuestas API:

```python
created_at_iso = model.created_at.isoformat()
# "2026-06-15T10:30:00.000000"
```

---

## Backup y Restore

### Backup de SQLite

```bash
# Copiar archivo de BD
cp tecnicos_ya.db tecnicos_ya.backup.db

# O usar comandos de SQLite
sqlite3 tecnicos_ya.db ".backup tecnicos_ya.backup.db"
```

### Restore

```bash
cp tecnicos_ya.backup.db tecnicos_ya.db

# O desde sqlite3
sqlite3 tecnicos_ya.db ".restore tecnicos_ya.backup.db"
```

---

**Última actualización:** 2026-06-15  
**Estado:** ✅ Documentado completo
