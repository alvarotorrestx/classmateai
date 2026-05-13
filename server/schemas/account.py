from pydantic import BaseModel, EmailStr, field_validator


class MessageResponse(BaseModel):
    message: str


class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    current_password: str


class EmailChangeVerifyRequest(BaseModel):
    token: str


class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None  # base64 data URL, or None to clear

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 2 or len(v) > 100:
                raise ValueError("Name must be between 2 and 100 characters")
        return v

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, v):
        if v is not None and v != "" and not v.startswith("data:image/"):
            raise ValueError("Avatar must be a valid image data URL")
        return v

