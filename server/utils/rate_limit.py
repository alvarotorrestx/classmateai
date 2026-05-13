from slowapi import Limiter
from fastapi import Request


def _get_key(request: Request) -> str:
    """
    Rate-limit key: use the authenticated user's ID when available (from the
    access_token cookie), otherwise fall back to the client IP address.

    We read the user ID directly from the JWT payload without full validation
    so that this function stays lightweight and doesn't touch the database.
    The auth dependency is still responsible for full token verification.
    """
    token = request.cookies.get("access_token")
    if token:
        try:
            from jose import jwt
            import os
            payload = jwt.decode(
                token,
                os.environ["SECRET_KEY"],
                algorithms=["HS256"],
                options={"verify_exp": False},
            )
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass

    # Fall back to IP address for unauthenticated requests
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_get_key)
