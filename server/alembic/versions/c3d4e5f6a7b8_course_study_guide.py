"""Add course_study_guides table

Revision ID: c3d4e5f6a7b8
Revises: a2f3e8b1c9d4
Create Date: 2026-03-19 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'a2f3e8b1c9d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'course_study_guides',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('note_id', sa.UUID(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('note_id'),
    )


def downgrade() -> None:
    op.drop_table('course_study_guides')