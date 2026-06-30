import json
import logging
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session, selectinload

from database import get_db, User, TechnicianProfile, Review
from schemas import TechnicianProfileUpdate, AvailabilityUpdateRequest
from auth import get_current_user, get_current_user_id, require_role, get_current_user_from_db
from services.pricing import calcular_distancia_km
from services.serialization import serialize_technician_profile, serialize_technician_search_result, parse_json_field, serialize_review
from services.audit import log_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/technicians", tags=["technicians"])


@router.get("/search")
def search_technicians(
    category_id: Optional[Union[int, str]] = Query(None),
    availability: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    max_distance_km: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    profiles = db.query(TechnicianProfile).options(selectinload(TechnicianProfile.user)).all()
    results = []
    for profile in profiles:
        user = profile.user
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
    if profile_data.document_urls is not None:
        profile.document_urls = json.dumps(profile_data.document_urls)
    if profile_data.availability_status is not None:
        profile.availability_status = profile_data.availability_status
    if profile_data.location is not None:
        profile.location = json.dumps(profile_data.location)

    db.commit()
    db.refresh(profile)
    return serialize_technician_profile(profile, user)


@router.get("/profile/{user_id}")
def get_technician_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.role == "technician").first()
    if not user:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")
    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user_id).first()
    profile_data = serialize_technician_profile(profile, user) if profile else {
        "user_id": user.id,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "rating_avg": getattr(user, "rating_avg", 0.0) or 0.0,
            "rating_count": getattr(user, "rating_count", 0) or 0,
        },
        "availability_status": "available",
        "membership_type": "none",
    }
    reviews = db.query(Review).options(selectinload(Review.from_user)).filter(Review.to_user_id == user_id).all()
    return {
        **profile_data,
        "reviews": [serialize_review(review, db) for review in reviews]
    }


@router.post("/approve/{user_id}")
def approve_technician(
    user_id: int,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "admin")

    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de técnico no encontrado")

    profile.verification_status = "approved"
    db.commit()
    db.refresh(profile)
    
    log_action(db, user.id, "approve_technician", "technician_profiles", user_id)
    
    logger.info(f"✅ Técnico aprobado: Usuario ID {user_id}")
    return {"message": "Técnico aprobado con éxito"}


@router.post("/reject/{user_id}")
def reject_technician(
    user_id: int,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "admin")

    profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de técnico no encontrado")

    profile.verification_status = "rejected"
    db.commit()
    db.refresh(profile)
    
    log_action(db, user.id, "reject_technician", "technician_profiles", user_id)
    
    logger.info(f"❌ Técnico rechazado: Usuario ID {user_id}")
    return {"message": "Técnico rechazado con éxito"}



@router.get("/all")
def get_all_technicians(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "admin")
    
    technicians = db.query(User).filter(User.role == "technician").options(selectinload(User.technician_profile)).all()
    return [
        {
            "id": t.id,
            "full_name": t.full_name,
            "email": t.email,
            "status": t.technician_profile[0].verification_status if t.technician_profile else "pending"
        }
        for t in technicians
    ]


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
