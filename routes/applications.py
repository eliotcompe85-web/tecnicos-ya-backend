import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db, Application, ServiceRequest, User, Visit, TechnicianProfile
from schemas import ApplicationCreate
from auth import get_current_user, get_current_user_id, require_role
from services.serialization import serialize_application
from services.push_notifications import send_push_to_user
from services.pricing import calcular_distancia_km
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/applications", tags=["applications"])

@router.get("")
def get_applications(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    if user.role == "technician":
        apps = db.query(Application).filter(Application.technician_id == user.id).all()
    else:
        client_requests = db.query(ServiceRequest).filter(ServiceRequest.client_id == user.id).all()
        request_ids = [r.id for r in client_requests]
        apps = db.query(Application).filter(Application.service_request_id.in_(request_ids)).all() if request_ids else []
    return [serialize_application(app, db) for app in apps]

@router.post("")
def create_application(
    app_data: ApplicationCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "technician")

    service_req = db.query(ServiceRequest).filter(
        ServiceRequest.id == app_data.service_request_id
    ).first()
    
    if not service_req:
        raise HTTPException(status_code=404, detail="Solicitud de servicio no encontrada")
        
    if service_req.client_id == user.id:
        raise HTTPException(status_code=400, detail="No puedes aplicar a tu propia solicitud")

    # VALIDACIÓN ARQUITECTÓNICA 1: No aplicar a trabajos que no estén abiertos
    if service_req.status != "open":
        raise HTTPException(status_code=400, detail="Esta solicitud ya no está disponible.")

    # VALIDACIÓN ARQUITECTÓNICA 2: Prevenir spam de postulaciones del mismo técnico
    existing_app = db.query(Application).filter(
        Application.service_request_id == service_req.id,
        Application.technician_id == user.id
    ).first()
    
    if existing_app:
        raise HTTPException(status_code=400, detail="Ya te has postulado a este trabajo.")

    if app_data.proposed_price < 0:
        raise HTTPException(status_code=400, detail="El precio propuesto no puede ser negativo.")

    new_app = Application(
        service_request_id=app_data.service_request_id,
        technician_id=user.id,
        message=app_data.message,
        proposed_price=app_data.proposed_price,
        status="pending"
    )
    db.add(new_app)
    
    try:
        db.commit()
        db.refresh(new_app)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error de concurrencia al postular.")

    try:
        send_push_to_user(
            user_id=service_req.client_id,
            title="🔧 Nueva Postulación",
            body=f"{user.full_name} quiere realizar tu solicitud ‘{service_req.title[:40]}’",
            data={"screen": "request-detail", "id": str(service_req.id)},
            db=db,
        )
    except Exception as e:
        logger.error(f"Error enviando notificación push al cliente (nueva postulación): {e}")

    return serialize_application(new_app, db)

@router.get("/my-applications")
def get_my_applications(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    tech_id = get_current_user_id(authorization)
    apps = db.query(Application).filter(Application.technician_id == tech_id).all()
    return [serialize_application(app, db) for app in apps]

@router.put("/{app_id}/accept")
def accept_application(
    app_id: int,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(authorization)

    # Uso de with_for_update() para bloquear la fila y prevenir doble aceptación (Race Condition)
    application = db.query(Application).filter(Application.id == app_id).with_for_update().first()
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
        
    service_req = db.query(ServiceRequest).filter(
        ServiceRequest.id == application.service_request_id
    ).with_for_update().first()
    
    if not service_req:
        raise HTTPException(status_code=404, detail="Solicitud de servicio no encontrada")
        
    if service_req.client_id != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para aceptar esta aplicación")

    # VALIDACIÓN ARQUITECTÓNICA 3: Prevenir sobre-asignación de trabajos
    if service_req.status != "open":
        raise HTTPException(status_code=400, detail="Este trabajo ya fue asignado o cerrado.")
        
    if application.status == "accepted":
        raise HTTPException(status_code=400, detail="Esta aplicación ya fue aceptada previamente.")

    # Cambiar el estado
    application.status = "accepted"
    service_req.status = "in_progress"

    # Rechazar automáticamente al resto de postulantes para mantener la BD limpia
    other_apps = db.query(Application).filter(
        Application.service_request_id == service_req.id,
        Application.id != app_id
    ).all()
    for other_app in other_apps:
        other_app.status = "rejected"

    # Calcular distancias y crear visita
    tech_profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == application.technician_id).first()
    lat_tech, lon_tech = 0.0, 0.0
    if tech_profile and tech_profile.location:
        try:
            loc = json.loads(tech_profile.location)
            if "coordinates" in loc and len(loc["coordinates"]) == 2:
                lon_tech, lat_tech = loc["coordinates"]
        except Exception:
            pass

    distancia = calcular_distancia_km(
        service_req.latitude, service_req.longitude,
        float(lat_tech), float(lon_tech)
    )

    new_visit = Visit(
        technician_id=application.technician_id,
        client_id=service_req.client_id,
        service_request_id=service_req.id,
        latitud_cliente=service_req.latitude,
        longitud_cliente=service_req.longitude,
        latitud_tecnico=lat_tech,
        longitud_tecnico=lon_tech,
        distancia_km=distancia,
        precio_final=application.proposed_price,
        status="pending",
        client_confirmed=False
    )
    db.add(new_visit)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error de concurrencia al asignar el trabajo.")

    try:
        technician = db.query(User).filter(User.id == application.technician_id).first()
        if technician and service_req:
            send_push_to_user(
                user_id=application.technician_id,
                title="✅ ¡Postulación Aceptada!",
                body=f"Fuiste seleccionado para ‘{service_req.title[:40]}’. Coordínate con el cliente.",
                data={"screen": "job-detail", "id": str(service_req.id)},
                db=db,
            )
    except Exception as e:
        logger.error(f"Error enviando notificación push al técnico: {e}")

    return serialize_application(application, db)
