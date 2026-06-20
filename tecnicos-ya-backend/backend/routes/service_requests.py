import logging
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session

from database import get_db, ServiceRequest
from schemas import ServiceRequestCreate
from auth import get_current_user, require_role
from services.serialization import serialize_service_request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/service-requests", tags=["service_requests"])


@router.post("")
def create_service_request(
    request_data: ServiceRequestCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "client")

    if not isinstance(request_data.location, dict) or "coordinates" not in request_data.location:
        raise HTTPException(status_code=400, detail="Location inválida")
    
    coords = request_data.location["coordinates"]
    if len(coords) != 2:
        raise HTTPException(status_code=400, detail="Coordinates deben incluir longitud y latitud")
    
    try:
        lat, lon = float(coords[1]), float(coords[0])
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError("Coordenadas fuera de rango")
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Coordenadas inválidas (deben ser números en rangos válidos)")

    new_request = ServiceRequest(
        client_id=user.id,
        category_id=request_data.category_id,
        title=request_data.title,
        description=request_data.description,
        latitude=lat,
        longitude=lon,
        address=request_data.address,
        budget_min=request_data.budget_min,
        budget_max=request_data.budget_max,
        status="open"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return serialize_service_request(new_request, db)


@router.get("")
def get_service_requests(
    status_filter: Optional[str] = Query(None),
    category_id: Optional[Union[int, str]] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(ServiceRequest)
    if status_filter:
        query = query.filter(ServiceRequest.status == status_filter)
    else:
        query = query.filter(ServiceRequest.status == "open")
    if category_id is not None:
        query = query.filter(ServiceRequest.category_id == str(category_id))
    requests_list = query.all()
    return [serialize_service_request(r, db) for r in requests_list]


@router.get("/{request_id}")
def get_service_request(request_id: int, db: Session = Depends(get_db)):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return serialize_service_request(req, db)

@router.put("/{request_id}/cancel")
def cancel_service_request(request_id: int, authorization: Optional[str] = Header(None, alias="Authorization"), db: Session = Depends(get_db)):
    user = get_current_user(authorization, db)
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if req.client_id != user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para cancelar esta solicitud")
    
    req.status = "cancelled"
    db.commit()
    
    from database import Application, create_notification
    apps = db.query(Application).filter(Application.service_request_id == request_id).all()
    for app in apps:
        create_notification(
            user_id=app.technician_id,
            message=f"La solicitud {req.title} ha sido cancelada por el cliente",
            link=f"/technician/dashboard"
        )
    
    return {"status": "success", "message": "Solicitud cancelada correctamente"}
