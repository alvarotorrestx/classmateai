"""add share_imports table

Revision ID: a3e4f5b6c7d8
Revises: c7b8d9e0f1a2
Create Date: 2026-05-07

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a3e4f5b6c7d8"
down_revision: Union[str, Sequence[str], None] = "c7b8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "share_imports",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("share_link_id", sa.UUID(), nullable=False),
        sa.Column("importer_user_id", sa.UUID(), nullable=False),
        sa.Column("imported_note_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["share_link_id"], ["share_links.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["importer_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["imported_note_id"], ["notes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("share_link_id", "importer_user_id", name="uq_share_imports_link_importer"),
    )


def downgrade() -> None:
    op.drop_table("share_imports")

