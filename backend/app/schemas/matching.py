from pydantic import BaseModel


class RoommateMatch(BaseModel):
    user_id: int
    full_name: str

    city: str | None = None
    occupation: str | None = None
    bio: str | None = None

    budget_min: int | None = None
    budget_max: int | None = None

    sleep_time: str | None = None
    wake_time: str | None = None

    compatibility_score: float
    category_scores: dict[str, float | None]

    matched_factors: list[str]
    conflict_factors: list[str]

    message: str


class MatchingResponse(BaseModel):
    total_matches: int
    matches: list[RoommateMatch]