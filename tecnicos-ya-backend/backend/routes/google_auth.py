from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CONF_URL, BACKEND_URL, FRONTEND_URL, logger
from database import get_db, User
from auth import create_access_token, hash_password
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter(prefix="/api/auth/google", tags=["google_auth"])

oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url=GOOGLE_CONF_URL,
    client_kwargs={'scope': 'openid email profile'}
)

@router.post("/verify-token")
async def verify_google_token(token: dict, db: Session = Depends(get_db)):
    try:
        id_token_str = token.get("token")
        if not id_token_str:
            raise HTTPException(status_code=400, detail="Token no proporcionado")
        
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(id_token_str, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo['email'].strip().lower()
        full_name = idinfo.get('name', 'Usuario de Google')
        
        # Buscar o crear usuario
        user = db.query(User).filter(User.email == email).first()
        if not user:
            import uuid
            random_password = str(uuid.uuid4())
            user = User(
                email=email,
                full_name=full_name,
                phone="No proporcionado",
                role="client",
                hashed_password=hash_password(random_password),
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token = create_access_token(data={"sub": user.id})
        return {"access_token": access_token, "user": {"id": user.id, "email": user.email, "full_name": user.full_name}}
        
    except ValueError as e:
        logger.error(f"Token inválido: {e}")
        raise HTTPException(status_code=401, detail="Token de Google inválido")
    except Exception as e:
        logger.error(f"Error verificando token de Google: {e}")
        raise HTTPException(status_code=500, detail="Error interno al verificar token")

@router.get("/login")
async def google_login(request: Request):
    redirect_uri = f"{BACKEND_URL}/api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(status_code=400, detail="No se pudo obtener información del usuario de Google")

        email = user_info['email'].strip().lower()
        full_name = user_info.get('name', 'Usuario de Google')

        # Buscar o crear usuario
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Crear usuario con contraseña aleatoria ya que entra por Google
            import uuid
            random_password = str(uuid.uuid4())
            user = User(
                email=email,
                full_name=full_name,
                phone="No proporcionado",
                role="client", # Por defecto cliente, el usuario puede cambiarlo luego
                hashed_password=hash_password(random_password),
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Usuario creado via Google: {email}")
        else:
            logger.info(f"Usuario existente logueado via Google: {email}")

        # Generar JWT propio de la app
        access_token = create_access_token(data={"sub": user.id})
        
        # Redirigir al frontend con el token en la URL (simplificado para demo)
        # En producción, se usaría un código temporal o una cookie segura
        return RedirectResponse(url=f"{FRONTEND_URL}/auth-callback?token={access_token}&user_id={user.id}")

    except Exception as e:
        logger.error(f"Error en Google Callback: {e}")
        raise HTTPException(status_code=500, detail="Error en la autenticación con Google")
