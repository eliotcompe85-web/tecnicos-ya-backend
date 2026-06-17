import json
from typing import Optional, Dict
from sqlalchemy.orm import Session

from database import User, TechnicianProfile, ServiceRequest, Application, Review, Category
from services.pricing import calcular_distancia_km


def parse_json_field(value, default=None):
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def serialize_technician_profile(profile: TechnicianProfile, user: User) -> Dict:
    category_ids = parse_json_field(profile.category_ids, [])
    certifications = parse_json_field(profile.certifications, [])
    portfolio_images = parse_json_field(profile.portfolio_images, [])
    location = parse_json_field(profile.location, None)

    return {
        "_id": profile.id,
        "user_id": profile.user_id,
        "user": {
            "_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "rating_avg": getattr(user, "rating_avg", 0.0) or 0.0,
            "rating_count": getattr(user, "rating_count", 0) or 0,
        },
        "category_ids": category_ids,
        "description": profile.description,
        "experience_years": profile.experience_years,
        "certifications": certifications,
        "portfolio_images": portfolio_images,
        "availability_status": profile.availability_status,
        "membership_type": profile.membership_type,
        "location": location,
        "created_at": profile.created_at.isoformat(),
    }


def serialize_technician_search_result(profile: TechnicianProfile, user: User, distance_km: Optional[float] = None) -> Dict:
    return {
        "_id": profile.id,
        "user_id": profile.user_id,
        "description": profile.description,
        "experience_years": profile.experience_years,
        "availability_status": profile.availability_status,
        "membership_type": profile.membership_type,
        "category_ids": parse_json_field(profile.category_ids, []),
        "certifications": parse_json_field(profile.certifications, []),
        "portfolio_images": parse_json_field(profile.portfolio_images, []),
        "location": parse_json_field(profile.location, None),
        "distance_km": distance_km,
        "user": {
            "_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "rating_avg": getattr(user, "rating_avg", 0.0) or 0.0,
            "rating_count": getattr(user, "rating_count", 0) or 0,
        },
    }


def serialize_application(application: Application, db: Session) -> Dict:
    technician = db.query(User).filter(User.id == application.technician_id).first()
    service_request = db.query(ServiceRequest).filter(ServiceRequest.id == application.service_request_id).first()
    return {
        "_id": application.id,
        "service_request_id": application.service_request_id,
        "technician_id": application.technician_id,
        "technician_name": technician.full_name if technician else None,
        "technician_rating": getattr(technician, "rating_avg", 0.0) or 0.0,
        "service_request": {
            "title": service_request.title if service_request else None,
            "description": service_request.description if service_request else None,
            "address": service_request.address if service_request else None,
            "status": service_request.status if service_request else None,
        } if service_request else None,
        "message": application.message,
        "proposed_price": application.proposed_price,
        "status": application.status,
        "created_at": application.created_at.isoformat() if application.created_at else None,
    }


def serialize_service_request(service_request: ServiceRequest, db: Session, latitude: Optional[float] = None, longitude: Optional[float] = None) -> Dict:
    client = db.query(User).filter(User.id == service_request.client_id).first()
    category = db.query(Category).filter(Category.id == service_request.category_id).first()
    applications = [serialize_application(app, db) for app in db.query(Application).filter(Application.service_request_id == service_request.id).all()]

    distance_km = None
    if latitude is not None and longitude is not None and service_request.latitude is not None and service_request.longitude is not None:
        distance_km = calcular_distancia_km(latitude, longitude, service_request.latitude, service_request.longitude)

    base_price = 9990.0
    distance_charge = 0.0
    total_price = base_price
    if distance_km is not None and distance_km > 6:
        distance_charge = round((distance_km - 6) * 1000.0, 1)
        total_price = round(base_price + distance_charge, 1)

    return {
        "_id": service_request.id,
        "client_id": service_request.client_id,
        "client_name": client.full_name if client else None,
        "client_rating": getattr(client, "rating_avg", 0.0) or 0.0,
        "category_id": service_request.category_id,
        "category_name": category.name if category else None,
        "title": service_request.title,
        "description": service_request.description,
        "address": service_request.address,
        "status": service_request.status,
        "budget_min": service_request.budget_min,
        "budget_max": service_request.budget_max,
        "created_at": service_request.created_at.isoformat() if service_request.created_at else None,
        "location": {
            "type": "Point",
            "coordinates": [service_request.longitude, service_request.latitude],
        },
        "applications": applications,
        "distance_km": distance_km,
        "estimated_price": {
            "base": base_price,
            "distance_charge": distance_charge,
            "total": total_price,
        },
    }


def serialize_review(review: Review, db: Session) -> Dict:
    reviewer = db.query(User).filter(User.id == review.reviewer_id).first()
    return {
        "_id": review.id,
        "visit_id": review.visit_id,
        "reviewer_id": review.reviewer_id,
        "reviewee_id": review.reviewee_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat() if review.created_at else None,
        "from_user_name": reviewer.full_name if reviewer else None,
    }


def sqlalchemy_to_dict(obj):
    if obj is None:
        return None
    from fastapi.encoders import jsonable_encoder
    data = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    if "id" in data:
        data["_id"] = data.pop("id")
    return jsonable_encoder(data)
