from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
import stripe
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.db_models import User, Payment
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["payments"])

if settings.STRIPE_API_KEY:
    stripe.api_key = settings.STRIPE_API_KEY

class CheckoutRequest(BaseModel):
    user_id: str
    price_amount: float = 4.99 # Standard Premium Song Upgrade price

@router.post("/create-checkout-session")
def create_checkout_session(payload: CheckoutRequest, db: Session = Depends(get_db)):
    """Creates a Stripe Checkout Session or returns a mock success redirect if Stripe is not configured."""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not settings.STRIPE_API_KEY:
        # Mock Checkout for easy sandbox testing
        # Auto-upgrade the user in the mock flow
        user.is_premium = True
        user.premium_until = datetime.utcnow() + timedelta(days=365)
        
        mock_payment = Payment(
            user_id=user.id,
            stripe_session_id=f"mock_session_{datetime.utcnow().timestamp()}",
            amount=payload.price_amount,
            currency="usd",
            status="completed"
        )
        db.add(mock_payment)
        db.commit()
        
        # Return mock checkout url redirecting to dashboard with success query param
        return {"checkout_url": f"http://localhost:3000/dashboard?payment=success&mock=true"}

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'HeartBeat AI Premium Dedication Upgrade',
                        'description': 'Full High Definition Song & Reels Video Export without watermarks',
                    },
                    'unit_amount': int(payload.price_amount * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:3000/dashboard?payment=success',
            cancel_url='http://localhost:3000/dashboard?payment=cancel',
            client_reference_id=payload.user_id,
        )
        
        payment = Payment(
            user_id=user.id,
            stripe_session_id=session.id,
            amount=payload.price_amount,
            currency="usd",
            status="pending"
        )
        db.add(payment)
        db.commit()

        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Stripe webhook to listen for checkout session completions and upgrade users."""
    payload = await request.body()
    
    if not settings.STRIPE_API_KEY or not stripe_signature:
        return {"status": "ignored"}

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook signature verification failed: {str(e)}")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        session_id = session.get('id')
        
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            payment = db.query(Payment).filter(Payment.stripe_session_id == session_id).first()
            
            if user:
                user.is_premium = True
                user.premium_until = datetime.utcnow() + timedelta(days=365)
            
            if payment:
                payment.status = "completed"
                
            db.commit()

    return {"status": "success"}
