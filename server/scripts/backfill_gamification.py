import os
import sys
import uuid

from dotenv import load_dotenv
from sqlalchemy import select

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from db import SessionLocal
from models.user import User
from services.gamification import (
    NON_STREAK_REQUIREMENT_TYPES,
    backfill_counts_for_user,
    check_and_award_badges,
    ensure_user_gamification_stats,
)
from utils.badge_seed import seed_default_badges


def main() -> None:
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

    award_badges = "--award-badges" in sys.argv

    with SessionLocal() as db:
        # ensures badge definitions exist so progress can be evaluated
        seed_default_badges(db)
        db.commit()

        users: list[User] = db.execute(select(User)).scalars().all()
        for u in users:
            user_id: uuid.UUID = u.id
            ensure_user_gamification_stats(db, user_id)
            backfill_counts_for_user(db, user_id)

            if award_badges:
                # Retro-award only badges derivable from counts/points (no streak-based).
                check_and_award_badges(db, user_id, allowed_requirement_types=NON_STREAK_REQUIREMENT_TYPES)

        db.commit()
        print(f"Backfilled gamification for {len(users)} user(s).")
        if award_badges:
            print("Awarded non-streak badges where requirements were met.")


if __name__ == "__main__":
    main()

