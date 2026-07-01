from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import json
import logging

from database import get_db, Visit, TechnicianProfile, ServiceRequest, User
from services.pricing import calcular_distancia_km, calcular_precio
from schemas import VisitCreate
from services.push_notifications import send_push_to_user

logger = logging.getLogger(__name__)

def serialize_visit(visit: Visit) -> dict:
    return {
        "id": visit.id,
        "technician_id": visit.technician_id,
        "client_id": visit.client_id,
        "service_request_id": visit.service_request_id,
        "latitud_cliente": visit.latitud_cliente,
        "longitud_cliente": visit.longitud_cliente,
        "latitud_tecnico": visit.latitud_tecnico,
        "longitud_tecnico": visit.longitud_tecnico,
        "distancia_km": visit.distancia_km,
        "precio_final": visit.precio_final,
        "fecha": visit.fecha.isoformat() if visit.fecha else None,
        "status": getattr(visit, "status", "pending"),
        "completed_date": visit.completed_date.isoformat() if getattr(visit, "completed_date", None) else None,
        "client_confirmed": getattr(visit, "client_confirmed", False)
    }

router = APIRouter(prefix="/api/visits", tags=["visits"])


@router.post("")
def create_visit(
    visit_data: VisitCreate, 
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user, require_role
    user = get_current_user(authorization, db)
    
    # SEGURIDAD: Solo admins pueden crear visitas manualmente (las visitas normales se crean en applications.py)
    require_role(user, "admin")
    
    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == visit_data.technician_id).first()
    if not profile or not profile.location:
        raise HTTPException(
            status_code=404,
            detail=f"El técnico con ID {visit_data.technician_id} no existe o no tiene ubicación"
        )
    try:
        location_data = json.loads(profile.location)
        coordinates = location_data.get("coordinates", [])
        if len(coordinates) != 2:
            raise ValueError()
        tech_lon, tech_lat = coordinates
    except Exception:
        raise HTTPException(status_code=500, detail="Ubicación de técnico inválida")

    distancia = calcular_distancia_km(
        visit_data.latitud_cliente, visit_data.longitud_cliente,
        tech_lat, tech_lon
    )
    precio = calcular_precio(distancia)

    nueva_visita = Visit(
        technician_id=visit_data.technician_id,
        latitud_cliente=visit_data.latitud_cliente,
        longitud_cliente=visit_data.longitud_cliente,
        latitud_tecnico=tech_lat,
        longitud_tecnico=tech_lon,
        distancia_km=distancia,
        precio_final=precio,
        status="pending"
    )

    db.add(nueva_visita)
    db.commit()
    db.refresh(nueva_visita)
    return serialize_visit(nueva_visita)


@router.get("")
def get_all_visits(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user, require_role
    user = get_current_user(authorization, db)
    require_role(user, "admin")
    
    visits = db.query(Visit).all()
    return [serialize_visit(v) for v in visits]


@router.get("/my-visits")
def get_my_visits(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user
    user = get_current_user(authorization, db)
    
    if user.role == "technician":
        visits = db.query(Visit).filter(Visit.technician_id == user.id).all()
    else:
        visits = db.query(Visit).filter(Visit.client_id == user.id).all()
        
    return [serialize_visit(v) for v in visits]


@router.put("/{visit_id}/confirm")
def confirm_visit(
    visit_id: int,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user
    from datetime import datetime
    
    user = get_current_user(authorization, db)
    
    # Bloqueo pesimista para concurrencia
    visit = db.query(Visit).filter(Visit.id == visit_id).with_for_update().first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
        
    # VULNERABILIDAD IDOR CORREGIDA: Validar que el que confirma es el dueño de la visita
    if visit.client_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para confirmar esta visita.")
        
    # Validar el ciclo de vida (State Machine)
    if visit.status == "completed" or visit.status == "pagado":
        raise HTTPException(status_code=400, detail="Esta visita ya fue confirmada o pagada.")
        
    if visit.status == "cancelled":
        raise HTTPException(status_code=400, detail="No se puede confirmar una visita cancelada.")

    visit.status = "completed"
    visit.completed_date = datetime.utcnow()
    visit.client_confirmed = True
    
    req_title = "Tu trabajo"
    if visit.service_request_id:
        req = db.query(ServiceRequest).filter(ServiceRequest.id == visit.service_request_id).with_for_update().first()
        if req:
            req.status = "completed"
            req_title = req.title
            
    try:
        db.commit()
        db.refresh(visit)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error de base de datos al confirmar visita.")

    # UX: Notificar al técnico que su trabajo fue completado por el cliente
    try:
        send_push_to_user(
            user_id=visit.technician_id,
            title="🎉 Trabajo Completado",
            body=f"El cliente confirmó que '{req_title[:30]}' ha finalizado.",
            data={"screen": "job-detail", "id": str(visit.service_request_id)},
            db=db,
        )
    except Exception as e:
        logger.error(f"Error enviando notificación al técnico (confirmación visita): {e}")

    return serialize_visit(visit)
