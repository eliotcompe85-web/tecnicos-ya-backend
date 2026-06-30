import os
import sys
import logging
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.orm import Session

# Añadimos el directorio actual al path para evitar errores de importación
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime

from config import CORS_ORIGINS, logger
from database import init_database, SessionLocal, Category
from services.pricing import calcular_distancia_km, calcular_precio

from routes.categories import router as categories_router
from routes.auth_router import router as auth_router
from routes.technicians import router as technicians_router
from routes.visits import router as visits_router
from routes.service_requests import router as service_requests_router
from routes.applications import router as applications_router
from routes.reviews import router as reviews_router
from routes.payments import router as payments_router
from routes.messages import router as messages_router
from routes.push_tokens import router as push_tokens_router
from routes.compliance import router as compliance_router
# --- SENTRY CONFIGURATION ---
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            FastApiIntegration(),
            StarletteIntegration(),
        ],
        traces_sample_rate=1.0, # Capture 100% of transactions for debugging
        profiles_sample_rate=1.0,
    )
    logger.info("Sentry initialized successfully")
else:
    logger.warning("Sentry DSN not found. Error tracking is disabled.")
# ----------------------------

app = FastAPI(title="API Técnicos Ya V2", version="2.1")

# --- MIDDLEWARE GLOBAL DE ERRORES ---
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": "Datos inválidos", "errors": exc.errors()},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no manejado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Error interno del servidor"},
    )
# ------------------------------------

if os.getenv("DISABLE_RATE_LIMITS", "0") == "1":
    class DummyLimiter:
        def limit(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
    limiter = DummyLimiter()
    logger.warning("Rate limiting deshabilitado - solo para desarrollo local")
else:
    limiter = Limiter(key_func=get_remote_address)
    logger.info("Rate limiting habilitado")

app.state.limiter = limiter


def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Demasiadas solicitudes. Intenta de nuevo en un momento."})


app.add_exception_handler(RateLimitExceeded, rate_limit_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories_router)
app.include_router(auth_router)
app.include_router(technicians_router)
app.include_router(visits_router)
app.include_router(service_requests_router)
app.include_router(applications_router)
app.include_router(reviews_router)
app.include_router(payments_router)
app.include_router(messages_router)
app.include_router(push_tokens_router)
app.include_router(compliance_router)

# Legacy endpoint mapping for backward compatibility
from fastapi import APIRouter
legacy = APIRouter()


@legacy.get("/api/visits/calculate-price")
def calculate_price_legacy(
    technician_id: int,
    latitud_cliente: float,
    longitud_cliente: float,
    latitud_tecnico: float = None,
    longitud_tecnico: float = None,
):
    lat_t = latitud_tecnico if latitud_tecnico is not None else -33.8569
    lon_t = longitud_tecnico if longitud_tecnico is not None else -70.9821
    distancia = calcular_distancia_km(latitud_cliente, longitud_cliente, lat_t, lon_t)
    precio = calcular_precio(distancia)
    return {
        "id": 1,
        "fecha": datetime.now().isoformat(),
        "distancia_km": distancia,
        "precio_final": precio,
        "technician_id": technician_id
    }


@legacy.get("/visits")
def visits_legacy():
    return []


app.include_router(legacy)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def seed_categories(db: Session):
    default_categories = [
        {"name": "Eléctrico", "description": "Instalaciones y reparaciones eléctricas", "icon": "flash_on"},
        {"name": "Gasfitería", "description": "Reparaciones y mantención de agua y gas", "icon": "water_drop"},
        {"name": "Mecánico", "description": "Reparaciones y mantención mecánica", "icon": "build"},
        {"name": "Carpintería", "description": "Trabajos en madera, muebles y estructuras", "icon": "carpenter"},
        {"name": "Pintura", "description": "Pintura interior y exterior", "icon": "format_paint"},
        {"name": "Refrigeración", "description": "Aire acondicionado y refrigeración", "icon": "ac_unit"},
        {"name": "Jardinería", "description": "Mantención de jardines y áreas verdes", "icon": "yard"},
        {"name": "Limpieza", "description": "Servicios de aseo y limpieza del hogar", "icon": "cleaning_services"},
        {"name": "Tecnología", "description": "Soporte técnico y reparación de equipos", "icon": "computer"},
        {"name": "Cerrajería", "description": "Apertura de cerraduras y duplicado de llaves", "icon": "key"},
        {"name": "Mudanzas", "description": "Traslado de muebles y equipos", "icon": "local_shipping"},
        {"name": "Construcción", "description": "Obras menores, albañilería y remodelaciones", "icon": "home_repair_service"},
    ]
    try:
        existing = db.query(Category).count()
        if existing == 0:
            for cat in default_categories:
                db.add(Category(name=cat["name"], description=cat["description"], icon=cat["icon"]))
            db.commit()
        elif existing < 12:
            existing_names = {c.name for c in db.query(Category).all()}
            for cat in default_categories:
                if cat["name"] not in existing_names:
                    db.add(Category(name=cat["name"], description=cat["description"], icon=cat["icon"], is_active=True))
            db.commit()
            
        # Ensure all are active
        db.query(Category).filter(Category.is_active == None).update({"is_active": True})
        db.commit()
    except Exception as e:
        logger.error(f"Error en seed_categories: {e}")


def seed_test_users():
    if os.getenv("SEED_TEST_USERS", "0") != "1":
        return
    from database import SessionLocal, User
    from auth import hash_password
    with SessionLocal() as db:
        logger.warning("Sembrando usuarios de prueba - deshabilita con SEED_TEST_USERS=0")
        default_users = [
            {"email": "cliente@test.com", "password": "test123", "full_name": "Cliente Test", "phone": "+56900000001", "role": "client"},
            {"email": "tecnico@test.com", "password": "test123", "full_name": "Tecnico Test", "phone": "+56900000002", "role": "technician"},
        ]
        for u in default_users:
            normalized_email = normalize_email(u["email"])
            existing = db.query(User).filter(User.email == normalized_email).first()
            if not existing:
                db.add(User(
                    email=normalized_email,
                    full_name=u["full_name"],
                    phone=u["phone"],
                    role=u["role"],
                    hashed_password=hash_password(u["password"]),
                    is_verified=True,
                ))
        db.commit()


startup_error = None

@app.on_event("startup")
def startup():
    global startup_error
    logger.info("Inicializando base de datos...")
    try:
        init_database()
        with SessionLocal() as db:
            seed_categories(db)
        seed_test_users()
        logger.info("Aplicación iniciada correctamente")
    except Exception as e:
        import traceback
        startup_error = traceback.format_exc()
        logger.error(f"Error fatal durante el startup: {e}", exc_info=True)
        # No crasheamos la app, permitimos que siga corriendo para que Railway no de 502

@legacy.get("/debug/error")
def get_debug_error():
    return {"error": startup_error}

@legacy.get("/health")
def health_check():
    return {"status": "healthy", "version": "2.1"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
