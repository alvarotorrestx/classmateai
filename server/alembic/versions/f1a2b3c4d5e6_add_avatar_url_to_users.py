"""add avatar_url to users

Revision ID: f1a2b3c4d5e6
Revises: 8a4c0c6a1c1b
Create Date: 2026-04-30

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "8a4c0c6a1c1b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
