"""merge heads: share_links + avatar_url

Revision ID: c7b8d9e0f1a2
Revises: 6c3f2f0b1b2a, f1a2b3c4d5e6
Create Date: 2026-05-06

"""

from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "c7b8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = ("6c3f2f0b1b2a", "f1a2b3c4d5e6")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Merge-only revision (no-op)
    pass


def downgrade() -> None:
    # Merge-only revision (no-op)
    pass

