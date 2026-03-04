import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class QuizAttemptRequest(BaseModel):
    selected_index: int


class QuizAttemptResponse(BaseModel):
    id: uuid.UUID
    quiz_question_id: uuid.UUID
    selected_index: int
    is_correct: bool
    correct_index: int
    attempted_at: datetime

    model_config = {"from_attributes": True}


class FlashcardReviewRequest(BaseModel):
    confidence: int = Field(ge=1, le=4)


class FlashcardReviewResponse(BaseModel):
    id: uuid.UUID
    flashcard_id: uuid.UUID
    confidence: int
    reviewed_at: datetime

    model_config = {"from_attributes": True}
