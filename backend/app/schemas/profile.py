from pydantic import BaseModel, ConfigDict, Field
from typing import Literal
from datetime import time
from pydantic import field_validator, model_validator

class LifestyleProfileCreate(BaseModel):
    city: str | None = Field(default=None, max_length=100)

    occupation: Literal[
        "student",
        "working_professional",
        "freelancer",
        "other",
    ] | None = None

    bio: str | None = Field(default=None, max_length=500)

    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)

    sleep_time: str | None = None
    wake_time: str | None = None

    work_schedule: Literal[
        "day_shift",
        "night_shift",
        "flexible",
        "remote",
        "not_applicable",
    ] | None = None

    cleanliness_level: Literal[
        "very_clean",
        "moderate",
        "relaxed",
    ] | None = None

    noise_tolerance: Literal[
        "low",
        "medium",
        "high",
    ] | None = None

    food_preference: Literal[
        "vegetarian",
        "non_vegetarian",
        "vegan",
        "eggetarian",
        "no_preference",
    ] | None = None

    social_level: Literal[
        "introvert",
        "balanced",
        "extrovert",
    ] | None = None

    guest_frequency: Literal[
        "rarely",
        "sometimes",
        "frequently",
    ] | None = None

    pets_allowed: bool | None = None

    @field_validator("sleep_time", "wake_time")
    @classmethod
    def validate_time_format(cls, value):
        if value is None:
            return value

        try:
            time.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("Time must use HH:MM format") from exc

        return value

    @field_validator("city")
    @classmethod
    def validate_city(cls, value):
        if value is not None and not value.strip():
            raise ValueError("City cannot be empty")

        return value.strip() if value else value

    @model_validator(mode="after")
    def validate_budget(self):
        if (
            self.budget_min is not None
            and self.budget_max is not None
            and self.budget_min > self.budget_max
        ):
            raise ValueError(
                "Minimum budget cannot exceed maximum budget"
            )

        return self


class LifestyleProfileResponse(LifestyleProfileCreate):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class LifestyleProfileUpdate(LifestyleProfileCreate):
    pass