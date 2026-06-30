import json
import os
import stripe
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from database import get_db, Visit, User, TechnicianProfile
from schemas import MembershipCheckoutRequest, VisitCheckoutRequest
from auth import get_current_user
from stripe_service import create_membership_checkout, create_visit_checkout, get_session_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.post("/membership/checkout")
def create_membership_payment(
    payload: MembershipCheckoutRequest,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    session = create_membership_checkout(
        user_email=user.email,
        plan=payload.plan,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        user_id=str(user.id),
    )
    return session

@router.post("/visit/checkout")
def create_visit_payment(
    payload: VisitCheckoutRequest,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    visit = db.query(Visit).filter(Visit.id == payload.visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    if visit.client_id != user.id:
        raise HTTPException(status_code=403, detail="No puedes pagar una visita que no es tuya")
        
    tech_profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == visit.technician_id).first()
    stripe_account_id = tech_profile.stripe_account_id if tech_profile else None
        
    session = create_visit_checkout(
        amount_clp=int(round(visit.precio_final)),
        visit_id=str(visit.id),
        client_id=str(user.id),
        technician_id=str(visit.technician_id),
        stripe_account_id=stripe_account_id,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
    )
    return session

@router.get("/session/{session_id}")
def get_payment_session_status(session_id: str):
    return get_session_status(session_id)

@router.post("/webhook")
async def handle_stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            event = json.loads(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid request")

    # ... lógica de eventos ...
    return {"status": "received"}
