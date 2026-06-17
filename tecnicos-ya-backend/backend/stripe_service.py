"""
Stripe Payment Service
Handles memberships and visit payments using Stripe
NOTE: Replace STRIPE_API_KEY in .env with your real Stripe test/live key
to enable real payments. By default operates in DEMO MODE.
"""
import os
import stripe
from datetime import datetime
from typing import Optional
import uuid

stripe.api_key = os.environ.get("STRIPE_API_KEY", "")

# Check if using a real Stripe key or demo mode
DEMO_MODE = not stripe.api_key or stripe.api_key == "sk_test_emergent" or stripe.api_key.startswith("sk_test_emergent")
if DEMO_MODE:
    import logging
    logging.getLogger(__name__).warning("⚠️ STRIPE MODO DEMO - Los pagos no son reales. Configura STRIPE_API_KEY para producción.")

# Pricing (CLP - zero-decimal currency)
MEMBERSHIP_PRICES = {
    "basic": 5500,
    "premium": 15000,
}

PLATFORM_COMMISSION_RATE = 0.15  # 15%


def create_membership_checkout(
    user_email: str,
    plan: str,
    success_url: str,
    cancel_url: str,
    user_id: str,
) -> dict:
    """Create a Stripe Checkout session for membership subscription"""
    if plan not in MEMBERSHIP_PRICES:
        raise ValueError(f"Invalid plan: {plan}")
    
    amount = MEMBERSHIP_PRICES[plan]
    
    # DEMO MODE: Return a mock checkout URL when no real Stripe key configured
    if DEMO_MODE:
        mock_session_id = f"cs_demo_{uuid.uuid4().hex[:24]}"
        return {
            "checkout_url": f"https://checkout.stripe.com/demo?session={mock_session_id}",
            "session_id": mock_session_id,
            "demo_mode": True,
            "message": "Modo demostración - Configure STRIPE_API_KEY real para pagos en producción",
            "amount": amount,
            "plan": plan,
        }
    
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "clp",
                "product_data": {
                    "name": f"Membresía Técnicos Ya - {plan.title()}",
                    "description": f"Membresía mensual {plan} de Técnicos Ya",
                },
                "unit_amount": amount,
                "recurring": {"interval": "month"},
            },
            "quantity": 1,
        }],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=user_email,
        metadata={
            "user_id": user_id,
            "plan": plan,
            "type": "membership",
        },
    )
    
    return {
        "checkout_url": session.url,
        "session_id": session.id,
    }


def create_visit_checkout(
    amount_clp: int,
    visit_id: str,
    client_id: str,
    technician_id: str,
    success_url: str,
    cancel_url: str,
) -> dict:
    """Create a Stripe Checkout session for a one-time visit payment"""
    platform_commission = int(amount_clp * PLATFORM_COMMISSION_RATE)
    technician_payment = amount_clp - platform_commission
    
    # DEMO MODE
    if DEMO_MODE:
        mock_session_id = f"cs_demo_{uuid.uuid4().hex[:24]}"
        return {
            "checkout_url": f"https://checkout.stripe.com/demo?session={mock_session_id}",
            "session_id": mock_session_id,
            "amount": amount_clp,
            "commission": platform_commission,
            "technician_payment": technician_payment,
            "demo_mode": True,
            "message": "Modo demostración - Configure STRIPE_API_KEY real para pagos en producción",
        }
    
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "clp",
                "product_data": {
                    "name": "Visita Técnica - Técnicos Ya",
                    "description": f"Pago por visita técnica (incluye 15% comisión plataforma)",
                },
                "unit_amount": amount_clp,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "visit_id": visit_id,
            "client_id": client_id,
            "technician_id": technician_id,
            "platform_commission": str(platform_commission),
            "technician_payment": str(technician_payment),
            "type": "visit",
        },
    )
    
    return {
        "checkout_url": session.url,
        "session_id": session.id,
        "amount": amount_clp,
        "commission": platform_commission,
        "technician_payment": technician_payment,
    }


def get_session_status(session_id: str) -> dict:
    """Get checkout session status"""
    if DEMO_MODE or session_id.startswith("cs_demo_"):
        # In demo mode, simulate paid status for testing
        return {
            "status": "complete",
            "payment_status": "paid",
            "customer_email": "demo@tecnicosya.com",
            "amount_total": 5500,
            "metadata": {"demo_mode": "true"},
        }
    
    session = stripe.checkout.Session.retrieve(session_id)
    return {
        "status": session.status,
        "payment_status": session.payment_status,
        "customer_email": session.customer_email,
        "amount_total": session.amount_total,
        "metadata": dict(session.metadata) if session.metadata else {},
    }
