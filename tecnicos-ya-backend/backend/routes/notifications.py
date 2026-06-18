from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db, Notification
from auth import get_current_user_id

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("", response_model=None)
def get_notifications(authorization: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # get_current_user_id returns the ID directly
    user_id = authorization 
    notifications = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
            "link": n.link
        } for n in notifications
    ]

@router.put("/{notification_id}/read")
def mark_as_read(notification_id: int, authorization: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user_id = authorization
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    notification.is_read = True
    db.commit()
    return {"status": "success"}

@router.put("/read-all")
def mark_all_as_read(authorization: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user_id = authorization
    db.query(Notification).filter(Notification.user_id == user_id).update({"is_read": True})
    db.commit()
    return {"status": "success"}
