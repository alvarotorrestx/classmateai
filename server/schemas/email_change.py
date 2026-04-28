from pydantic import BaseModel, EmailStr


class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    current_password: str


class EmailChangeVerifyRequest(BaseModel):
    token: str


class MessageResponse(BaseModel):
    message: str

