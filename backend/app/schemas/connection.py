from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ConnectionRequestCreate(BaseModel):
    receiver_id: int = Field(gt=0)


class ConnectionRequestStatusUpdate(BaseModel):
    status: Literal["accepted", "rejected"]


class ConnectionRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    receiver_id: int
    status: Literal["pending", "accepted", "rejected"]
    created_at: datetime


class ConnectionRequestUserResponse(BaseModel):
    id: int
    full_name: str
    city: str | None = None
    occupation: str | None = None
    bio: str | None = None
    profile_photo_url: str | None = None


class ConnectionRequestDetailResponse(BaseModel):
    id: int
    status: Literal["pending", "accepted", "rejected"]
    created_at: datetime
    user: ConnectionRequestUserResponse