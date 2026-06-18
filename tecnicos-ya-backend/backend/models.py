from pydantic import BaseModel, Field, EmailStr, validator, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timedelta
from bson import ObjectId
import math

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    role: Literal["client", "technician", "admin"]
    is_active: bool = True
    is_blocked: bool = False

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    role: Literal["client", "technician", "admin"]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rating_avg: float = 0.0
    rating_count: int = 0

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
    )

# Service Category
class ServiceCategory(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    name: str
    description: str
    icon: str = "wrench"
    is_active: bool = True

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
    )

# Technician Profile
class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

class TechnicianProfile(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    category_ids: List[str]
    description: str
    experience_years: int
    certifications: List[str] = []
    portfolio_images: List[str] = []  # base64 images
    location: Optional[Location] = None
    availability_status: Literal["available", "scheduling", "unavailable"] = "available"
    membership_type: Literal["none", "basic", "premium"] = "none"
    membership_start_date: Optional[datetime] = None
    membership_end_date: Optional[datetime] = None
    is_first_month_free: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
    )

# Service Request
class ServiceRequest(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    client_id: str
    category_id: str
    title: str
    description: str
    location: Location
    address: str
    status: Literal["open", "assigned", "in_progress", "completed", "cancelled"] = "open"
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scheduled_date: Optional[datetime] = None
    assigned_technician_id: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
    )

# Application (Técnico aplica a trabajo)
class Application(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    service_request_id: str
    technician_id: str
    message: str
    proposed_price: float
    status: Literal["pending", "accepted", "rejected"] = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
    )

# Review
class Review(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    visit_id: str
    from_user_id: str
    to_user_id: str
    rating: int = Field(ge=1, le=5)
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
    )

# Visit (Registro de visita confirmada)
class Visit(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    service_request_id: str
    client_id: str
    technician_id: str
    distance_km: float
    base_price: float = 9990.0
    distance_charge: float = 0.0
    total_price: float
    platform_commission: float  # 15%
    technician_payment: float   # 85%
    status: Literal["scheduled", "completed", "cancelled"] = "scheduled"
    payment_status: Literal["pending", "paid", "refunded"] = "pending"
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    client_confirmed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
    )

# Payment
class Payment(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    amount: float
    payment_type: Literal["membership", "visit", "commission_payout"]
    status: Literal["pending", "completed", "failed", "refunded"] = "pending"
    stripe_payment_id: Optional[str] = None
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
    )

# Helper functions
def calculate_distance_km(coord1: List[float], coord2: List[float]) -> float:
    """Calculate distance between two coordinates in kilometers using Haversine formula"""
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def calculate_visit_price(distance_km: float) -> tuple[float, float, float]:
    """Calculate visit pricing based on distance
    Returns: (base_price, distance_charge, total_price)
    """
    base_price = 9990.0
    distance_charge = 0.0
    
    if distance_km > 6:
        extra_km = distance_km - 6
        distance_charge = extra_km * 1000.0
    
    total_price = base_price + distance_charge
    return base_price, distance_charge, total_price