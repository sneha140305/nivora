from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models import ConnectionRequest, Message, User
from app.schemas.message import (
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from app.services.notification import create_notification

router = APIRouter(prefix="/api/messages", tags=["Messages"])


def verify_accepted_connection(
    db: Session,
    current_user_id: int,
    other_user_id: int,
):
    connection = (
        db.query(ConnectionRequest)
        .filter(
            ConnectionRequest.status == "accepted",
            or_(
                and_(
                    ConnectionRequest.sender_id == current_user_id,
                    ConnectionRequest.receiver_id == other_user_id,
                ),
                and_(
                    ConnectionRequest.sender_id == other_user_id,
                    ConnectionRequest.receiver_id == current_user_id,
                ),
            ),
        )
        .first()
    )

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging is allowed only between accepted connections.",
        )


@router.post(
    "/chat/{user_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    user_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot message yourself.",
        )

    recipient = db.query(User).filter(User.id == user_id).first()

    if not recipient or not recipient.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    verify_accepted_connection(db, current_user.id, user_id)

    message = Message(
        sender_id=current_user.id,
        recipient_id=user_id,
        content=message_data.content.strip(),
    )

    if not message.content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message cannot be empty.",
        )
    
    db.add(message)

    create_notification(
        db=db,
        user_id=user_id,
        actor_id=current_user.id,
        notification_type="new_message",
        title="New Message",
        message=f"{current_user.full_name} sent you a message.",
        link=f"/messages/{current_user.id}",
    )

    db.commit()
    db.refresh(message)
    return message


@router.get(
    "/conversations",
    response_model=list[ConversationResponse],
)
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accepted_connections = (
        db.query(ConnectionRequest)
        .filter(
            ConnectionRequest.status == "accepted",
            or_(
                ConnectionRequest.sender_id == current_user.id,
                ConnectionRequest.receiver_id == current_user.id,
            ),
        )
        .all()
    )

    connected_user_ids = {
        connection.receiver_id
        if connection.sender_id == current_user.id
        else connection.sender_id
        for connection in accepted_connections
    }

    conversations = []

    for user_id in connected_user_ids:
        other_user = db.query(User).filter(User.id == user_id).first()

        if not other_user or not other_user.is_active:
            continue

        last_message = (
            db.query(Message)
            .filter(
                or_(
                    and_(
                        Message.sender_id == current_user.id,
                        Message.recipient_id == user_id,
                    ),
                    and_(
                        Message.sender_id == user_id,
                        Message.recipient_id == current_user.id,
                    ),
                )
            )
            .order_by(desc(Message.created_at), desc(Message.id))
            .first()
        )

        if not last_message:
            continue

        unread_count = (
            db.query(func.count(Message.id))
            .filter(
                Message.sender_id == user_id,
                Message.recipient_id == current_user.id,
                Message.read_at.is_(None),
            )
            .scalar()
        )

        conversations.append(
            ConversationResponse(
                user_id=user_id,
                full_name=other_user.full_name,
                last_message=last_message.content,
                last_message_at=last_message.created_at,
                unread_count=unread_count or 0,
            )
        )

    conversations.sort(
        key=lambda conversation: conversation.last_message_at,
        reverse=True,
    )

    return conversations


@router.get(
    "/chat/{user_id}",
    response_model=list[MessageResponse],
)
def get_messages(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid conversation.",
        )

    verify_accepted_connection(db, current_user.id, user_id)

    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(
                    Message.sender_id == current_user.id,
                    Message.recipient_id == user_id,
                ),
                and_(
                    Message.sender_id == user_id,
                    Message.recipient_id == current_user.id,
                ),
            )
        )
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )

    return messages


@router.patch(
    "/chat/{user_id}/read",
    status_code=status.HTTP_200_OK,
)
def mark_messages_as_read(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid conversation.",
        )

    verify_accepted_connection(db, current_user.id, user_id)

    unread_messages = (
        db.query(Message)
        .filter(
            Message.sender_id == user_id,
            Message.recipient_id == current_user.id,
            Message.read_at.is_(None),
        )
        .all()
    )

    read_time = datetime.now(timezone.utc)

    for message in unread_messages:
        message.read_at = read_time

    db.commit()

    return {
        "message": "Messages marked as read.",
        "updated_count": len(unread_messages),
    }
