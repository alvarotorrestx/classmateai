import uuid
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import get_db
from models.badge import Badge
from models.gamification_stats import GamificationStats
from models.user import User
from models.user_badge import UserBadge
from schemas.account import EmailChangeRequest, EmailChangeVerifyRequest, MessageResponse, UpdatePasswordRequest, ProfileUpdateRequest
from schemas.auth import UserResponse
from schemas.gamification import EarnedBadgeResponse, GamificationStatsResponse, UserGamificationResponse
from services.gamification import ensure_user_gamification_stats
from utils.deps import get_current_user
from utils.auth import verify_password, create_email_change_token, decode_email_change_token
from utils.auth import hash_password
from utils.email import send_email_change_confirmation_email


router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)


@router.patch("/me/profile", response_model=UserResponse)
def update_my_profile(
    body: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if "avatar_url" in body.model_fields_set:
        # Allow explicit None to clear the avatar
        current_user.avatar_url = body.avatar_url or None
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter the correct current password.",
        )

    new_email = str(body.new_email).strip().lower()
    current_email = (current_user.email or "").strip().lower()
    if new_email == current_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New email must be different")

    exists = db.execute(select(User.id).where(User.email.ilike(new_email))).scalar_one_or_none()
    if exists is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Cooldown: if requesting the same pending email again, avoid resending within 10 minutes.
    if (current_user.pending_email or "").strip().lower() == new_email:
        sent_at = current_user.pending_email_sent_at
        if sent_at is not None:
            now = datetime.now(timezone.utc)
            # Ensure both timestamps are comparable
            sent_at_utc = sent_at if sent_at.tzinfo is not None else sent_at.replace(tzinfo=timezone.utc)
            if now - sent_at_utc < timedelta(minutes=10):
                return MessageResponse(
                    message="A confirmation email was recently sent. Please check your inbox to confirm this change."
                )

    current_user.pending_email = new_email
    current_user.pending_email_sent_at = datetime.now(timezone.utc)
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
    user.pending_email_sent_at = None
    user.is_verified = True
    db.commit()

    return MessageResponse(message="Email updated successfully.")


@router.post("/me/password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def update_my_password(
    body: UpdatePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter the correct current password.",
        )

    new_password = (body.new_password or "").strip()
    if len(new_password) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 10 characters.",
        )

    if verify_password(new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password.",
        )

    current_user.password_hash = hash_password(new_password)
    db.commit()

    return MessageResponse(message="Password updated successfully.")

