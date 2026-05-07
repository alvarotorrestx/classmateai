import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db import get_db
from models.course_study_guide import CourseStudyGuide
from models.flashcard import Flashcard
from models.note import Note
from models.quiz_question import QuizQuestion
from models.share_import import ShareImport
from models.share_link import ShareLink
from models.study_set import StudySet
from models.study_guide import StudyGuide
from models.summary import Summary
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

    study_set_count = db.execute(
        select(func.count(StudySet.id)).where(StudySet.note_id == note.id)
    ).scalar_one()
    flashcard_count = db.execute(
        select(func.count(Flashcard.id))
        .join(StudySet, StudySet.id == Flashcard.study_set_id)
        .where(StudySet.note_id == note.id)
    ).scalar_one()
    quiz_question_count = db.execute(
        select(func.count(QuizQuestion.id))
        .join(StudySet, StudySet.id == QuizQuestion.study_set_id)
        .where(StudySet.note_id == note.id)
    ).scalar_one()
    has_course_guide = (
        db.execute(select(func.count(CourseStudyGuide.id)).where(CourseStudyGuide.note_id == note.id)).scalar_one()
        > 0
    )
    has_set_guides = (
        db.execute(
            select(func.count(StudyGuide.id))
            .join(StudySet, StudySet.id == StudyGuide.study_set_id)
            .where(StudySet.note_id == note.id)
        ).scalar_one()
        > 0
    )
    has_study_guide = bool(has_course_guide or has_set_guides)

    return ShareNotePreviewResponse(
        token=link.token,
        resource_type=link.resource_type,
        title=note.title,
        content=note.content,
        study_set_count=int(study_set_count or 0),
        flashcard_count=int(flashcard_count or 0),
        quiz_question_count=int(quiz_question_count or 0),
        has_study_guide=has_study_guide,
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

    existing_import = (
        db.execute(
            select(ShareImport).where(
                ShareImport.share_link_id == link.id,
                ShareImport.importer_user_id == current_user.id,
            )
        )
        .scalars()
        .first()
    )
    if existing_import:
        return ShareImportResponse(
            message="Already imported.",
            note_id=existing_import.imported_note_id,
        )

    note = db.get(Note, link.resource_id)
    if not note:
        raise HTTPException(status_code=404, detail="Shared content not found")

    # Deep copy of the full study pack.
    try:
        new_note = Note(
            user_id=current_user.id,
            title=f"{note.title} (Shared)",
            content=note.content,
        )
        db.add(new_note)
        db.flush()

        course_guide = (
            db.execute(select(CourseStudyGuide).where(CourseStudyGuide.note_id == note.id))
            .scalars()
            .first()
        )
        if course_guide:
            db.add(CourseStudyGuide(note_id=new_note.id, content=course_guide.content))

        study_sets = (
            db.execute(select(StudySet).where(StudySet.note_id == note.id))
            .scalars()
            .all()
        )

        for ss in study_sets:
            new_ss = StudySet(
                user_id=current_user.id,
                note_id=new_note.id,
                label=ss.label,
            )
            db.add(new_ss)
            db.flush()

            # Flashcards
            cards = (
                db.execute(
                    select(Flashcard).where(Flashcard.study_set_id == ss.id).order_by(Flashcard.display_order.asc())
                )
                .scalars()
                .all()
            )
            for fc in cards:
                db.add(
                    Flashcard(
                        study_set_id=new_ss.id,
                        front=fc.front,
                        back=fc.back,
                        display_order=fc.display_order,
                    )
                )

            # Quiz questions
            questions = (
                db.execute(
                    select(QuizQuestion)
                    .where(QuizQuestion.study_set_id == ss.id)
                    .order_by(QuizQuestion.display_order.asc())
                )
                .scalars()
                .all()
            )
            for q in questions:
                db.add(
                    QuizQuestion(
                        study_set_id=new_ss.id,
                        question=q.question,
                        options=q.options,
                        correct_index=q.correct_index,
                        explanation=q.explanation,
                        display_order=q.display_order,
                    )
                )

            # Summary (optional)
            summary = (
                db.execute(select(Summary).where(Summary.study_set_id == ss.id))
                .scalars()
                .first()
            )
            if summary:
                db.add(Summary(study_set_id=new_ss.id, content=summary.content))

            sg = (
                db.execute(select(StudyGuide).where(StudyGuide.study_set_id == ss.id))
                .scalars()
                .first()
            )
            if sg:
                db.add(StudyGuide(study_set_id=new_ss.id, content=sg.content))

        # Record import to prevent duplicates
        db.add(
            ShareImport(
                share_link_id=link.id,
                importer_user_id=current_user.id,
                imported_note_id=new_note.id,
            )
        )

        db.commit()
        db.refresh(new_note)
    except IntegrityError:
        db.rollback()
        existing_import2 = (
            db.execute(
                select(ShareImport).where(
                    ShareImport.share_link_id == link.id,
                    ShareImport.importer_user_id == current_user.id,
                )
            )
            .scalars()
            .first()
        )
        if existing_import2:
            return ShareImportResponse(
                message="Already imported.",
                note_id=existing_import2.imported_note_id,
            )
        raise

    return ShareImportResponse(message="Study pack imported successfully.", note_id=new_note.id)

