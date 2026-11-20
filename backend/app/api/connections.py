from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.connection import (
    ConnectionRequestCreate,
    ConnectionRequestResponse,
    ConnectionRequestStatusUpdate,
    ConnectionRequestDetailResponse,
)
from app.services.connection import (
    send_connection_request,
    update_connection_request,
    get_connection_requests,
)

router = APIRouter(
    prefix="/api/connections",
    tags=["Connections"],
)


@router.post(
    "/",
    response_model=ConnectionRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_connection(
    request_data: ConnectionRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return send_connection_request(
            db,
            current_user.id,
            request_data.receiver_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/sent",
    response_model=list[ConnectionRequestDetailResponse],
)
def read_sent_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_connection_requests(db, current_user.id, "sent")


@router.get(
    "/received",
    response_model=list[ConnectionRequestDetailResponse],
)
def read_received_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_connection_requests(db, current_user.id, "received")


@router.patch(
    "/{request_id}",
    response_model=ConnectionRequestResponse,
)
def respond_to_connection(
    request_id: int,
    request_data: ConnectionRequestStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return update_connection_request(
            db,
            request_id,
            current_user.id,
            request_data.status,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc