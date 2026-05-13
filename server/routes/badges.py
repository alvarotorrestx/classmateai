from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
from models.user import User
from schemas.gamification import BadgeWithProgressResponse
from services.gamification import get_user_badge_progress
from utils.deps import get_current_user_optional


router = APIRouter(prefix="/badges", tags=["badges"])


@router.get("", response_model=list[BadgeWithProgressResponse])
def list_badges(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    if current_user is None:
        # fail safe if the user is not authenticated
        data = get_user_badge_progress(db, user_id=None)
    else:
        data = get_user_badge_progress(db, current_user.id)

    out: list[BadgeWithProgressResponse] = []
    for b in data:
        current = b.get("progress_current")
        target = b.get("progress_target")
        req_type = b.get("requirement_type")
        label = None
        if current is not None and target is not None:
            suffix = req_type.replace("_", " ")
            label = f"{current} / {target} {suffix}"
        out.append(
            BadgeWithProgressResponse(
                id=b["id"],
                slug=b["slug"],
                name=b["name"],
                description=b["description"],
                icon=b["icon"],
                requirement_type=b["requirement_type"],
                requirement_value=b["requirement_value"],
                points_reward=b["points_reward"],
                earned=b["earned"],
                awarded_at=b["awarded_at"],
                progress_current=b["progress_current"],
                progress_target=b["progress_target"],
                progress_label=label,
            )
        )
    return out

