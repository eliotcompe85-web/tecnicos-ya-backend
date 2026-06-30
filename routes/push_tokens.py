"""
Push Token Registration Route
Allows devices to register/update their Expo push token.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, PushToken
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/push-tokens", tags=["push_tokens"])


class PushTokenRegister(BaseModel):
    token: str
    platform: Optional[str] = "unknown"


@router.post("/register")
def register_push_token(
    data: PushTokenRegister,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    """Register or update a push token for the authenticated user."""
    user = get_current_user(authorization, db)

    if not data.token:
        return {"status": "skipped", "reason": "empty token"}

    # Upsert: if token already exists update user, if new token create
    existing = db.query(PushToken).filter(PushToken.token == data.token).first()
    if existing:
        existing.user_id = user.id  # update owner in case reinstall
        existing.platform = data.platform
    else:
        # Remove old tokens for this user + platform to avoid duplicates
        old_tokens = db.query(PushToken).filter(
            PushToken.user_id == user.id,
            PushToken.platform == data.platform
        ).all()
        for old in old_tokens:
            db.delete(old)

        db_token = PushToken(
            user_id=user.id,
            token=data.token,
            platform=data.platform,
        )
        db.add(db_token)

    db.commit()
    logger.info(f"Registered push token for user {user.id} ({data.platform})")
    return {"status": "registered"}


@router.delete("/unregister")
def unregister_push_token(
    data: PushTokenRegister,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    """Remove a push token (on logout)."""
    user = get_current_user(authorization, db)
    db.query(PushToken).filter(
        PushToken.user_id == user.id,
        PushToken.token == data.token
    ).delete()
    db.commit()
    return {"status": "unregistered"}
