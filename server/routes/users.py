from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import get_db
from models.badge import Badge
from models.gamification_stats import GamificationStats
from models.user import User
from models.user_badge import UserBadge
from schemas.gamification import EarnedBadgeResponse, GamificationStatsResponse, UserGamificationResponse
from services.gamification import ensure_user_gamification_stats
from utils.deps import get_current_user


router = APIRouter(prefix="/users", tags=["users"])


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

