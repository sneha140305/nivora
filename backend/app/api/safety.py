from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.safety import (
    UserBlockResponse,
    UserReportCreate,
    UserReportResponse,
)
from app.services.safety import (
    block_user,
    get_blocked_users,
    report_user,
    unblock_user,
)

router = APIRouter(
    prefix="/api/safety",
    tags=["Safety"],
)


@router.post(
    "/block/{user_id}",
    response_model=UserBlockResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_block(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return block_user(db, current_user.id, user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete("/block/{user_id}")
def remove_block(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return unblock_user(db, current_user.id, user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/blocked",
    response_model=list[UserBlockResponse],
)
def read_blocked_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_blocked_users(db, current_user.id)


@router.post(
    "/report/{user_id}",
    response_model=UserReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_report(
    user_id: int,
    report_data: UserReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return report_user(
            db=db,
            reporter_id=current_user.id,
            reported_user_id=user_id,
            reason=report_data.reason,
            description=report_data.description,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc