import uuid

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from db import get_db
from models.user import User
from utils.auth import decode_access_token

http_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    access_token_cookie: str | None = Cookie(default=None, alias="access_token"),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token: str | None = None
    if credentials is not None:
        token = credentials.credentials
    elif access_token_cookie:
        token = access_token_cookie

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.get(User, uuid.UUID(user_id))
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive",
        )
    return user

def get_current_user_optional(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    access_token_cookie: str | None = Cookie(default=None, alias="access_token"),
    db: Session = Depends(get_db),
) -> User | None:
    try:
        return get_current_user(
            request=request,
            credentials=credentials,
            access_token_cookie=access_token_cookie,
            db=db,
        )
    except HTTPException:
        return None
