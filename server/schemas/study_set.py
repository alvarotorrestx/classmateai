import uuid
from datetime import datetime
from pydantic import BaseModel


class FlashcardResponse(BaseModel):
    id: uuid.UUID
    front: str
    back: str
    display_order: int

    model_config = {"from_attributes": True}


class QuizQuestionResponse(BaseModel):
    id: uuid.UUID
    question: str
    options: list[str]
    correct_index: int
    explanation: str | None
    display_order: int

    model_config = {"from_attributes": True}


class SummaryResponse(BaseModel):
    id: uuid.UUID
    content: str

    model_config = {"from_attributes": True}


class StudyGuideResponse(BaseModel):
    id: uuid.UUID
    content: str

    model_config = {"from_attributes": True}


class StudySetListResponse(BaseModel):
    """Lightweight response for list endpoints — omits summary/study_guide content."""
    id: uuid.UUID
    note_id: uuid.UUID | None
    label: str | None
    created_at: datetime
    flashcards: list[FlashcardResponse]
    quiz_questions: list[QuizQuestionResponse]

    model_config = {"from_attributes": True}


class StudySetResponse(BaseModel):
    id: uuid.UUID
    note_id: uuid.UUID | None
    label: str | None
    created_at: datetime
    flashcards: list[FlashcardResponse]
    quiz_questions: list[QuizQuestionResponse]
    summary: SummaryResponse | None
    study_guide: StudyGuideResponse | None

    model_config = {"from_attributes": True}
