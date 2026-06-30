import logging
import json
from sqlalchemy.orm import Session
from database import TechnicianProfile, User, PushToken
from services.pricing import calcular_distancia_km
from services.push_notifications import send_push_notification

logger = logging.getLogger(__name__)

def find_matching_technicians(category_id: int, latitude: float, longitude: float, db: Session, max_distance_km: float = 15.0):
    """
    Finds technicians who:
    1. Are in the requested category.
    2. Are available.
    3. Are verified.
    4. Are within the max distance.
    """
    profiles = db.query(TechnicianProfile).join(User).filter(
        User.is_verified == True,
        TechnicianProfile.availability_status == "available"
    ).all()
    
    matched = []
    
    for profile in profiles:
        # Check category
        try:
            cat_ids = json.loads(profile.category_ids) if profile.category_ids else []
            if int(category_id) not in cat_ids:
                continue
        except (ValueError, TypeError):
            continue
            
        # Check location
        try:
            location_data = json.loads(profile.location) if profile.location else {}
            coords = location_data.get("coordinates")
            if not coords or len(coords) != 2:
                continue
            
            tech_lon, tech_lat = coords
            dist = calcular_distancia_km(latitude, longitude, float(tech_lat), float(tech_lon))
            
            if dist <= max_distance_km:
                matched.append({
                    "user_id": profile.user_id,
                    "distance_km": dist
                })
        except (ValueError, TypeError):
            continue
            
    # Sort by distance
    matched.sort(key=lambda x: x["distance_km"])
    return matched

def notify_matching_technicians(technician_ids: list, request_id: int, db: Session):
    """
    Sends actual push notifications to technicians.
    """
    notified_count = 0
    for tech_id in technician_ids:
        send_push_notification(
            user_id=tech_id,
            title="Nueva Solicitud de Servicio",
            body=f"Hay una nueva solicitud disponible: #{request_id}. ¡Revisa la app!",
            db=db
        )
        notified_count += 1
        logger.info(f"🔔 NOTIFICATION SENT to Technician {tech_id}: New service request {request_id} nearby!")
    
    return notified_count
