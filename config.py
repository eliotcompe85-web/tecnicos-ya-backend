import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if os.getenv("DISABLE_RATE_LIMITS", "0") == "1" or os.getenv("ENVIRONMENT") == "development":
        SECRET_KEY = "dev-secret-key-change-in-production"
        logger.warning("Usando SECRET_KEY de desarrollo. Configura SECRET_KEY en producción.")
    else:
        raise ValueError("SECRET_KEY no está configurada. Deteniendo aplicación por seguridad.")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tecnicos_ya.db")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS = CORS_ORIGINS_ENV.split(",") if CORS_ORIGINS_ENV else ["*"]
if CORS_ORIGINS == ["*"]:
    logger.warning("CORS: permitiendo todos los orígenes. Configura CORS_ORIGINS en producción.")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
