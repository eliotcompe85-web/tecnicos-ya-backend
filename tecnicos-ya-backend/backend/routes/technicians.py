import json
import logging
import os
import uuid
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Header, Query, UploadFile, File
from sqlalchemy.orm import Session
import shutil

from database import get_db, User, TechnicianProfile, Review
from schemas import TechnicianProfileUpdate, AvailabilityUpdateRequest
from auth import get_current_user, get_current_user_id, require_role, get_current_user_from_db
from services.pricing import calcular_distancia_km
from services.serialization import serialize_technician_profile, serialize_technician_search_result, parse_json_field, serialize_review

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/technicians", tags=["technicians"])

UPLOAD_DIR = "backend/static/uploads"



@router.get("/search")
def search_technicians(
    category_id: Optional[Union[int, str]] = Query(None),
    availability: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    max_distance_km: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    profiles = db.query(TechnicianProfile).all()
    results = []
    for profile in profiles:
        user = db.query(User).filter(User.id == profile.user_id).first()
        if not user:
            continue

        distance_km = None
        if latitude is not None and longitude is not None:
            location_data = parse_json_field(profile.location, {})
            coordinates = location_data.get("coordinates") if isinstance(location_data, dict) else None
            if isinstance(coordinates, list) and len(coordinates) == 2:
                tech_lon, tech_lat = coordinates
                distance_km = calcular_distancia_km(latitude, longitude, float(tech_lat), float(tech_lon))
                if max_distance_km is not None and distance_km > max_distance_km:
                    continue

        results.append(serialize_technician_search_result(profile, user, distance_km))
    return results


@router.put("/profile")
def update_technician_profile(
    profile_data: TechnicianProfileUpdate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "technician")

    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user.id).first()
    if not profile:
        profile = TechnicianProfile(user_id=user.id)
        db.add(profile)

    if profile_data.category_ids is not None:
        profile.category_ids = json.dumps(profile_data.category_ids)
    if profile_data.description is not None:
        profile.description = profile_data.description
    if profile_data.experience_years is not None:
        profile.experience_years = profile_data.experience_years
    if profile_data.certifications is not None:
        profile.certifications = json.dumps(profile_data.certifications)
    if profile_data.portfolio_images is not None:
        profile.portfolio_images = json.dumps(profile_data.portfolio_images)
    if profile_data.availability_status is not None:
        profile.availability_status = profile_data.availability_status
    if profile_data.location is not None:
        profile.location = json.dumps(profile_data.location)
    
    # New document fields
    if profile_data.background_check_cert is not None:
        profile.background_check_cert = profile_data.background_check_cert
    if profile_data.id_card_front is not None:
        profile.id_card_front = profile_data.id_card_front
    if profile_data.id_card_back is not None:
        profile.id_card_back = profile_data.id_card_back

    db.commit()
    db.refresh(profile)
    return serialize_technician_profile(profile, user)

@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Query(..., description="Type of document: 'background', 'id_front', 'id_back'"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "technician")
    
    # FIX: Sanitize filename using UUID to prevent Path Traversal attacks
    extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{user.id}_{document_type}_{uuid.uuid4()}{extension}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update profile with the path
    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user.id).first()
    if not profile:
        profile = TechnicianProfile(user_id=user.id)
        db.add(profile)
    
    if document_type == "background":
        profile.background_check_cert = file_path
    elif document_type == "id_front":
        profile.id_card_front = file_path
    elif document_type == "id_back":
        profile.id_card_back = file_path
    else:
        raise HTTPException(status_code=400, detail="Tipo de documento no válido")
    
    db.commit()
    return {"status": "success", "file_path": file_path}



@router.get("/profile/{user_id}")
def get_technician_profile(
    user_id: int, 
    authorization: Optional[str] = Header(None, alias="Authorization"), 
    db: Session = Depends(get_db)
):
    # FIX: Prevent IDOR. Only the technician themselves or an admin can see the full profile.
    current_user = get_current_user(authorization, db)
    if current_user.id != user_id and current_user.role != "admin":
        # If it's a public request, we should only return a sanitized public profile.
        # For now, we block access to the full profile endpoint to avoid PII leak.
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este perfil detallado.")

    user = db.query(User).filter(User.id == user_id, User.role == "technician").first()
    if not user:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")
    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user_id).first()
    profile_data = serialize_technician_profile(profile, user) if profile else {
        "user_id": user.id,
        "user": {
            "_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "rating_avg": getattr(user, "rating_avg", 0.0) or 0.0,
            "rating_count": getattr(user, "rating_count", 0) or 0,
        },
        "availability_status": "available",
        "membership_type": "none",
    }
    reviews = db.query(Review).filter(Review.reviewee_id == user_id).all()
    return {
        **profile_data,
        "reviews": [serialize_review(review, db) for review in reviews]
    }



@router.put("/availability")
def update_availability(
    payload: AvailabilityUpdateRequest,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "technician")
    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user.id).first()
    if not profile:
        profile = TechnicianProfile(user_id=user.id)
        db.add(profile)
    profile.availability_status = payload.availability_status
    db.commit()
    db.refresh(profile)
    return serialize_technician_profile(profile, user)

@router.put("/verify/{user_id}")
def verify_technician(
    user_id: int, 
    status: str, 
    authorization: Optional[str] = Header(None, alias="Authorization"), 
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "admin")
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Estado inv�lido")
    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    profile.verification_status = status
    db.commit()
    from database import create_notification
    create_notification(user_id=user_id, message=f"Tu verificaci�n fue {status}", link="/technician/dashboard")
    return {"status": "success"}
