from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import json

from database import get_db, Visit, TechnicianProfile
from services.pricing import calcular_distancia_km, calcular_precio
from services.serialization import sqlalchemy_to_dict
from schemas import VisitCreate

router = APIRouter(prefix="/api/visits", tags=["visits"])


@router.post("")
def create_visit(visit_data: VisitCreate, db: Session = Depends(get_db)):
    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == visit_data.technician_id).first()
    if not profile or not profile.location:
        raise HTTPException(
            status_code=404,
            detail=f"El técnico con ID {visit_data.technician_id} no existe o no tiene ubicación"
        )
    
    # Get proposed price from application for automatic calculation
    from database import Application
    application = db.query(Application).filter(Application.id == visit_data.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="La aplicación asociada no fue encontrada")
    
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
    
    # Automatic Pricing: Proposed Price + (Distance * Rate)
    # Rate: 500 per km (Example)
    KM_RATE = 500 
    precio_final = application.proposed_price + (distancia * KM_RATE)

    nueva_visita = Visit(
        technician_id=visit_data.technician_id,
        service_request_id=application.service_request_id,
        latitud_cliente=visit_data.latitud_cliente,
        longitud_cliente=visit_data.longitud_cliente,
        latitud_tecnico=tech_lat,
        longitud_tecnico=tech_lon,
        distancia_km=distancia,
        precio_final=precio_final,
        scheduled_at=visit_data.scheduled_at
    )

    db.add(nueva_visita)
    db.commit()
    db.refresh(nueva_visita)
    return sqlalchemy_to_dict(nueva_visita)


@router.get("")
def get_all_visits(db: Session = Depends(get_db)):
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


@router.put("/{visit_id}/status")
def update_visit_status(
    visit_id: int, 
    status: str, 
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user
    from database import Application, ServiceRequest
    user = get_current_user(authorization, db)
    
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    # Valid statuses
    valid_statuses = ["scheduled", "completed", "paid", "cancelled", "disputed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Estado no válido")

    # FIX: Prevent Payment Fraud. Only the Client can mark a visit as 'paid'.
    if status == "paid":
        if not visit.service_request_id:
            raise HTTPException(status_code=500, detail="Error interno: Visita no vinculada a solicitud")
        
        sr = db.query(ServiceRequest).filter(ServiceRequest.id == visit.service_request_id).first()
        if not sr or sr.client_id != user.id:
            raise HTTPException(status_code=403, detail="Solo el cliente puede marcar el servicio como pagado.")
        
    # If the technician is marking as 'completed', that's allowed.
    if status == "completed" and user.role != "technician":
         raise HTTPException(status_code=403, detail="Solo el técnico puede marcar la visita como completada.")

    visit.status = status
    db.commit()
    
    return sqlalchemy_to_dict(visit)
