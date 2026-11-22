from pydantic import BaseModel


class RoommateMatch(BaseModel):
    user_id: int
    full_name: str
    profile_photo_url: str | None = None
    city: str | None = None
    occupation: str | None = None
    bio: str | None = None

    budget_min: int | None = None
    budget_max: int | None = None

    sleep_time: str | None = None
    wake_time: str | None = None

    cleanliness_level: str | None = None
    food_preference: str | None = None

    compatibility_score: float
    category_scores: dict[str, float | None]

    matched_factors: list[str]
    conflict_factors: list[str]

    message: str


class MatchingResponse(BaseModel):
    total_matches: int
    matches: list[RoommateMatch]


class RoommateDetailResponse(RoommateMatch):
    work_schedule: str | None = None
    noise_tolerance: str | None = None
    social_level: str | None = None
    guest_frequency: str | None = None
    pets_allowed: bool | None = None