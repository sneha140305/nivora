from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.profile import (
    LifestyleProfileCreate,
    LifestyleProfileResponse,
    LifestyleProfileUpdate,
)
from app.services.profile import (
    create_profile,
    get_profile,
    update_profile,
)

router = APIRouter(prefix="/api/profile", tags=["Lifestyle Profile"])


@router.post(
    "/",
    response_model=LifestyleProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lifestyle_profile(
    profile_data: LifestyleProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return create_profile(db, current_user.id, profile_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get("/", response_model=LifestyleProfileResponse)
def read_lifestyle_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile(db, current_user.id)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lifestyle profile not found",
        )

    return profile


@router.put("/", response_model=LifestyleProfileResponse)
def edit_lifestyle_profile(
    profile_data: LifestyleProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = update_profile(db, current_user.id, profile_data)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lifestyle profile not found",
        )

    return profile