import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from database import get_db, Application, ServiceRequest
from schemas import ApplicationCreate
from auth import get_current_user, get_current_user_id, require_role
from services.serialization import serialize_application

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

    new_app = Application(
        service_request_id=app_data.service_request_id,
        technician_id=user.id,
        message=app_data.message,
        proposed_price=app_data.proposed_price
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
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
    get_current_user_id(authorization)

    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")

    application.status = "accepted"

    service_req = db.query(ServiceRequest).filter(
        ServiceRequest.id == application.service_request_id
    ).first()
    if service_req:
        service_req.status = "in_progress"

    db.commit()
    return serialize_application(application, db)
