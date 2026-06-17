import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from database import get_db, User, Visit, Review
from schemas import ReviewCreate
from auth import get_current_user, get_current_user_id
from services.serialization import serialize_review

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def update_user_rating(user_id: int, db: Session):
    reviews = db.query(Review).filter(Review.reviewee_id == user_id).all()

    if not reviews:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.rating_avg = None
            user.rating_count = 0
        return

    avg_rating = sum(r.rating for r in reviews) / len(reviews)
    count_rating = len(reviews)

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.rating_avg = round(avg_rating, 2)
        user.rating_count = count_rating


@router.post("", status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: ReviewCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    reviewer_id = get_current_user_id(authorization)

    visit = db.query(Visit).filter(Visit.id == review_data.visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita no encontrada")

    reviewee_id = visit.technician_id
    if review_data.to_user_id and review_data.to_user_id != reviewee_id:
        raise HTTPException(status_code=400, detail="El usuario en la reseña no coincide con la visita")

    new_review = Review(
        visit_id=review_data.visit_id,
        reviewer_id=reviewer_id,
        reviewee_id=reviewee_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    update_user_rating(reviewee_id, db)
    db.commit()

    return serialize_review(new_review, db)


@router.get("/user/{user_id}")
def get_user_reviews(
    user_id: int,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(authorization, db)
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if current_user.id == target_user.id or current_user.role == "technician" or target_user.role == "technician":
        reviews = db.query(Review).filter(Review.reviewee_id == user_id).all()
        return {
            "user_id": user_id,
            "reviews": [serialize_review(review, db) for review in reviews]
        }

    raise HTTPException(status_code=403, detail="Permiso denegado")


@router.get("/pending")
def get_pending_reviews(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(authorization)
    pending = db.query(Review).filter(Review.reviewee_id == user_id).all()
    return [serialize_review(review, db) for review in pending]
