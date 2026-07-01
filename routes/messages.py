import logging
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from database import get_db, Message, ServiceRequest, User, Application
from auth import get_current_user
from services.push_notifications import send_push_to_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/messages", tags=["messages"])


class MessageCreate(BaseModel):
    service_request_id: int
    content: str


def serialize_message(msg: Message, db: Session) -> dict:
    sender = db.query(User).filter(User.id == msg.sender_id).first()
    return {
        "id": msg.id,
        "service_request_id": msg.service_request_id,
        "sender_id": msg.sender_id,
        "sender_name": sender.full_name if sender else "Usuario",
        "sender_role": sender.role if sender else "unknown",
        "content": msg.content,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


def can_access_conversation(user: User, service_request: ServiceRequest, db: Session) -> bool:
    """VULNERABILIDAD CORREGIDA: Solo el cliente y el técnico ACEPTADO pueden acceder al chat."""
    if service_request.client_id == user.id:
        return True
        
    # Validar que el técnico esté explícitamente aceptado
    app = db.query(Application).filter(
        Application.service_request_id == service_request.id,
        Application.technician_id == user.id,
        Application.status == "accepted"
    ).first()
    
    return app is not None


@router.get("/conversation/{service_request_id}")
def get_conversation(
    service_request_id: int,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    user = get_current_user(authorization, db)
    service_request = db.query(ServiceRequest).filter(ServiceRequest.id == service_request_id).first()
    
    if not service_request:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    if not can_access_conversation(user, service_request, db):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta conversación (Solo el técnico asignado puede chatear)")

    messages = (
        db.query(Message)
        .filter(Message.service_request_id == service_request_id)
        .order_by(Message.created_at.asc())
        .with_for_update() # Bloqueo pesimista para evitar lecturas fantasmas mientras se marcan como leídos
        .all()
    )

    # Marcar como leídos
    try:
        for msg in messages:
            if msg.sender_id != user.id and not msg.is_read:
                msg.is_read = True
        db.commit()
    except IntegrityError:
        db.rollback()

    return {
        "service_request_id": service_request_id,
        "service_request_title": service_request.title,
        "messages": [serialize_message(m, db) for m in messages],
    }


@router.post("")
def send_message(
    data: MessageCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    user = get_current_user(authorization, db)
    service_request = db.query(ServiceRequest).filter(ServiceRequest.id == data.service_request_id).first()
    
    if not service_request:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    if not can_access_conversation(user, service_request, db):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta conversación (Solo el técnico asignado puede enviar mensajes)")
        
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    msg = Message(
        service_request_id=data.service_request_id,
        sender_id=user.id,
        content=data.content.strip(),
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    
    try:
        db.commit()
        db.refresh(msg)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error de base de datos al enviar mensaje")

    # Notificar a la OTRA parte
    try:
        if user.id == service_request.client_id:
            # Si envió el cliente, notificar al técnico aceptado
            accepted_app = db.query(Application).filter(
                Application.service_request_id == service_request.id,
                Application.status == "accepted"
            ).first()
            if accepted_app:
                send_push_to_user(
                    user_id=accepted_app.technician_id,
                    title=f"💬 {user.full_name}",
                    body=data.content.strip()[:100],
                    data={"screen": "chat", "id": str(service_request.id)},
                    db=db,
                )
        else:
            # Si envió el técnico, notificar al cliente
            send_push_to_user(
                user_id=service_request.client_id,
                title=f"💬 {user.full_name}",
                body=data.content.strip()[:100],
                data={"screen": "chat", "id": str(service_request.id)},
                db=db,
            )
    except Exception as e:
        logger.error(f"Error enviando notificación push por mensaje: {e}")

    return serialize_message(msg, db)


@router.get("/unread-count")
def get_unread_count(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    user = get_current_user(authorization, db)
    count = 0
    
    if user.role == "client":
        service_requests = db.query(ServiceRequest).filter(ServiceRequest.client_id == user.id).all()
        request_ids = [r.id for r in service_requests]
        if request_ids:
            count = db.query(Message).filter(
                Message.sender_id != user.id,
                Message.is_read == False,
                Message.service_request_id.in_(request_ids)
            ).count()
            
    elif user.role == "technician":
        # VULNERABILIDAD CORREGIDA: Contar unread messages SOLO de trabajos asignados, no de los pendientes/rechazados
        applications = db.query(Application).filter(
            Application.technician_id == user.id,
            Application.status == "accepted"
        ).all()
        request_ids = [a.service_request_id for a in applications]
        if request_ids:
            count = db.query(Message).filter(
                Message.sender_id != user.id,
                Message.is_read == False,
                Message.service_request_id.in_(request_ids)
            ).count()
            
    return {"unread_count": count}
