import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import get_db
from models.badge import Badge
from models.gamification_stats import GamificationStats
from models.user import User
from models.user_badge import UserBadge
from schemas.email_change import EmailChangeRequest, EmailChangeVerifyRequest, MessageResponse
from schemas.gamification import EarnedBadgeResponse, GamificationStatsResponse, UserGamificationResponse
from services.gamification import ensure_user_gamification_stats
from utils.deps import get_current_user
from utils.auth import verify_password, create_email_change_token, decode_email_change_token
from utils.email import send_email_change_confirmation_email


router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)


@router.get("/me/gamification", response_model=UserGamificationResponse)
def get_my_gamification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats: GamificationStats = ensure_user_gamification_stats(db, current_user.id)

    rows = (
        db.execute(
            select(Badge, UserBadge.awarded_at)
            .join(UserBadge, UserBadge.badge_id == Badge.id)
            .where(UserBadge.user_id == current_user.id)
            .order_by(UserBadge.awarded_at.desc())
        )
        .all()
    )

    earned_badges = [
        EarnedBadgeResponse(
            id=b.id,
            slug=b.slug,
            name=b.name,
            description=b.description,
            icon=b.icon,
            awarded_at=awarded_at,
        )
        for (b, awarded_at) in rows
    ]

    return UserGamificationResponse(
        stats=GamificationStatsResponse.model_validate(stats),
        earned_badges=earned_badges,
    )


@router.post("/me/email-change/request", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def request_email_change(
    body: EmailChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    new_email = str(body.new_email).strip().lower()
    current_email = (current_user.email or "").strip().lower()
    if new_email == current_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New email must be different")

    exists = db.execute(select(User.id).where(User.email.ilike(new_email))).scalar_one_or_none()
    if exists is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    current_user.pending_email = new_email
    db.commit()

    token = create_email_change_token(
        {"sub": str(current_user.id), "email": new_email, "type": "email_change"}
    )
    try:
        send_email_change_confirmation_email(new_email, current_user.full_name, token)
    except Exception:
        logger.exception("Failed to send email change confirmation email")

    return MessageResponse(message="Check your new email to confirm this change.")


@router.post("/me/email-change/verify", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def verify_email_change(
    body: EmailChangeVerifyRequest,
    db: Session = Depends(get_db),
):
    payload = decode_email_change_token(body.token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")

    user_id = payload.get("sub")
    token_email = payload.get("email")
    if not user_id or not token_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")

    try:
        user_uuid = uuid.UUID(str(user_id))
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.pending_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No pending email change")

    pending = user.pending_email.strip().lower()
    if pending != str(token_email).strip().lower():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")

    exists = (
        db.execute(select(User.id).where(User.email.ilike(pending), User.id != user.id))
        .scalar_one_or_none()
    )
    if exists is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user.email = pending
    user.pending_email = None
    user.is_verified = True
    db.commit()

    return MessageResponse(message="Email updated successfully.")

