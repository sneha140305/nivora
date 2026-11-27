from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ReportReason = Literal[
    "inappropriate_behavior",
    "fake_profile",
    "harassment",
    "spam",
    "safety_concern",
    "other",
]


class UserBlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    blocker_id: int
    blocked_id: int
    created_at: datetime


class UserReportCreate(BaseModel):
    reason: ReportReason
    description: str | None = Field(default=None, max_length=1000)


class UserReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reporter_id: int
    reported_user_id: int
    reason: ReportReason
    description: str | None
    created_at: datetime