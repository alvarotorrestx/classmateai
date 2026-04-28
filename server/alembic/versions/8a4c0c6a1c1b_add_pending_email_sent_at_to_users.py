"""add pending_email_sent_at to users

Revision ID: 8a4c0c6a1c1b
Revises: 2b9c1a7e0f3a
Create Date: 2026-04-28

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8a4c0c6a1c1b"
down_revision: Union[str, Sequence[str], None] = "2b9c1a7e0f3a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("pending_email_sent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "pending_email_sent_at")

