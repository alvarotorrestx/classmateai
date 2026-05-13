import os
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status, Response, Cookie
from sqlalchemy.orm import Session

from db import get_db
from models.user import User
from schemas.auth import AuthResponse, UserLogin, UserRegister, UserResponse, SessionResponse, MessageResponse, VerifyEmailRequest, ResendVerificationRequest
from utils.auth import create_access_token, create_refresh_token, hash_password, verify_password, decode_refresh_token, create_email_verification_token, decode_email_verification_token
from utils.deps import get_current_user
from utils.email import send_verification_email
from utils.rate_limit import limiter
from utils.redirects import is_safe_internal_redirect

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "10080")) # 7 days

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
logger = logging.getLogger(__name__)


def _normalized_samesite_for_cookie() -> str:
    """Starlette delete_cookie / set_cookie expect lax|strict|none (lowercase)."""
    ss = (COOKIE_SAMESITE or "lax").strip().lower()
    if ss not in ("lax", "strict", "none"):
        return "lax"
    return ss


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=_normalized_samesite_for_cookie(),
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=_normalized_samesite_for_cookie(),
        max_age=REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        path="/auth",
    )


def clear_auth_cookies(response: Response):
    ss = _normalized_samesite_for_cookie()
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=COOKIE_SECURE,
        httponly=True,
        samesite=ss,
    )
    response.delete_cookie(
        key="refresh_token",
        path="/auth",
        secure=COOKIE_SECURE,
        httponly=True,
        samesite=ss,
    )


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, body: UserRegister, response: Response, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_email_verification_token({"sub": str(user.id), "email": user.email})
    try:
        redirect = body.redirect if is_safe_internal_redirect(body.redirect) else None
        send_verification_email(user.email, user.full_name, token, redirect=redirect)
    except Exception:
        # Avoid blocking account creation if email fails; allow resend endpoint.
        logger.exception("Failed to send verification email")

    return MessageResponse(message="Account created. Please verify your email to log in.")

@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login(request: Request, body: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive",
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )
        
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    set_auth_cookies(response, access_token, refresh_token)

    return AuthResponse(user=UserResponse.model_validate(user), message="Logged in successfully")

@router.post("/refresh", response_model=AuthResponse)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    payload = decode_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    try:
        user_uuid = uuid.UUID(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == user_uuid).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

    set_auth_cookies(response, new_access_token, new_refresh_token)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        message="Token refreshed",
    )

@router.post("/logout")
def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}

# used by the frontend to rehydrate auth state on page load
@router.get("/session", response_model=SessionResponse)
def get_session(current_user: User = Depends(get_current_user)):
    return SessionResponse(user=UserResponse.model_validate(current_user))


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    payload = decode_email_verification_token(body.token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user_id = payload.get("sub")
    token_email = payload.get("email")
    if not user_id or not token_email:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    try:
        user_uuid = uuid.UUID(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid verification token")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email.lower() != str(token_email).lower():
        raise HTTPException(status_code=400, detail="Invalid verification token")

    if user.is_verified:
        return MessageResponse(message="Email already verified.")

    user.is_verified = True
    db.commit()

    return MessageResponse(message="Email verified successfully. You can now log in.")


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("3/minute")
def resend_verification(request: Request, body: ResendVerificationRequest, db: Session = Depends(get_db)):
    generic = MessageResponse(message="If an account exists, a verification email has been sent.")

    user = db.query(User).filter(User.email == body.email).first()
    if not user or user.is_verified is True:
        return generic

    token = create_email_verification_token({"sub": str(user.id), "email": user.email})
    try:
        send_verification_email(user.email, user.full_name, token)
    except Exception:
        logger.exception("Failed to resend verification email")
        return generic

    return generic