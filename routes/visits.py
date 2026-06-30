from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import json

from database import get_db, Visit, TechnicianProfile, ServiceRequest
from services.pricing import calcular_distancia_km, calcular_precio
from services.serialization import sqlalchemy_to_dict
from schemas import VisitCreate

router = APIRouter(prefix="/api/visits", tags=["visits"])


@router.post("")
def create_visit(
    visit_data: VisitCreate, 
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user_id
    get_current_user_id(authorization)
    
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
        precio_final=precio
    )

    db.add(nueva_visita)
    db.commit()
    db.refresh(nueva_visita)
    return sqlalchemy_to_dict(nueva_visita)


@router.get("")
def get_all_visits(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user, require_role
    user = get_current_user(authorization, db)
    require_role(user, "admin")
    
    visits = db.query(Visit).all()
    return [sqlalchemy_to_dict(v) for v in visits]


@router.get("/my-visits")
def get_my_visits(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user_id
    user_id = get_current_user_id(authorization)
    visits = db.query(Visit).filter(Visit.technician_id == user_id).all()
    return [sqlalchemy_to_dict(v) for v in visits]


@router.put("/{visit_id}/confirm")
def confirm_visit(
    visit_id: int,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user_id
    from datetime import datetime
    get_current_user_id(authorization)
    
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
        
    visit.status = "completed"
    visit.completed_date = datetime.utcnow()
    visit.client_confirmed = True
    
    if visit.service_request_id:
        req = db.query(ServiceRequest).filter(ServiceRequest.id == visit.service_request_id).first()
        if req:
            req.status = "completed"
            
    db.commit()
    db.refresh(visit)
    
    return sqlalchemy_to_dict(visit)
