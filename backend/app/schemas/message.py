from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=2000,
        description="Message content",
    )


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    recipient_id: int
    content: str
    created_at: datetime
    read_at: datetime | None


class ConversationResponse(BaseModel):
    user_id: int
    full_name: str
    profile_photo_url: str | None = None
    last_message: str
    last_message_at: datetime
    unread_count: int