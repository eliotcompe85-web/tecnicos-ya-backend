import json
import os
import stripe
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
import datetime

from database import get_db, Visit, User, TechnicianProfile, Payment
from schemas import MembershipCheckoutRequest, VisitCheckoutRequest
from auth import get_current_user
from stripe_service import create_membership_checkout, create_visit_checkout, get_session_status
from services.push_notifications import send_push_to_user

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
        
    # VALIDACIÓN ARQUITECTÓNICA 1: No permitir generar cobros sobre visitas canceladas o ya pagadas
    if visit.status == "cancelled":
        raise HTTPException(status_code=400, detail="No puedes pagar una visita cancelada.")
    if visit.status == "pagado" or (visit.service_request and visit.service_request.status == "pagado"):
        raise HTTPException(status_code=400, detail="Esta visita ya ha sido pagada.")
        
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
        logger.error(f"Error procesando webhook de Stripe: {e}")
        raise HTTPException(status_code=400, detail="Invalid request")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session.get("id")
        
        # VALIDACIÓN ARQUITECTÓNICA 2: Idempotencia financiera (Evitar doble procesamiento)
        existing_payment = db.query(Payment).filter(Payment.stripe_payment_id == session_id).first()
        if existing_payment:
            logger.info(f"Webhook idempotente: El pago {session_id} ya fue procesado previamente.")
            return {"status": "already_processed"}
            
        metadata = session.get("metadata", {})
        payment_type = metadata.get("type")
        
        if payment_type == "membership":
            user_id = metadata.get("user_id")
            plan = metadata.get("plan")
            if user_id:
                tech_profile = db.query(TechnicianProfile).filter(TechnicianProfile.user_id == int(user_id)).first()
                if tech_profile:
                    tech_profile.membership_type = plan
                    
                    # Acumular tiempo si ya era premium y renueva antes de tiempo
                    now = datetime.datetime.utcnow()
                    if tech_profile.membership_end_date and tech_profile.membership_end_date > now:
                        tech_profile.membership_end_date = tech_profile.membership_end_date + datetime.timedelta(days=30)
                    else:
                        tech_profile.membership_start_date = now
                        tech_profile.membership_end_date = now + datetime.timedelta(days=30)
                        
                    logger.info(f"✅ Membresía {plan} activada/renovada para el técnico {user_id}")

                    # Registrar pago
                    new_payment = Payment(
                        user_id=int(user_id),
                        amount=float(session.get("amount_total", 0) / 100) if session.get("currency") != "clp" else float(session.get("amount_total", 0)),
                        payment_type="membership",
                        status="completed",
                        stripe_payment_id=session_id,
                        description=f"Suscripción {plan}"
                    )
                    db.add(new_payment)
                    db.commit()

        elif payment_type == "visit":
            visit_id = metadata.get("visit_id")
            client_id = metadata.get("client_id")
            if client_id and visit_id:
                logger.info(f"✅ Pago de visita {visit_id} completado por cliente {client_id}")
                new_payment = Payment(
                    user_id=int(client_id),
                    amount=float(session.get("amount_total", 0)),
                    payment_type="visit",
                    status="completed",
                    stripe_payment_id=session_id,
                    description=f"Pago por visita {visit_id}"
                )
                db.add(new_payment)
                
                # Consistencia de Estados: Actualizar tanto la visita como la solicitud
                visit = db.query(Visit).filter(Visit.id == int(visit_id)).first()
                if visit:
                    visit.status = "pagado"
                    if visit.service_request:
                        visit.service_request.status = "pagado"
                
                db.commit()
                
                # UX: Notificar al técnico que el cliente ha pagado exitosamente
                if visit:
                    try:
                        send_push_to_user(
                            user_id=visit.technician_id,
                            title="💸 ¡Pago Recibido!",
                            body="El cliente ha realizado el pago de tu visita. Buen trabajo.",
                            data={"screen": "job-detail", "id": str(visit.service_request_id)},
                            db=db,
                        )
                    except Exception as e:
                        logger.error(f"Error notificando pago al técnico: {e}")

    return {"status": "success"}
