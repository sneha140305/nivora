from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.profile import LifestyleProfile
from app.schemas.matching import MatchingResponse, RoommateMatch
from app.services.matching import calculate_compatibility
from app.schemas.matching import (
    MatchingResponse,
    RoommateMatch,
    RoommateDetailResponse,
)

router = APIRouter(
    prefix="/api/matching",
    tags=["Roommate Matching"],
)


@router.get("/", response_model=MatchingResponse)
def discover_roommates(
    city: str | None = Query(default=None, min_length=1, max_length=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get the current user's lifestyle profile
    current_profile = (
        db.query(LifestyleProfile)
        .filter(LifestyleProfile.user_id == current_user.id)
        .first()
    )

    if not current_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please create your lifestyle profile first.",
        )

    # Use the requested city or default to the user's profile city
    target_city = city.strip() if city else current_profile.city

    if target_city is not None and not target_city:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="City cannot be empty.",
        )

    # Find other active users who have completed lifestyle profiles
    query = (
        db.query(User, LifestyleProfile)
        .join(
            LifestyleProfile,
            LifestyleProfile.user_id == User.id,
        )
        .filter(
            User.id != current_user.id,
            User.is_active.is_(True),
        )
    )

    if target_city:
        query = query.filter(
            func.lower(LifestyleProfile.city) == target_city.lower()
        )

    candidates = query.all()

    matches = []

    for candidate_user, candidate_profile in candidates:
        result = calculate_compatibility(
            current_profile,
            candidate_profile,
        )

        # Skip profiles without enough information to calculate a score
        if result["compatibility_score"] is None:
            continue

        matches.append(
            RoommateMatch(
                user_id=candidate_user.id,
                full_name=candidate_user.full_name,
                city=candidate_profile.city,
                occupation=candidate_profile.occupation,
                bio=candidate_profile.bio,
                budget_min=candidate_profile.budget_min,
                budget_max=candidate_profile.budget_max,
                sleep_time=candidate_profile.sleep_time,
                wake_time=candidate_profile.wake_time,
                compatibility_score=result["compatibility_score"],
                category_scores=result["category_scores"],
                matched_factors=result["matched_factors"],
                conflict_factors=result["conflict_factors"],
                message=result["message"],
            )
        )

    # Show the most compatible roommates first
    matches.sort(
        key=lambda match: match.compatibility_score,
        reverse=True,
    )

    return MatchingResponse(
        total_matches=len(matches),
        matches=matches,
    )

@router.get("/{user_id}", response_model=RoommateDetailResponse)
def get_roommate_details(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_profile = (
        db.query(LifestyleProfile)
        .filter(LifestyleProfile.user_id == current_user.id)
        .first()
    )

    if not current_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please create your lifestyle profile first.",
        )

    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot view yourself as a roommate match.",
        )

    result = (
        db.query(User, LifestyleProfile)
        .join(
            LifestyleProfile,
            LifestyleProfile.user_id == User.id,
        )
        .filter(
            User.id == user_id,
            User.is_active.is_(True),
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roommate not found.",
        )

    roommate, profile = result

    compatibility = calculate_compatibility(
        current_profile,
        profile,
    )

    if compatibility["compatibility_score"] is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insufficient information to calculate compatibility.",
        )

    return RoommateDetailResponse(
        user_id=roommate.id,
        full_name=roommate.full_name,
        city=profile.city,
        occupation=profile.occupation,
        bio=profile.bio,
        budget_min=profile.budget_min,
        budget_max=profile.budget_max,
        sleep_time=profile.sleep_time,
        wake_time=profile.wake_time,
        work_schedule=profile.work_schedule,
        cleanliness_level=profile.cleanliness_level,
        noise_tolerance=profile.noise_tolerance,
        food_preference=profile.food_preference,
        social_level=profile.social_level,
        guest_frequency=profile.guest_frequency,
        pets_allowed=profile.pets_allowed,
        compatibility_score=compatibility["compatibility_score"],
        category_scores=compatibility["category_scores"],
        matched_factors=compatibility["matched_factors"],
        conflict_factors=compatibility["conflict_factors"],
        message=compatibility["message"],
    )