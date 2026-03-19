from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from models.user import User
from services.file_parser import extract_text
from utils.deps import get_current_user

router = APIRouter(tags=["upload"])

SUPPORTED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/markdown",
}

MAX_BYTES = 20 * 1024 * 1024  # 20 MB


@router.post("/extract-text")
async def extract_text_from_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    data = await file.read()

    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds 20 MB limit")

    try:
        text = extract_text(data, file.filename or "")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Could not parse file: {e}")

    if not text or not text.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No text could be extracted from this file")

    return {"text": text.strip()}