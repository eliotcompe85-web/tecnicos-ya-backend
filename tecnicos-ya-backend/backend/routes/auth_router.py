import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db, User
from schemas import UserCreate, UserLogin, UserResponse, TokenResponse, EmailVerificationResponse
from auth import hash_password, verify_password, create_access_token, get_current_user_id, get_current_user_from_db, send_verification_email

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

    return {
        "access_token": access_token,
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
    logger.info(f"Login iniciado: {credentials.identifier}")
    identifier = credentials.identifier.strip().lower()
    
    # Search by email or phone
    user = db.query(User).filter(
        (User.email == identifier) | (User.phone == identifier)
    ).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identificador o contraseña incorrectos")
    
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Debes verificar tu cuenta antes de iniciar sesión")
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
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
