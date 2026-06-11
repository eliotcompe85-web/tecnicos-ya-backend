from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import logging
from bson import ObjectId
from bson.errors import InvalidId


def to_oid(value):
    """Convert string id to ObjectId; return original if invalid (so find returns nothing)."""
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return value

from models import (
    User, UserCreate, UserLogin, ServiceCategory, TechnicianProfile,
    ServiceRequest, Application, Review, Visit, Payment, Location,
    calculate_distance_km, calculate_visit_price
)
from auth import (
    get_password_hash, verify_password, create_access_token, get_current_user
)
from database import (
    db, users_collection, categories_collection, technician_profiles_collection,
    service_requests_collection, applications_collection, reviews_collection,
    visits_collection, payments_collection, init_db, close_db
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Técnicos Ya API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Validate password strength
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    
    # Normalize email
    email_normalized = user_data.email.lower().strip()
    
    # Check if user exists
    existing_user = await users_collection.find_one({"email": email_normalized})
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    # Create user
    user_dict = user_data.model_dump(exclude={"password", "email"})
    user_dict["email"] = email_normalized
    user_dict["password_hash"] = get_password_hash(user_data.password)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["is_active"] = True
    user_dict["is_blocked"] = False
    user_dict["rating_avg"] = 0.0
    user_dict["rating_count"] = 0
    
    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    # If technician, create profile with first month free
    if user_data.role == "technician":
        profile_dict = {
            "user_id": str(result.inserted_id),
            "category_ids": [],
            "description": "",
            "experience_years": 0,
            "certifications": [],
            "portfolio_images": [],
            "location": None,
            "availability_status": "available",
            "membership_type": "basic",
            "membership_start_date": datetime.utcnow(),
            "membership_end_date": datetime.utcnow() + timedelta(days=30),
            "is_first_month_free": True,
            "created_at": datetime.utcnow()
        }
        await technician_profiles_collection.insert_one(profile_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": str(result.inserted_id), "role": user_data.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "_id": str(result.inserted_id),
            "email": user_data.email,
            "full_name": user_data.full_name,
            "role": user_data.role
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    email_normalized = credentials.email.lower().strip()
    user = await users_collection.find_one({"email": email_normalized})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if user.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Tu cuenta está bloqueada. Por favor, paga tu membresía.")
    
    access_token = create_access_token(data={"sub": str(user["_id"]), "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "_id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "rating_avg": user.get("rating_avg", 0.0),
            "rating_count": user.get("rating_count", 0)
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"_id": to_oid(current_user["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    return user

# ==================== CATEGORIES ROUTES ====================
@api_router.get("/categories", response_model=List[ServiceCategory])
async def get_categories():
    categories = await categories_collection.find({"is_active": True}).to_list(100)
    for cat in categories:
        cat["_id"] = str(cat["_id"])
    return categories

@api_router.post("/categories")
async def create_category(category: ServiceCategory, current_user: dict = Depends(get_current_user)):
    category_dict = category.model_dump(exclude={"id"})
    result = await categories_collection.insert_one(category_dict)
    category_dict["_id"] = str(result.inserted_id)
    return category_dict

# ==================== TECHNICIAN PROFILE ROUTES ====================
@api_router.get("/technicians/search")
async def search_technicians(
    category_id: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    max_distance_km: float = 50,
    availability: Optional[str] = None
):
    query = {}
    
    if category_id:
        query["category_ids"] = category_id
    
    if availability:
        query["availability_status"] = availability
    
    # Check membership status
    query["$or"] = [
        {"membership_end_date": {"$gte": datetime.utcnow()}},
        {"is_first_month_free": True}
    ]
    
    technicians = await technician_profiles_collection.find(query).to_list(100)
    
    # Get user data for each technician
    result = []
    for tech in technicians:
        user = await users_collection.find_one({"_id": to_oid(tech["user_id"])})
        if user and not user.get("is_blocked", False):
            tech["_id"] = str(tech["_id"])
            tech["user_id"] = str(tech["user_id"])
            tech["user"] = {
                "full_name": user["full_name"],
                "email": user["email"],
                "phone": user["phone"],
                "rating_avg": user.get("rating_avg", 0.0),
                "rating_count": user.get("rating_count", 0)
            }
            
            # Calculate distance if location provided
            if latitude and longitude and tech.get("location"):
                tech_coords = tech["location"]["coordinates"]
                distance = calculate_distance_km([longitude, latitude], tech_coords)
                tech["distance_km"] = round(distance, 2)
                
                if distance <= max_distance_km:
                    result.append(tech)
            else:
                result.append(tech)
    
    # Sort by premium membership and rating
    result.sort(key=lambda x: (
        x.get("membership_type") == "premium",
        x.get("user", {}).get("rating_avg", 0)
    ), reverse=True)
    
    return result

@api_router.get("/technicians/profile/{user_id}")
async def get_technician_profile(user_id: str):
    profile = await technician_profiles_collection.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    
    user = await users_collection.find_one({"_id": to_oid(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    profile["_id"] = str(profile["_id"])
    profile["user_id"] = str(profile["user_id"])
    profile["user"] = {
        "full_name": user["full_name"],
        "email": user["email"],
        "phone": user["phone"],
        "rating_avg": user.get("rating_avg", 0.0),
        "rating_count": user.get("rating_count", 0)
    }
    
    # Get reviews
    reviews = await reviews_collection.find({"to_user_id": user_id}).to_list(100)
    for review in reviews:
        review["_id"] = str(review["_id"])
        from_user = await users_collection.find_one({"_id": to_oid(review["from_user_id"])})
        if from_user:
            review["from_user_name"] = from_user["full_name"]
    
    profile["reviews"] = reviews
    return profile

@api_router.put("/technicians/profile")
async def update_technician_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "technician":
        raise HTTPException(status_code=403, detail="Solo técnicos pueden actualizar el perfil")
    
    user_id = current_user["sub"]
    profile = await technician_profiles_collection.find_one({"user_id": user_id})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    
    # Update only allowed fields
    allowed_fields = [
        "category_ids", "description", "experience_years", 
        "certifications", "portfolio_images", "location", "availability_status"
    ]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    await technician_profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    return {"message": "Perfil actualizado exitosamente"}

# ==================== SERVICE REQUEST ROUTES ====================
@api_router.post("/service-requests")
async def create_service_request(
    request_data: ServiceRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Solo clientes pueden crear solicitudes")
    
    request_dict = request_data.model_dump(exclude={"id"})
    request_dict["client_id"] = current_user["sub"]
    request_dict["status"] = "open"
    request_dict["created_at"] = datetime.utcnow()
    
    result = await service_requests_collection.insert_one(request_dict)
    request_dict["_id"] = str(result.inserted_id)
    
    # TODO: Send notifications to nearby technicians
    
    return request_dict

@api_router.get("/service-requests")
async def get_service_requests(
    status_filter: Optional[str] = None,
    category_id: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    max_distance_km: float = 50,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == "client":
        query["client_id"] = current_user["sub"]
    
    if status_filter:
        query["status"] = status_filter
    
    if category_id:
        query["category_id"] = category_id
    
    requests = await service_requests_collection.find(query).to_list(100)
    
    result = []
    for req in requests:
        req["_id"] = str(req["_id"])
        
        # Get client info
        client = await users_collection.find_one({"_id": to_oid(req["client_id"])})
        if client:
            req["client_name"] = client["full_name"]
            req["client_rating"] = client.get("rating_avg", 0.0)
        
        # Get category info
        category = await categories_collection.find_one({"_id": to_oid(req["category_id"])})
        if category:
            req["category_name"] = category["name"]
        
        # Calculate distance if technician location provided
        if latitude and longitude and req.get("location"):
            req_coords = req["location"]["coordinates"]
            distance = calculate_distance_km([longitude, latitude], req_coords)
            req["distance_km"] = round(distance, 2)
            
            # Calculate estimated price
            base, dist_charge, total = calculate_visit_price(distance)
            req["estimated_price"] = {
                "base": base,
                "distance_charge": dist_charge,
                "total": total
            }
            
            if distance <= max_distance_km:
                result.append(req)
        else:
            result.append(req)
    
    return result

@api_router.get("/service-requests/{request_id}")
async def get_service_request(request_id: str):
    request = await service_requests_collection.find_one({"_id": to_oid(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    request["_id"] = str(request["_id"])
    
    # Get applications
    applications = await applications_collection.find({"service_request_id": request_id}).to_list(100)
    for app in applications:
        app["_id"] = str(app["_id"])
        tech = await users_collection.find_one({"_id": to_oid(app["technician_id"])})
        if tech:
            app["technician_name"] = tech["full_name"]
            app["technician_rating"] = tech.get("rating_avg", 0.0)
    
    request["applications"] = applications
    return request

# ==================== APPLICATION ROUTES ====================
@api_router.post("/applications")
async def create_application(
    application_data: Application,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "technician":
        raise HTTPException(status_code=403, detail="Solo técnicos pueden aplicar")
    
    # Check if technician has valid membership
    profile = await technician_profiles_collection.find_one({"user_id": current_user["sub"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de técnico no encontrado")
    
    if profile.get("membership_end_date") and profile["membership_end_date"] < datetime.utcnow():
        if not profile.get("is_first_month_free", False):
            raise HTTPException(status_code=403, detail="Tu membresía ha expirado. Por favor, renueva para aplicar a trabajos.")
    
    app_dict = application_data.model_dump(exclude={"id"})
    app_dict["technician_id"] = current_user["sub"]
    app_dict["status"] = "pending"
    app_dict["created_at"] = datetime.utcnow()
    
    result = await applications_collection.insert_one(app_dict)
    app_dict["_id"] = str(result.inserted_id)
    
    return app_dict

@api_router.get("/applications/my-applications")
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == "technician":
        query["technician_id"] = current_user["sub"]
    
    applications = await applications_collection.find(query).to_list(100)
    
    for app in applications:
        app["_id"] = str(app["_id"])
        # Get service request details
        request = await service_requests_collection.find_one({"_id": app["service_request_id"]})
        if request:
            app["service_request"] = {
                "title": request["title"],
                "description": request["description"],
                "address": request["address"],
                "status": request["status"]
            }
    
    return applications

@api_router.put("/applications/{app_id}/accept")
async def accept_application(
    app_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Solo clientes pueden aceptar aplicaciones")
    
    application = await applications_collection.find_one({"_id": to_oid(app_id)})
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")
    
    # Update application
    await applications_collection.update_one(
        {"_id": to_oid(app_id)},
        {"$set": {"status": "accepted"}}
    )
    
    # Update service request
    await service_requests_collection.update_one(
        {"_id": to_oid(application["service_request_id"])},
        {"$set": {
            "status": "assigned",
            "assigned_technician_id": application["technician_id"]
        }}
    )
    
    return {"message": "Aplicación aceptada"}

# ==================== REVIEW ROUTES ====================
@api_router.post("/reviews")
async def create_review(
    review_data: Review,
    current_user: dict = Depends(get_current_user)
):
    review_dict = review_data.model_dump(exclude={"id"})
    review_dict["from_user_id"] = current_user["sub"]
    review_dict["from_user_role"] = current_user["role"]
    review_dict["created_at"] = datetime.utcnow()
    
    # Verify visit exists and user is part of it
    visit = await visits_collection.find_one({"_id": to_oid(review_dict["visit_id"])})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    if current_user["sub"] not in [visit["client_id"], visit["technician_id"]]:
        raise HTTPException(status_code=403, detail="No tienes permiso para calificar esta visita")
    
    # Check if already reviewed
    existing = await reviews_collection.find_one({
        "visit_id": review_dict["visit_id"],
        "from_user_id": current_user["sub"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Ya calificaste esta visita")
    
    result = await reviews_collection.insert_one(review_dict)
    
    # Update user rating
    to_user_id = review_dict["to_user_id"]
    reviews = await reviews_collection.find({"to_user_id": to_user_id}).to_list(1000)
    
    total_rating = sum(r["rating"] for r in reviews)
    avg_rating = total_rating / len(reviews) if reviews else 0
    
    await users_collection.update_one(
        {"_id": to_oid(to_user_id)},
        {"$set": {
            "rating_avg": round(avg_rating, 2),
            "rating_count": len(reviews)
        }}
    )
    
    review_dict["_id"] = str(result.inserted_id)
    return review_dict

@api_router.get("/reviews/user/{user_id}")
async def get_user_reviews(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get reviews for a user with PRIVACY rules:
    - Technicians can see reviews ABOUT clients (written by other technicians)
    - Clients can see reviews ABOUT technicians (written by other clients)
    """
    # Get the target user's role
    target_user = await users_collection.find_one({"_id": to_oid(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    target_role = target_user["role"]
    requester_role = current_user["role"]
    
    # PRIVACY RULES:
    # If target is technician: only clients can see (clients view technician reviews)
    # If target is client: only technicians can see (technicians view client reviews)
    # OR: the user can see their own reviews
    
    is_own_profile = current_user["sub"] == user_id
    can_view = is_own_profile or (
        (target_role == "technician" and requester_role == "client") or
        (target_role == "client" and requester_role == "technician")
    )
    
    if not can_view:
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso para ver estas reseñas"
        )
    
    reviews = await reviews_collection.find({"to_user_id": user_id}).to_list(100)
    
    result = []
    for review in reviews:
        review["_id"] = str(review["_id"])
        # Get reviewer name
        from_user = await users_collection.find_one({"_id": to_oid(review["from_user_id"])})
        if from_user:
            review["from_user_name"] = from_user["full_name"]
            review["from_user_role"] = from_user["role"]
        result.append(review)
    
    return {
        "reviews": result,
        "average_rating": target_user.get("rating_avg", 0.0),
        "total_reviews": target_user.get("rating_count", 0)
    }

@api_router.get("/reviews/pending")
async def get_pending_reviews(current_user: dict = Depends(get_current_user)):
    """Get visits that the user can still review"""
    user_id = current_user["sub"]
    role = current_user["role"]
    
    # Find completed visits
    query = {"status": "completed"}
    if role == "client":
        query["client_id"] = user_id
    else:
        query["technician_id"] = user_id
    
    visits = await visits_collection.find(query).to_list(100)
    
    pending = []
    for visit in visits:
        visit["_id"] = str(visit["_id"])
        # Check if user already reviewed this visit
        existing = await reviews_collection.find_one({
            "visit_id": visit["_id"],
            "from_user_id": user_id
        })
        if not existing:
            # Get the other user info
            other_id = visit["technician_id"] if role == "client" else visit["client_id"]
            other_user = await users_collection.find_one({"_id": to_oid(other_id)})
            if other_user:
                visit["other_user"] = {
                    "_id": str(other_user["_id"]),
                    "full_name": other_user["full_name"],
                    "role": other_user["role"]
                }
            pending.append(visit)
    
    return pending

# ==================== VISIT ROUTES ====================
@api_router.post("/visits")
async def create_visit(visit_data: Visit, current_user: dict = Depends(get_current_user)):
    visit_dict = visit_data.model_dump(exclude={"id"})
    visit_dict["created_at"] = datetime.utcnow()
    
    result = await visits_collection.insert_one(visit_dict)
    visit_dict["_id"] = str(result.inserted_id)
    
    return visit_dict

@api_router.put("/visits/{visit_id}/confirm")
async def confirm_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Solo clientes pueden confirmar visitas")
    
    visit = await visits_collection.find_one({"_id": to_oid(visit_id)})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    await visits_collection.update_one(
        {"_id": to_oid(visit_id)},
        {"$set": {
            "client_confirmed": True,
            "status": "completed",
            "completed_date": datetime.utcnow()
        }}
    )
    
    # Update service request
    await service_requests_collection.update_one(
        {"_id": to_oid(visit["service_request_id"])},
        {"$set": {"status": "completed"}}
    )
    
    return {"message": "Visita confirmada"}

@api_router.get("/visits/my-visits")
async def get_my_visits(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == "client":
        query["client_id"] = current_user["sub"]
    else:
        query["technician_id"] = current_user["sub"]
    
    visits = await visits_collection.find(query).to_list(100)
    
    for visit in visits:
        visit["_id"] = str(visit["_id"])
    
    return visits

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("Database initialized")

@app.on_event("shutdown")
async def shutdown_event():
    await close_db()
    logger.info("Database connection closed")
