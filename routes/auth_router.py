import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db, User
from schemas import UserCreate, UserLogin, GoogleLogin, UserResponse, TokenResponse, EmailVerificationResponse, RefreshTokenRequest
from auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user_id, get_current_user_from_db, send_verification_email

from google.oauth2 import id_token
from google.auth.transport import requests
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def normalize_email(email: str) -> str:
    return email.strip().lower()


@router.post("/register", response_model=TokenResponse)
def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    logger.info(f"Registro iniciado: {user_data.email}")
    normalized_email = normalize_email(user_data.email)
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    verification_token = str(uuid.uuid4())
    new_user = User(
        email=normalized_email,
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=user_data.role,
        hashed_password=hash_password(user_data.password),
        is_verified=True,
        verification_token=None,
        verification_sent_at=None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    try:
        background_tasks.add_task(send_verification_email, new_user.email, new_user.full_name, verification_token)
    except Exception as e:
        logger.warning(f"Fallo envío email de verificación: {e}")

    access_token = create_access_token(data={"sub": new_user.id})
    refresh_token = create_refresh_token(data={"sub": new_user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            phone=new_user.phone,
            role=new_user.role,
            is_verified=new_user.is_verified,
        )
    }


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    logger.info(f"Login iniciado: {credentials.email}")
    normalized_email = normalize_email(credentials.email)
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Debes verificar tu email antes de iniciar sesión")

    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role=user.role,
            is_verified=user.is_verified,
        )
    }


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLogin, db: Session = Depends(get_db)):
    logger.info("Login con Google iniciado")
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        logger.error("GOOGLE_CLIENT_ID no configurado")
        raise HTTPException(status_code=500, detail="Configuración de Google Auth faltante")

    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(payload.id_token, requests.Request(), client_id)
        
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="El token de Google no contiene un email")
            
        normalized_email = normalize_email(email)
        full_name = idinfo.get("name", "Usuario de Google")
        
        # Check if user exists
        user = db.query(User).filter(User.email == normalized_email).first()
        
        if not user:
            # Register new user
            logger.info(f"Registrando nuevo usuario vía Google: {normalized_email}")
            user = User(
                email=normalized_email,
                full_name=full_name,
                phone="",
                role=payload.role,
                hashed_password=hash_password(str(uuid.uuid4())), # Random password
                is_verified=True, # Trusted email from Google
                verification_token=None,
                verification_sent_at=None,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                phone=user.phone,
                role=user.role,
                is_verified=user.is_verified,
            )
        }
    except ValueError as e:
        logger.error(f"Error verificando token de Google: {e}")
        raise HTTPException(status_code=401, detail="Token de Google inválido")


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
            
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        user = get_current_user_from_db(int(user_id), db)
        
        access_token = create_access_token(data={"sub": user.id})
        new_refresh_token = create_refresh_token(data={"sub": user.id})

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                phone=user.phone,
                role=user.role,
                is_verified=user.is_verified,
            )
        }
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(status_code=401, detail="Refresh token expirado o inválido")


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(authorization)
    user = get_current_user_from_db(user_id, db)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_verified=user.is_verified,
    )


@router.get("/verify-email", response_model=EmailVerificationResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token de verificación inválido o vencido")

    user.is_verified = True
    user.verification_token = None
    user.verification_sent_at = None
    db.commit()

    return EmailVerificationResponse(
        message="Correo verificado correctamente.",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role=user.role,
            is_verified=user.is_verified,
        ),
    )
