from pydantic import BaseModel, EmailStr


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

