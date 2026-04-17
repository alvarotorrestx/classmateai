import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, load_only

from db import get_db
from models.course_study_guide import CourseStudyGuide
from models.flashcard import Flashcard
from models.note import Note
from models.quiz_question import QuizQuestion
from models.study_guide import StudyGuide
from models.study_set import StudySet
from models.summary import Summary
from models.user import User
from schemas.note import NoteCreate, NoteListResponse, NoteResponse, NoteUpdate
from schemas.study_set import StudySetResponse
from services.ai import generate_study_materials, generate_course_study_guide, GeminiRateLimitError
from utils.deps import get_current_user
from utils.rate_limit import limiter


class NoteContentAdd(BaseModel):
    content: str


class CourseStudyGuideResponse(BaseModel):
    content: str
    model_config = {"from_attributes": True}

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteListResponse])
def list_notes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Note)
        .filter(Note.user_id == current_user.id)
        .options(load_only(Note.id, Note.title, Note.created_at, Note.updated_at))
        .all()
    )


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(body: NoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = Note(user_id=current_user.id, title=body.title, content=body.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(note_id: uuid.UUID, body: NoteUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if body.title is not None:
        note.title = body.title
    if body.content is not None:
        note.content = body.content
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: uuid.UUID,
    delete_course: bool = True,
    delete_flashcards: bool = True,
    delete_quizzes: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    # Collect study set IDs via a scalar query to avoid loading full ORM objects
    # (loading them would confuse SQLAlchemy's cascade processing later)
    study_set_ids = [
        row[0] for row in db.query(StudySet.id).filter(StudySet.note_id == note.id)
    ]

    if study_set_ids:
        if delete_flashcards:
            db.query(Flashcard).filter(
                Flashcard.study_set_id.in_(study_set_ids)
            ).delete(synchronize_session=False)

        if delete_quizzes:
            db.query(QuizQuestion).filter(
                QuizQuestion.study_set_id.in_(study_set_ids)
            ).delete(synchronize_session=False)

    if delete_course:
        # Explicitly detach study sets from the note BEFORE deleting the note.
        # This prevents any cascade (DB or ORM) from touching the study sets at all.
        # Surviving flashcards/quizzes remain accessible via user_id ownership.
        if study_set_ids:
            db.query(StudySet).filter(
                StudySet.id.in_(study_set_ids)
            ).update({"note_id": None, "label": note.title}, synchronize_session=False)
        db.flush()  # commit the NULLs before the note DELETE
        db.delete(note)

    db.commit()


@router.post("/{note_id}/add-content", response_model=StudySetResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def add_content_to_note(
    request: Request,
    note_id: uuid.UUID,
    body: NoteContentAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    word_count = len(body.content.split())
    if word_count < 150:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Not enough content to generate a study set. Your file contains only {word_count} word{'s' if word_count != 1 else ''} — please upload at least 150 words of notes.",
        )

    # Append new content to the note so the full history is preserved
    note.content = note.content + "\n\n---\n\n" + body.content
    db.flush()

    # Generate study set from the NEW content only (fresh flashcards/quizzes for new material)
    try:
        data = generate_study_materials(body.content)
    except GeminiRateLimitError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI generation failed: {e}")

    study_set = StudySet(note_id=note.id, user_id=current_user.id)
    db.add(study_set)
    db.flush()

    for i, fc in enumerate(data["flashcards"]):
        db.add(Flashcard(study_set_id=study_set.id, front=fc["front"], back=fc["back"], display_order=i))

    for i, qq in enumerate(data["quiz_questions"]):
        db.add(QuizQuestion(
            study_set_id=study_set.id,
            question=qq["question"],
            options=qq["options"],
            correct_index=qq["correct_index"],
            explanation=qq.get("explanation"),
            display_order=i,
        ))

    db.add(Summary(study_set_id=study_set.id, content=data["summary"]))
    db.add(StudyGuide(study_set_id=study_set.id, content=data["study_guide"]))

    # Regenerate the course-level study guide from the full accumulated content
    try:
        guide_content = generate_course_study_guide(note.content)
        existing = db.query(CourseStudyGuide).filter(CourseStudyGuide.note_id == note.id).first()
        if existing:
            existing.content = guide_content
        else:
            db.add(CourseStudyGuide(note_id=note.id, content=guide_content))
    except Exception:
        pass  # Don't fail the whole request if guide update fails

    db.commit()
    db.refresh(study_set)
    return study_set


@router.get("/{note_id}/study-guide", response_model=CourseStudyGuideResponse)
def get_course_study_guide(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    guide = db.query(CourseStudyGuide).filter(CourseStudyGuide.note_id == note.id).first()
    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No study guide yet")
    return guide
