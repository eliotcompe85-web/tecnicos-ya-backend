import os
import argparse
from sqlalchemy.orm import Session
from database import SessionLocal, User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_admin(email: str, password: str, full_name: str, phone: str):
    db: Session = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == email.strip().lower()).first()
        if existing_user:
            print(f"Error: Ya existe un usuario con el correo {email}")
            return

        admin = User(
            email=email.strip().lower(),
            hashed_password=get_password_hash(password),
            full_name=full_name,
            phone=phone,
            role="admin",
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"✅ Administrador creado exitosamente con el ID: {admin.id}")
    except Exception as e:
        print(f"❌ Error al crear administrador: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crear usuario administrador")
    parser.add_argument("--email", required=True, help="Correo electrónico del administrador")
    parser.add_argument("--password", required=True, help="Contraseña")
    parser.add_argument("--name", default="Admin", help="Nombre completo")
    parser.add_argument("--phone", default="+56900000000", help="Teléfono")
    
    args = parser.parse_args()
    create_admin(args.email, args.password, args.name, args.phone)
