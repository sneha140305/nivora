from sqlalchemy.orm import Session

from app.models.profile import LifestyleProfile
from app.schemas.profile import (
    LifestyleProfileCreate,
    LifestyleProfileUpdate,
)


def create_profile(
    db: Session,
    user_id: int,
    profile_data: LifestyleProfileCreate,
) -> LifestyleProfile:
    existing_profile = (
        db.query(LifestyleProfile)
        .filter(LifestyleProfile.user_id == user_id)
        .first()
    )

    if existing_profile:
        raise ValueError("Lifestyle profile already exists")

    new_profile = LifestyleProfile(
        user_id=user_id,
        **profile_data.model_dump(),
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


def get_profile(
    db: Session,
    user_id: int,
) -> LifestyleProfile | None:
    return (
        db.query(LifestyleProfile)
        .filter(LifestyleProfile.user_id == user_id)
        .first()
    )


def update_profile(
    db: Session,
    user_id: int,
    profile_data: LifestyleProfileUpdate,
) -> LifestyleProfile | None:
    profile = get_profile(db, user_id)

    if not profile:
        return None

    update_data = profile_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile