import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import get_db
from models.flashcard import Flashcard
from models.note import Note
from models.quiz_question import QuizQuestion
from models.study_set import StudySet
from models.user import User
from schemas.note import NoteCreate, NoteResponse, NoteUpdate
from utils.deps import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteResponse])
def list_notes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Note).filter(Note.user_id == current_user.id).all()


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
