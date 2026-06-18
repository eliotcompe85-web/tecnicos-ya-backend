import os
import logging
from dotenv import load_dotenv
load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if os.getenv("DISABLE_RATE_LIMITS", "0") == "1":
        SECRET_KEY = "dev-secret-key-change-in-production"
        logger.warning("Usando SECRET_KEY de desarrollo. Configura SECRET_KEY en producción.")
    else:
        raise RuntimeError("SECRET_KEY no configurada. Configura la variable de entorno SECRET_KEY.")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tecnicos_ya.db")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080

CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS = CORS_ORIGINS_ENV.split(",") if CORS_ORIGINS_ENV else [
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "http://192.168.1.24:8081", # Expo Dev Server
    "http://192.168.1.24:5173"  # Vite on Local IP
]
if not CORS_ORIGINS_ENV:
    logger.info(f"CORS: Configurado para desarrollo en la IP 192.168.1.24")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Google OAuth Config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
