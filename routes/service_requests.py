import logging
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import text

from database import get_db, ServiceRequest, Application
from schemas import ServiceRequestCreate
from auth import get_current_user, require_role
from services.serialization import serialize_service_request
from services.matching import find_matching_technicians, notify_matching_technicians

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/service-requests", tags=["service_requests"])

@router.get("/fix-db")
def fix_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("ALTER TABLE visits ADD COLUMN client_id INTEGER"))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error adding client_id: {e}")
        
    try:
        db.execute(text("ALTER TABLE visits ADD COLUMN service_request_id INTEGER"))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error adding service_request_id: {e}")
        
    return {"message": "DB Fixed"}



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

    new_request = ServiceRequest(
        client_id=user.id,
        category_id=request_data.category_id,
        title=request_data.title,
        description=request_data.description,
        latitude=float(coords[1]),
        longitude=float(coords[0]),
        address=request_data.address,
        budget_min=request_data.budget_min,
        budget_max=request_data.budget_max,
        status="open"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # --- ON-DEMAND MATCHING ---
    try:
        matches = find_matching_technicians(
            category_id=new_request.category_id,
            latitude=new_request.latitude,
            longitude=new_request.longitude,
            db=db
        )
        tech_ids = [m["user_id"] for m in matches]
        count = notify_matching_technicians(tech_ids, new_request.id, db)
        logger.info(f"Matching completed for request {new_request.id}: {count} technicians notified")
    except Exception as e:
        logger.error(f"Matching error for request {new_request.id}: {e}")
    # --------------------------

    return serialize_service_request(new_request, db)


@router.get("/my-requests")
def get_my_requests(
    status_filter: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    """Returns requests belonging to the authenticated client, with optional status filter."""
    user = get_current_user(authorization, db)
    query = db.query(ServiceRequest).options(
        selectinload(ServiceRequest.client),
        selectinload(ServiceRequest.applications).selectinload(Application.technician),
        selectinload(ServiceRequest.visit)
    ).filter(ServiceRequest.client_id == user.id)
    if status_filter:
        query = query.filter(ServiceRequest.status == status_filter)
    requests_list = query.order_by(ServiceRequest.created_at.desc()).all()
    return [serialize_service_request(r, db) for r in requests_list]


@router.get("")
def get_service_requests(
    status_filter: Optional[str] = Query(None),
    category_id: Optional[Union[int, str]] = Query(None),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    user = get_current_user(authorization, db)
    # Solo técnicos y admins pueden ver la lista general de solicitudes abiertas
    if user.role not in ["technician", "admin"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver todas las solicitudes")

    query = db.query(ServiceRequest).options(
        selectinload(ServiceRequest.client),
        selectinload(ServiceRequest.applications).selectinload(Application.technician),
        selectinload(ServiceRequest.visit)
    )
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
    req = db.query(ServiceRequest).options(
        selectinload(ServiceRequest.client),
        selectinload(ServiceRequest.applications).selectinload(Application.technician),
        selectinload(ServiceRequest.visit)
    ).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return serialize_service_request(req, db)

