import copy
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Header
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_MINUTES, BACKEND_URL

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    to_encode = copy.deepcopy(data)
    if expires_delta:
        expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = copy.deepcopy(data)
    expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "refresh"})
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")


def get_token_from_header(authorization: Optional[str] = None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Token faltante")
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Formato de token inválido. Use 'Bearer <token>'")
        
    return parts[1]


def get_current_user_id(authorization: Optional[str] = Header(None, alias="Authorization")) -> int:
    token = get_token_from_header(authorization)
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")
    try:
        return int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido")


def get_current_user(authorization: Optional[str], db: Session):
    user_id = get_current_user_id(authorization)
    return get_current_user_from_db(user_id, db)


def get_current_user_from_db(user_id: int, db: Session):
    from database import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def require_role(user, role: str):
    if user.role != role:
        raise HTTPException(status_code=403, detail="Permiso denegado")


import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL

async def send_verification_email(email: str, full_name: str, token: str) -> None:
    verification_url = f"{BACKEND_URL}/api/auth/verify-email?token={token}"
    
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning(f"========== EMAIL SIMULADO (Sin config SMTP) ==========")
        logger.warning(f"Para: {email} ({full_name})")
        logger.warning(f"Enlace de verificación: {verification_url}")
        logger.warning(f"======================================================")
        return

    def _send():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Verifica tu cuenta en TécnicosYa"
            msg["From"] = f"TécnicosYa <{SMTP_FROM_EMAIL}>"
            msg["To"] = email

            html = f"""
            <html>
              <body>
                <h2>¡Hola, {full_name}!</h2>
                <p>Gracias por registrarte en TécnicosYa. Para comenzar a usar tu cuenta, por favor verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
                <br>
                <a href="{verification_url}" style="background-color: #2196F3; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verificar mi cuenta</a>
                <br><br>
                <p>O copia y pega esta URL en tu navegador:</p>
                <p>{verification_url}</p>
                <br>
                <p>El equipo de TécnicosYa</p>
              </body>
            </html>
            """
            
            part = MIMEText(html, "html")
            msg.attach(part)

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, email, msg.as_string())
            server.quit()
            
            logger.info(f"Correo de verificación enviado exitosamente a {email}")
        except Exception as e:
            logger.error(f"Error enviando correo de verificación a {email}: {str(e)}")

    await asyncio.to_thread(_send)
