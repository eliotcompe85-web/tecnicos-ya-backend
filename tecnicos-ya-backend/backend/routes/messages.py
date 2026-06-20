from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
import logging

from database import get_db, Message, Visit, ServiceRequest
from schemas import MessageCreate, MessageResponse
from auth import get_current_user, get_current_user_id
from server import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/messages", tags=["messages"])

@router.post("", response_model=MessageResponse)
@limiter.limit("10/minute")
def send_message(
    request: Request,
    payload: MessageCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    
    visit = db.query(Visit).filter(Visit.id == payload.visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    # IMPORTANT: Only allow messaging if the visit is paid
    if visit.status != "paid":
        raise HTTPException(
            status_code=403, 
            detail="La comunicación directa solo está disponible una vez que la visita haya sido pagada."
        )
    
    # Verify that the user is part of this visit
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == visit.service_request_id).first()
    if not sr or (user.id != visit.technician_id and user.id != sr.client_id):
        raise HTTPException(status_code=403, detail="No tienes permiso para enviar mensajes en esta visita")

    # Determine receiver
    receiver_id = visit.technician_id if user.id != visit.technician_id else sr.client_id
    
    if not receiver_id:
        raise HTTPException(status_code=500, detail="No se pudo determinar el receptor del mensaje")

    new_message = Message(
        visit_id=payload.visit_id,
        sender_id=user.id,
        receiver_id=receiver_id,
        content=payload.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message

@router.get("/{visit_id}", response_model=List[MessageResponse])
def get_messages(
    visit_id: int,
    limit: int = 100,
    offset: int = 0,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    # Only participants can read messages
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == visit.service_request_id).first()
    if user.id != visit.technician_id and (not sr or user.id != sr.client_id):
        raise HTTPException(status_code=403, detail="No tienes permiso para leer estos mensajes")
    
    messages = db.query(Message).filter(
        Message.visit_id == visit_id
    ).order_by(Message.created_at.asc()).limit(limit).offset(offset).all()
    
    return messages

