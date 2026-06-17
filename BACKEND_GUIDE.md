# 🔧 Guía Completa del Backend

## Descripción General

El backend de Técnicos Ya es una API REST construida con **FastAPI** que gestiona:
- Autenticación y autorización
- Perfiles de técnicos
- Solicitudes de servicio
- Aplicaciones y postulaciones
- Reseñas y calificaciones
- Visitas y pagos
- Notificaciones

## 📁 Estructura del Proyecto

```
tecnicos-ya-backend/
├── backend/
│   ├── server.py              # Aplicación FastAPI principal
│   ├── database.py            # Configuración SQLAlchemy
│   ├── models.py              # Modelos ORM
│   ├── auth.py                # Lógica de autenticación
│   ├── stripe_service.py      # Integración con Stripe
│   ├── seed_data.py           # Datos iniciales
│   ├── requirements.txt        # Dependencias Python
│   ├── routes/                # Rutas organizadas por dominio
│   │   ├── auth.py
│   │   ├── visits.py
│   │   └── __init__.py
│   └── tests/
│       ├── test_api.py        # Test suite completo
│       └── conftest.py        # Fixtures de pytest
├── __init__.py
└── README.md
```

## 🚀 Instalación y Setup

### 1. Entorno Virtual

```bash
cd tecnicos-ya-backend

# Crear entorno virtual
python -m venv venv

# Activar en Windows
.\venv\Scripts\activate

# Activar en Mac/Linux
source venv/bin/activate
```

### 2. Instalar Dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 3. Iniciar Servidor

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en:
- API: `http://localhost:8000`
- Docs Interactivos: `http://localhost:8000/docs`
- Redoc: `http://localhost:8000/redoc`

## 📚 Dependencias Principales

```
FastAPI==0.104.1          # Framework web
SQLAlchemy==2.0.23        # ORM para bases de datos
python-jose==3.3.0        # JWT tokens
bcrypt==4.1.1             # Hash de contraseñas
pydantic==2.5.0           # Validación de datos
stripe==7.0.0             # Integración pagos
pytest==7.4.3             # Testing
python-multipart==0.0.6   # Upload de archivos
cors==1.0.1               # CORS support
```

## 🗄️ Base de Datos

### Inicialización Automática

Las tablas se crean automáticamente en el primer inicio:

```python
# En server.py
Base.metadata.create_all(bind=engine)
```

### Estructura de Modelos

```
User
├── id (PK)
├── email (unique)
├── hashed_password
├── full_name
├── phone
├── role (client/technician)
├── rating_avg
└── rating_count

TechnicianProfile
├── id (PK)
├── user_id (FK → User)
├── category_ids (JSON)
├── description
├── experience_years
├── certifications (JSON)
├── portfolio_images (JSON)
├── availability_status
├── membership_type
├── location (GeoJSON)
└── created_at

ServiceRequest
├── id (PK)
├── client_id (FK → User)
├── category_id (FK → Category)
├── title
├── description
├── address
├── status
├── budget_min/max
├── location (GeoJSON)
├── created_at
└── applications (relationship)

Application
├── id (PK)
├── service_request_id (FK)
├── technician_id (FK → User)
├── message
├── proposed_price
├── status
└── created_at

Review
├── id (PK)
├── visit_id (FK → Visit)
├── reviewer_id (FK → User)
├── reviewee_id (FK → User)
├── rating (1-5)
├── comment
└── created_at

Visit
├── id (PK)
├── application_id (FK → Application)
├── technician_id (FK → User)
├── client_id (FK → User)
├── status
├── latitud_cliente
├── longitud_cliente
└── created_at

Category
├── id (PK)
├── name (unique)
└── created_at
```

## 🔐 Autenticación

### Flujo JWT

1. Usuario se registra o inicia sesión
2. Backend genera token JWT con `user_id` y `role`
3. Cliente envía token en header: `Authorization: Bearer {token}`
4. Backend valida token y extraer `user_id`

### Función Principal

```python
def get_current_user_id(authorization: Optional[str]):
    """Extrae y valida el token JWT"""
    if not authorization:
        raise HTTPException(status_code=401)
    
    token = authorization.replace("Bearer ", "")
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    user_id = payload.get("user_id")
    
    return user_id
```

### Protección de Endpoints

```python
@app.get("/api/technicians/profile/{user_id}")
def get_technician_profile(
    user_id: int,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    # Validar token
    current_user_id = get_current_user_id(authorization)
    
    # Obtener perfil
    profile = db.query(TechnicianProfile).filter_by(user_id=user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    
    return serialize_technician_profile(profile, profile.user)
```

## 🔄 Serialización

Funciones que convierten modelos ORM en diccionarios JSON:

### serialize_technician_profile()
```python
def serialize_technician_profile(profile, user):
    return {
        "_id": profile.id,
        "user_id": profile.user_id,
        "user": {
            "_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "rating_avg": user.rating_avg,
            "rating_count": user.rating_count
        },
        "category_ids": profile.category_ids or [],
        "description": profile.description,
        "experience_years": profile.experience_years,
        "certifications": profile.certifications or [],
        "portfolio_images": profile.portfolio_images or [],
        "availability_status": profile.availability_status,
        "membership_type": profile.membership_type,
        "location": profile.location,
        "created_at": profile.created_at.isoformat(),
        "reviews": [serialize_review(r, db) for r in user.reviews_received]
    }
```

### serialize_service_request()
```python
def serialize_service_request(sr, db, latitude=None, longitude=None):
    distance_km = 0
    distance_charge = 0
    
    if latitude and longitude and sr.location:
        coords = sr.location.get("coordinates", [])
        distance_km = calculate_distance(latitude, longitude, coords[1], coords[0])
        distance_charge = int(distance_km * 1000)  # 1000 CLP per km
    
    return {
        "_id": sr.id,
        "client_id": sr.client_id,
        "client_name": sr.client.full_name,
        "client_rating": sr.client.rating_avg,
        "category_id": sr.category_id,
        "category_name": sr.category.name,
        "title": sr.title,
        "description": sr.description,
        "address": sr.address,
        "status": sr.status,
        "budget_min": sr.budget_min,
        "budget_max": sr.budget_max,
        "location": sr.location,
        "created_at": sr.created_at.isoformat(),
        "applications": [
            serialize_application(app, db) for app in sr.applications
        ],
        "distance_km": round(distance_km, 1),
        "estimated_price": {
            "base": 9990,
            "distance_charge": distance_charge,
            "total": 9990 + distance_charge
        }
    }
```

### serialize_application()
```python
def serialize_application(application, db):
    return {
        "_id": application.id,
        "service_request_id": application.service_request_id,
        "technician_id": application.technician_id,
        "technician_name": application.technician.full_name,
        "technician_rating": application.technician.rating_avg,
        "service_request": {
            "title": application.service_request.title,
            "description": application.service_request.description,
            "address": application.service_request.address,
            "status": application.service_request.status
        },
        "message": application.message,
        "proposed_price": application.proposed_price,
        "status": application.status,
        "created_at": application.created_at.isoformat()
    }
```

### serialize_review()
```python
def serialize_review(review, db):
    reviewer = db.query(User).filter_by(id=review.reviewer_id).first()
    return {
        "_id": review.id,
        "visit_id": review.visit_id,
        "reviewer_id": review.reviewer_id,
        "reviewee_id": review.reviewee_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat(),
        "from_user_name": reviewer.full_name if reviewer else "Unknown"
    }
```

## 🧪 Testing

### Ejecutar Todos los Tests

```bash
cd backend
pytest tests/test_api.py -v
```

### Ejecutar Tests Específicos

```bash
# Tests de autenticación
pytest tests/test_api.py::TestAuth -v

# Tests de búsqueda de técnicos
pytest tests/test_api.py::TestTechnicians -v

# Tests de solicitudes
pytest tests/test_api.py::TestServiceRequests -v

# Con cobertura
pytest tests/test_api.py --cov=. -v
```

### Estructura de Tests

```python
class TestAuth:
    def test_register(self, client):
        """Registrar nuevo usuario"""
        
    def test_login(self, client):
        """Iniciar sesión"""
    
    def test_get_me(self, client, token):
        """Obtener usuario actual"""

class TestTechnicians:
    def test_search_technicians(self, client):
        """Buscar técnicos por categoría y ubicación"""
    
    def test_get_profile(self, client, token):
        """Obtener perfil de técnico"""
    
    def test_update_profile(self, client, token):
        """Actualizar perfil técnico"""

# ... más test classes
```

### Fixtures Útiles (conftest.py)

```python
@pytest.fixture
def client():
    """Cliente HTTP de test"""
    return TestClient(app)

@pytest.fixture
def token(client):
    """Token JWT para usuario de test"""
    response = client.post("/api/auth/login", json={
        "email": "cliente@test.com",
        "password": "test123"
    })
    return response.json()["access_token"]

@pytest.fixture
def auth_header(token):
    """Header de autorización con token"""
    return {"Authorization": f"Bearer {token}"}
```

## 💳 Pagos con Stripe

### Configuración

```python
import stripe

# En servidor.py
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
if STRIPE_API_KEY:
    stripe.api_key = STRIPE_API_KEY

# Si no hay clave, se usa modo DEMO
```

### Crear Sesión (Membresía)

```python
from stripe_service import create_membership_checkout

result = create_membership_checkout(
    plan="basic",
    success_url="https://ejemplo.com/success",
    cancel_url="https://ejemplo.com/cancel"
)

# result = {
#   "checkout_url": "https://checkout.stripe.com/...",
#   "session_id": "cs_test_...",
#   "demo_mode": True/False
# }
```

### Crear Sesión (Visita)

```python
from stripe_service import create_visit_checkout

result = create_visit_checkout(
    visit_id=8,
    success_url="https://ejemplo.com/success",
    cancel_url="https://ejemplo.com/cancel"
)

# Calcula automáticamente:
# - Monto de visita
# - Comisión plataforma (15%)
# - Pago al técnico (85%)
```

## 🔍 Variables de Entorno

Crear archivo `.env` en `backend/`:

```ini
# Base de Datos
DATABASE_URL=sqlite:///./tecnicos_ya.db

# JWT
JWT_SECRET=tu-clave-secreta-super-segura-aqui
JWT_ALGORITHM=HS256

# Stripe
STRIPE_API_KEY=sk_test_xxxxx

# Opcional
DEBUG=False
PORT=8000
```

## 📝 Agregar Nuevo Endpoint

Ejemplo: Crear endpoint para obtener historial de visitas de un técnico

```python
@app.get("/api/technicians/visit-history")
def get_technician_visit_history(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Obtener historial de visitas del técnico autenticado"""
    
    # 1. Validar autenticación
    technician_id = get_current_user_id(authorization)
    
    # 2. Consultar base de datos
    visits = db.query(Visit).filter(
        Visit.technician_id == technician_id
    ).order_by(Visit.created_at.desc()).all()
    
    # 3. Serializar respuesta
    return [
        {
            "_id": v.id,
            "client_name": v.client.full_name,
            "address": v.service_request.address,
            "status": v.status,
            "created_at": v.created_at.isoformat()
        }
        for v in visits
    ]
```

## 🐛 Debugging

### Ver Logs Detallados

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Inspeccionar Base de Datos

```python
# En Python REPL
from models import *
from database import SessionLocal

db = SessionLocal()
users = db.query(User).all()
print(users)
db.close()
```

### Validar Modelos

```python
# Verifica que Pydantic valide correctamente
from server import ReviewCreate

try:
    review = ReviewCreate(visit_id=1, rating=5)
    print(review.model_dump())
except Exception as e:
    print("Error:", e)
```

## 📚 Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| `server.py` | Endpoints principales, serialización |
| `models.py` | Modelos SQLAlchemy ORM |
| `database.py` | Conexión y sesión de DB |
| `auth.py` | Funciones de autenticación |
| `stripe_service.py` | Integración con Stripe |
| `seed_data.py` | Datos iniciales para testing |
| `routes/` | Rutas organizadas por dominio |
| `tests/test_api.py` | Suite de tests |

## ✅ Checklist de Deploy

- [ ] Configurar `.env` con valores de producción
- [ ] Cambiar `JWT_SECRET` a valor aleatorio fuerte
- [ ] Configurar `STRIPE_API_KEY` real
- [ ] Cambiar `DATABASE_URL` a PostgreSQL/MySQL
- [ ] Ejecutar `pytest tests/test_api.py` (todos pasen)
- [ ] Configurar CORS para dominio de frontend
- [ ] Habilitar HTTPS
- [ ] Configurar logging y monitoreo
- [ ] Realizar backup de base de datos

---

**Última actualización:** 2026-06-15  
**Estado:** ✅ Listo para producción
