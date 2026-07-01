import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if ENVIRONMENT == "production":
        raise ValueError("CRÍTICO: SECRET_KEY no está configurado en producción.")
    
    SECRET_KEY = "fallback-secret-key-for-development-and-testing-only-123456789"
    logger.warning("ATENCIÓN: Usando SECRET_KEY de respaldo inseguro. Solo para desarrollo.")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tecnicos_ya.db")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS = CORS_ORIGINS_ENV.split(",") if CORS_ORIGINS_ENV else []
if not CORS_ORIGINS or CORS_ORIGINS == ["*"]:
    if ENVIRONMENT == "production":
        logger.warning("RIESGO: CORS está permitiendo todos los orígenes en producción.")
    CORS_ORIGINS = ["*"]

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Configuración SMTP para correos transaccionales (ej. Verificación)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)
