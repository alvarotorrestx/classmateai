"""add share_links table

Revision ID: 6c3f2f0b1b2a
Revises: 8a4c0c6a1c1b
Create Date: 2026-05-06

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6c3f2f0b1b2a"
down_revision: Union[str, Sequence[str], None] = "8a4c0c6a1c1b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "share_links",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("owner_user_id", sa.UUID(), nullable=False),
        sa.Column("resource_type", sa.String(length=32), nullable=False),
        sa.Column("resource_id", sa.UUID(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_share_links_token", "share_links", ["token"], unique=True)

    # Reuse existing share link if active (revoked_at IS NULL).
    op.create_index(
        "uq_share_links_active_owner_type_id",
        "share_links",
        ["owner_user_id", "resource_type", "resource_id"],
        unique=True,
        postgresql_where=sa.text("revoked_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_share_links_active_owner_type_id", table_name="share_links")
    op.drop_index("ix_share_links_token", table_name="share_links")
    op.drop_table("share_links")

