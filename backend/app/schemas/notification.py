from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    actor_id: int
    notification_type: str
    title: str
    message: str
    link: str
    is_read: bool
    created_at: datetime


class NotificationReadUpdate(BaseModel):
    is_read: bool = True
