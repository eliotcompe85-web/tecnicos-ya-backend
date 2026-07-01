from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional, List
 
from database import get_db, Verification, Invoice, Warranty, User, TechnicianProfile
from schemas import VerificationCreate, InvoiceCreate, WarrantyCreate, VerificationUpdate
from auth import get_current_user_id, get_current_user, require_role
 
router = APIRouter(prefix="/api/compliance", tags=["compliance"])
 
def serialize_verification(v: Verification) -> dict:
    return {
        "id": v.id,
        "user_id": v.user_id,
        "document_type": v.document_type,
        "document_url": v.document_url,
        "status": getattr(v, "status", "pending"),
        "country_code": v.country_code,
        "created_at": v.created_at.isoformat() if v.created_at else None
    }

def serialize_invoice(inv: Invoice) -> dict:
    return {
        "id": inv.id,
        "visit_id": inv.visit_id,
        "invoice_number": inv.invoice_number,
        "fiscal_data": inv.fiscal_data,
        "total_amount": inv.total_amount,
        "status": getattr(inv, "status", "issued"),
        "created_at": inv.created_at.isoformat() if inv.created_at else None
    }

def serialize_warranty(w: Warranty) -> dict:
    return {
        "id": w.id,
        "visit_id": w.visit_id,
        "coverage_details": w.coverage_details,
        "expiry_date": w.expiry_date.isoformat() if w.expiry_date else None,
        "status": getattr(w, "status", "active"),
        "created_at": w.created_at.isoformat() if w.created_at else None
    }

@router.get("/pending")
def get_pending_verifications(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "admin")
    
    pending = db.query(Verification).filter(Verification.status == "pending").all()
    return [serialize_verification(v) for v in pending]
 
@router.patch("/verification/{verification_id}")
def update_verification_status(
    verification_id: int,
    data: VerificationUpdate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    require_role(user, "admin")
    
    verification = db.query(Verification).filter(Verification.id == verification_id).first()
    if not verification:
        raise HTTPException(status_code=404, detail="Verificación no encontrada")
    
    verification.status = data.status
    
    if data.status == "approved":
        # Update User status
        db_user = db.query(User).filter(User.id == verification.user_id).first()
        if db_user:
            db_user.is_verified = True
        
        # Update Technician Profile status
        tech_profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == verification.user_id).first()
        if tech_profile:
            tech_profile.verification_status = "approved"
            
    elif data.status == "rejected":
        tech_profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == verification.user_id).first()
        if tech_profile:
            tech_profile.verification_status = "rejected"

    db.commit()
    db.refresh(verification)
    return serialize_verification(verification)
 
@router.post("/verification")
def create_verification(
    data: VerificationCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(authorization)
    verification = Verification(
        user_id=user_id,
        document_type=data.document_type,
        document_url=data.document_url,
        country_code=data.country_code
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)
    return serialize_verification(verification)

@router.post("/invoice")
def create_invoice(
    data: InvoiceCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    from auth import get_current_user, require_role
    user = get_current_user(authorization, db)
    require_role(user, "admin")
    
    import uuid
    invoice = Invoice(
        visit_id=data.visit_id,
        invoice_number=str(uuid.uuid4()),
        fiscal_data=data.fiscal_data,
        total_amount=0.0
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return serialize_invoice(invoice)

@router.post("/warranty")
def create_warranty(
    data: WarrantyCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    get_current_user_id(authorization)
    
    from datetime import datetime
    warranty = Warranty(
        visit_id=data.visit_id,
        coverage_details=data.coverage_details,
        expiry_date=datetime.fromisoformat(data.expiry_date)
    )
    db.add(warranty)
    db.commit()
    db.refresh(warranty)
    return serialize_warranty(warranty)
