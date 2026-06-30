from typing import Optional, List, Dict, Union
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class TechnicianCreate(BaseModel):
    nombre: str
    especialidad: str
    latitud: float
    longitud: float


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleLogin(BaseModel):
    id_token: str
    role: Optional[str] = "cliente"


class UserResponse(UserBase):
    id: Optional[int] = None
    rating_avg: Optional[float] = None
    rating_count: Optional[int] = None
    is_verified: bool = False

    model_config = ConfigDict(
        from_attributes=True,
        validate_by_name=True,
        populate_by_name=True,
    )


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class EmailVerificationResponse(BaseModel):
    message: str
    user: UserResponse


class VisitCreate(BaseModel):
    technician_id: int
    latitud_cliente: float
    longitud_cliente: float


class ServiceRequestCreate(BaseModel):
    client_id: Optional[int] = None
    category_id: Union[str, int]
    title: str
    description: str
    location: Dict[str, object]
    address: str
    status: Optional[str] = "solicitado"
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_date: Optional[str] = None


class ApplicationCreate(BaseModel):
    service_request_id: Union[str, int]
    technician_id: Optional[Union[str, int]] = None
    message: Optional[str] = None
    proposed_price: float


class TechnicianProfileUpdate(BaseModel):
    category_ids: Optional[List[Union[str, int]]] = None
    description: Optional[str] = None
    experience_years: Optional[int] = None
    certifications: Optional[List[str]] = None
    portfolio_images: Optional[List[str]] = None
    document_urls: Optional[List[str]] = None
    availability_status: Optional[str] = None
    location: Optional[Dict[str, object]] = None


class ReviewCreate(BaseModel):
    visit_id: int
    to_user_id: Optional[int] = None
    rating: int
    comment: Optional[str] = None


class MembershipCheckoutRequest(BaseModel):
    plan: str
    success_url: str
    cancel_url: str


class VisitCheckoutRequest(BaseModel):
    visit_id: int
    success_url: str
    cancel_url: str


class AvailabilityUpdateRequest(BaseModel):
    availability_status: str


class PriceRequest(BaseModel):
    technician_id: int
    latitud_cliente: float
    longitud_cliente: float
    latitud_tecnico: float = None
    longitud_tecnico: float = None



class VerificationCreate(BaseModel):
    document_type: str
    document_url: str
    country_code: str

class VerificationUpdate(BaseModel):
    status: str # "approved" or "rejected"

class InvoiceCreate(BaseModel):
    visit_id: int
    fiscal_data: str

class WarrantyCreate(BaseModel):
    visit_id: int
    coverage_details: str
    expiry_date: str


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)
