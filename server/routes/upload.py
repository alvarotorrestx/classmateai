from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, status
from models.user import User
from services.file_parser import extract_text
from utils.deps import get_current_user
from utils.rate_limit import limiter

router = APIRouter(tags=["upload"])

SUPPORTED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
}

MAX_BYTES = 4 * 1024 * 1024  # 4 MB (align with Vercel request body limits)


@router.post("/extract-text")
@limiter.limit("10/minute")
async def extract_text_from_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    data = await file.read()

    if len(data) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="This file is too large to upload. Please use a file under 4 MB or try again.",
        )

    try:
        text = extract_text(data, file.filename or "")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Could not parse file: {e}")

    text = text.strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No text could be extracted from this file")

    word_count = len(text.split())
    if word_count < 150:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Not enough content to generate a study set. Your file contains only {word_count} word{'s' if word_count != 1 else ''} — please upload at least 150 words of notes, such as a full lecture handout or chapter summary.",
        )

    return {"text": text}
