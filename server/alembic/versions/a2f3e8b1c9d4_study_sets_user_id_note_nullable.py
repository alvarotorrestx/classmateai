"""study_sets: add user_id, make note_id nullable with SET NULL

Revision ID: a2f3e8b1c9d4
Revises: 1613ca85eff1
Create Date: 2026-03-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a2f3e8b1c9d4'
down_revision: Union[str, Sequence[str], None] = '1613ca85eff1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add user_id column (nullable first so existing rows don't immediately fail)
    op.add_column('study_sets', sa.Column('user_id', sa.UUID(), nullable=True))

    # 2. Back-fill user_id from the parent note
    op.execute("""
        UPDATE study_sets ss
        SET user_id = n.user_id
        FROM notes n
        WHERE ss.note_id = n.id
    """)

    # 3. Now enforce NOT NULL
    op.alter_column('study_sets', 'user_id', nullable=False)

    # 4. Add FK: user_id → users.id (CASCADE so deleting user still removes study sets)
    op.create_foreign_key(
        'study_sets_user_id_fkey',
        'study_sets', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE',
    )

    # 5. Drop the old note_id FK (CASCADE)
    op.drop_constraint('study_sets_note_id_fkey', 'study_sets', type_='foreignkey')

    # 6. Make note_id nullable
    op.alter_column('study_sets', 'note_id', nullable=True)

    # 7. Re-add note_id FK with SET NULL so study sets survive course deletion
    op.create_foreign_key(
        'study_sets_note_id_fkey',
        'study_sets', 'notes',
        ['note_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    # Reverse note_id FK
    op.drop_constraint('study_sets_note_id_fkey', 'study_sets', type_='foreignkey')
    op.alter_column('study_sets', 'note_id', nullable=False)
    op.create_foreign_key(
        'study_sets_note_id_fkey',
        'study_sets', 'notes',
        ['note_id'], ['id'],
        ondelete='CASCADE',
    )

    # Remove user_id
    op.drop_constraint('study_sets_user_id_fkey', 'study_sets', type_='foreignkey')
    op.drop_column('study_sets', 'user_id')
