import os
import sys

from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from db import SessionLocal
from utils.badge_seed import seed_default_badges


def main() -> None:
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
    with SessionLocal() as db:
        created = seed_default_badges(db)
        db.commit()
        print(f"Seeded {created} new badge(s).")


if __name__ == "__main__":
    main()

