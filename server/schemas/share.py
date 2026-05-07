import uuid
from datetime import datetime
from pydantic import BaseModel


class ShareCreateRequest(BaseModel):
    resource_type: str
    resource_id: uuid.UUID


class ShareCreateResponse(BaseModel):
    token: str
    resource_type: str
    resource_id: uuid.UUID
    created_at: datetime
    expires_at: datetime | None = None


class ShareNotePreviewResponse(BaseModel):
    token: str
    resource_type: str
    title: str
    content: str
    created_at: datetime
    expires_at: datetime | None = None


class ShareImportResponse(BaseModel):
    message: str
    note_id: uuid.UUID

