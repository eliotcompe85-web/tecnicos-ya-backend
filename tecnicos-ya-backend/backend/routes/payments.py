import json
import os
import stripe
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from database import get_db, Visit, User
from schemas import MembershipCheckoutRequest, VisitCheckoutRequest
from auth import get_current_user, get_current_user_id, get_current_user_from_db
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
    session = create_visit_checkout(
        amount_clp=int(round(visit.precio_final)),
        visit_id=str(visit.id),
        client_id=str(user.id),
        technician_id=str(visit.technician_id),
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
            logger.warning("WEBHOOK SIN VERIFICACIÓN DE FIRMA - solo para desarrollo. Configura STRIPE_WEBHOOK_SECRET en producción.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event.get("type")

    if event_type == "payment_intent.succeeded":
        payment_intent = event.get("data", {}).get("object", {})
        metadata = payment_intent.get("metadata", {})
        visit_id = metadata.get("visit_id")
        amount_received = payment_intent.get("amount") # In cents
        
        if visit_id:
            visit = db.query(Visit).filter(Visit.id == visit_id).first()
            if visit:
                # VALIDACIÓN CRÍTICA: Verificar que el monto pagado coincide con el de la visita
                expected_amount = int(visit.precio_final * 100)
                if amount_received != expected_amount:
                    logger.error(f"FRAUDE DETECTADO: Visita {visit_id} esperaba ${expected_amount}, recibió ${amount_received}")
                    # En producción: marcar como disputa o alerta
                    raise ValueError(f"Monto incorrecto: {amount_received} vs {expected_amount}")
                
                visit.status = "paid"
                db.commit()
                logger.info(f"Pago completado: Visita ID {visit_id} marcada como pagada")
                return {"status": "success"}

    elif event_type == "customer.subscription.updated":
        subscription = event.get("data", {}).get("object", {})
        metadata = subscription.get("metadata", {})
        user_id = metadata.get("user_id")
        plan = metadata.get("plan")

        if user_id and plan:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                from datetime import datetime, timedelta
                user.membership_type = plan
                user.membership_start_date = datetime.utcnow()
                user.membership_end_date = datetime.utcnow() + timedelta(days=30)
                db.commit()
                logger.info(f"Membresía activada: Usuario ID {user_id} con plan {plan}")
                return {"status": "success"}

    elif event_type == "customer.subscription.deleted":
        subscription = event.get("data", {}).get("object", {})
        metadata = subscription.get("metadata", {})
        user_id = metadata.get("user_id")

        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.membership_type = "none"
                user.membership_start_date = None
                user.membership_end_date = None
                db.commit()
                logger.info(f"Membresía cancelada: Usuario ID {user_id}")
                return {"status": "success"}

    return {"status": "received"}
