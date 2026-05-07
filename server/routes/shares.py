import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db import get_db
from models.note import Note
from models.share_link import ShareLink
from models.user import User
from schemas.share import (
    ShareCreateRequest,
    ShareCreateResponse,
    ShareImportResponse,
    ShareNotePreviewResponse,
)
from utils.deps import get_current_user, get_current_user_optional


router = APIRouter(prefix="/shares", tags=["shares"])


def _is_active(link: ShareLink) -> bool:
    if link.revoked_at is not None:
        return False
    if link.expires_at is not None:
        exp = link.expires_at if link.expires_at.tzinfo is not None else link.expires_at.replace(tzinfo=timezone.utc)
        if exp <= datetime.now(timezone.utc):
            return False
    return True


@router.post("", response_model=ShareCreateResponse, status_code=status.HTTP_201_CREATED)
def create_share_link(
    body: ShareCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource_type = (body.resource_type or "").strip().lower()
    if resource_type != "note":
        raise HTTPException(status_code=400, detail="Unsupported resource type")

    note = db.get(Note, body.resource_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Note not found")

    existing = (
        db.execute(
            select(ShareLink)
            .where(
                ShareLink.owner_user_id == current_user.id,
                ShareLink.resource_type == resource_type,
                ShareLink.resource_id == body.resource_id,
                ShareLink.revoked_at.is_(None),
            )
        )
        .scalars()
        .first()
    )
    if existing and _is_active(existing):
        return ShareCreateResponse(
            token=existing.token,
            resource_type=existing.resource_type,
            resource_id=existing.resource_id,
            created_at=existing.created_at,
            expires_at=existing.expires_at,
        )

    token = secrets.token_urlsafe(18)
    link = ShareLink(
        token=token,
        owner_user_id=current_user.id,
        resource_type=resource_type,
        resource_id=body.resource_id,
    )
    db.add(link)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing2 = (
            db.execute(
                select(ShareLink)
                .where(
                    ShareLink.owner_user_id == current_user.id,
                    ShareLink.resource_type == resource_type,
                    ShareLink.resource_id == body.resource_id,
                    ShareLink.revoked_at.is_(None),
                )
            )
            .scalars()
            .first()
        )
        if existing2 and _is_active(existing2):
            return ShareCreateResponse(
                token=existing2.token,
                resource_type=existing2.resource_type,
                resource_id=existing2.resource_id,
                created_at=existing2.created_at,
                expires_at=existing2.expires_at,
            )
        raise

    db.refresh(link)
    return ShareCreateResponse(
        token=link.token,
        resource_type=link.resource_type,
        resource_id=link.resource_id,
        created_at=link.created_at,
        expires_at=link.expires_at,
    )


@router.get("/{token}", response_model=ShareNotePreviewResponse)
def get_share_preview(
    token: str,
    db: Session = Depends(get_db),
    _current_user: User | None = Depends(get_current_user_optional),
):
    link = db.execute(select(ShareLink).where(ShareLink.token == token)).scalars().first()
    if not link or not _is_active(link):
        raise HTTPException(status_code=404, detail="Share link not found")

    if link.resource_type != "note":
        raise HTTPException(status_code=404, detail="Share link not found")

    note = db.get(Note, link.resource_id)
    if not note:
        raise HTTPException(status_code=404, detail="Shared content not found")

    return ShareNotePreviewResponse(
        token=link.token,
        resource_type=link.resource_type,
        title=note.title,
        content=note.content,
        created_at=link.created_at,
        expires_at=link.expires_at,
    )


@router.post("/{token}/import", response_model=ShareImportResponse)
def import_shared_content(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = db.execute(select(ShareLink).where(ShareLink.token == token)).scalars().first()
    if not link or not _is_active(link):
        raise HTTPException(status_code=404, detail="Share link not found")

    if link.owner_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't import your own shared content")

    if link.resource_type != "note":
        raise HTTPException(status_code=400, detail="Unsupported resource type")

    note = db.get(Note, link.resource_id)
    if not note:
        raise HTTPException(status_code=404, detail="Shared content not found")

    new_note = Note(
        user_id=current_user.id,
        title=f"{note.title} (Shared)",
        content=note.content,
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return ShareImportResponse(message="Added to your account.", note_id=new_note.id)

