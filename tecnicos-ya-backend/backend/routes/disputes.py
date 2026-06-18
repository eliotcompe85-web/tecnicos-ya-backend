
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db, Dispute, Visit
from auth import get_current_user
from services.serialization import sqlalchemy_to_dict

router = APIRouter(prefix="/api/disputes", tags=["disputes"])

@router.post("")
def create_dispute(
    visit_id: int,
    reason: str,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    new_dispute = Dispute(
        visit_id=visit_id,
        client_id=user.id,
        technician_id=visit.technician_id,
        reason=reason
    )
    db.add(new_dispute)
    db.commit()
    db.refresh(new_dispute)
    
    visit.status = "disputed"
    db.commit()
    
    return sqlalchemy_to_dict(new_dispute)

@router.put("/{dispute_id}/resolve")
def resolve_dispute(
    dispute_id: int,
    resolution: str,
    status: str,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    from auth import require_role
    require_role(user, "admin")
    
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Disputa no encontrada")
    
    dispute.resolution = resolution
    dispute.status = status
    db.commit()
    
    return sqlalchemy_to_dict(dispute)

