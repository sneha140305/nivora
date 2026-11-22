from datetime import datetime, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.connection import ConnectionRequest
from app.models.profile import LifestyleProfile
from app.models.user import User
from app.services.notification import create_notification


def send_connection_request(
    db: Session,
    sender_id: int,
    receiver_id: int,
):
    if sender_id == receiver_id:
        raise ValueError("You cannot send a connection request to yourself.")

    receiver = (
        db.query(User)
        .filter(User.id == receiver_id, User.is_active.is_(True))
        .first()
    )

    if not receiver:
        raise ValueError("User not found or inactive.")

    receiver_profile = (
        db.query(LifestyleProfile)
        .filter(LifestyleProfile.user_id == receiver_id)
        .first()
    )

    if not receiver_profile:
        raise ValueError(
            "This user does not have a completed lifestyle profile."
        )

    existing = (
        db.query(ConnectionRequest)
        .filter(
            or_(
                (
                    (ConnectionRequest.sender_id == sender_id)
                    & (ConnectionRequest.receiver_id == receiver_id)
                ),
                (
                    (ConnectionRequest.sender_id == receiver_id)
                    & (ConnectionRequest.receiver_id == sender_id)
                ),
            )
        )
        .all()
    )

    for request in existing:
        if request.status == "accepted":
            raise ValueError("You are already connected with this user.")

        if request.status == "pending":
            if request.sender_id == sender_id:
                raise ValueError("You have already sent a request to this user.")

            raise ValueError(
                "This user has already sent you a request. "
                "Check received requests."
            )

    # Allow previously rejected requests to be sent again.
    for request in existing:
        if request.status == "rejected":
            request.sender_id = sender_id
            request.receiver_id = receiver_id
            request.status = "pending"
            request.created_at = datetime.now(timezone.utc)

            create_notification(
                db=db,
                user_id=receiver_id,
                actor_id=sender_id,
                notification_type="connection_request",
                title="New Connection Request",
                message="Someone wants to connect with you on NIVORA.",
                link="/connections",
            )

            db.commit()
            db.refresh(request)
            return request

    connection = ConnectionRequest(
        sender_id=sender_id,
        receiver_id=receiver_id,
        status="pending",
    )

    db.add(connection)

    create_notification(
        db=db,
        user_id=receiver_id,
        actor_id=sender_id,
        notification_type="connection_request",
        title="New Connection Request",
        message="Someone wants to connect with you on NIVORA.",
        link="/connections",
    )

    db.commit()
    db.refresh(connection)

    return connection


def update_connection_request(
    db: Session,
    request_id: int,
    current_user_id: int,
    new_status: str,
):
    request = (
        db.query(ConnectionRequest)
        .filter(ConnectionRequest.id == request_id)
        .first()
    )

    if not request:
        raise ValueError("Connection request not found.")

    if request.receiver_id != current_user_id:
        raise PermissionError("You can only respond to requests sent to you.")

    if request.status != "pending":
        raise ValueError("This request has already been processed.")

    request.status = new_status

    if new_status == "accepted":
        create_notification(
            db=db,
            user_id=request.sender_id,
            actor_id=current_user_id,
            notification_type="connection_accepted",
            title="Connection Accepted",
            message="Your connection request has been accepted!",
            link="/connections",
        )

    db.commit()
    db.refresh(request)

    return request


def get_connection_requests(
    db: Session,
    user_id: int,
    direction: str,
):
    if direction == "sent":
        other_user_id = ConnectionRequest.receiver_id
        filters = ConnectionRequest.sender_id == user_id
    else:
        other_user_id = ConnectionRequest.sender_id
        filters = ConnectionRequest.receiver_id == user_id

    results = (
        db.query(
            ConnectionRequest,
            User,
            LifestyleProfile.city,
            LifestyleProfile.occupation,
            LifestyleProfile.bio,
            User.profile_photo_url,
        )
        .join(User, User.id == other_user_id)
        .outerjoin(
            LifestyleProfile,
            LifestyleProfile.user_id == User.id,
        )
        .filter(filters)
        .order_by(ConnectionRequest.created_at.desc())
        .all()
    )

    requests = []

    for connection, user, city, occupation, bio, profile_photo_url in results:
        requests.append(
            {
                "id": connection.id,
                "status": connection.status,
                "created_at": connection.created_at,
                "user": {
                    "id": user.id,
                    "full_name": user.full_name,
                    "city": city,
                    "occupation": occupation,
                    "bio": bio,
                    "profile_photo_url": profile_photo_url,
                },
            }
        )

    return requests