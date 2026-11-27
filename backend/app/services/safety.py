from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.connection import ConnectionRequest
from app.models.user import User
from app.models.user_block import UserBlock
from app.models.user_report import UserReport


def block_user(db: Session, blocker_id: int, blocked_id: int):
    if blocker_id == blocked_id:
        raise ValueError("You cannot block yourself.")

    target = (
        db.query(User)
        .filter(User.id == blocked_id, User.is_active.is_(True))
        .first()
    )

    if not target:
        raise ValueError("User not found or inactive.")

    existing = (
        db.query(UserBlock)
        .filter(
            UserBlock.blocker_id == blocker_id,
            UserBlock.blocked_id == blocked_id,
        )
        .first()
    )

    if existing:
        raise ValueError("You have already blocked this user.")

    block = UserBlock(
        blocker_id=blocker_id,
        blocked_id=blocked_id,
    )

    db.add(block)

    # Remove any existing connection in either direction.
    db.query(ConnectionRequest).filter(
        or_(
            (
                (ConnectionRequest.sender_id == blocker_id)
                & (ConnectionRequest.receiver_id == blocked_id)
            ),
            (
                (ConnectionRequest.sender_id == blocked_id)
                & (ConnectionRequest.receiver_id == blocker_id)
            ),
        )
    ).delete(synchronize_session=False)

    db.commit()
    db.refresh(block)

    return block


def unblock_user(db: Session, blocker_id: int, blocked_id: int):
    block = (
        db.query(UserBlock)
        .filter(
            UserBlock.blocker_id == blocker_id,
            UserBlock.blocked_id == blocked_id,
        )
        .first()
    )

    if not block:
        raise ValueError("This user is not in your block list.")

    db.delete(block)
    db.commit()

    return {"message": "User unblocked successfully."}


def get_blocked_users(db: Session, blocker_id: int):
    return (
        db.query(UserBlock)
        .filter(UserBlock.blocker_id == blocker_id)
        .order_by(UserBlock.created_at.desc())
        .all()
    )


def is_blocked(db: Session, user_one_id: int, user_two_id: int) -> bool:
    return (
        db.query(UserBlock.id)
        .filter(
            or_(
                (
                    (UserBlock.blocker_id == user_one_id)
                    & (UserBlock.blocked_id == user_two_id)
                ),
                (
                    (UserBlock.blocker_id == user_two_id)
                    & (UserBlock.blocked_id == user_one_id)
                ),
            )
        )
        .first()
        is not None
    )


def report_user(
    db: Session,
    reporter_id: int,
    reported_user_id: int,
    reason: str,
    description: str | None = None,
):
    if reporter_id == reported_user_id:
        raise ValueError("You cannot report yourself.")

    target = (
        db.query(User)
        .filter(
            User.id == reported_user_id,
            User.is_active.is_(True),
        )
        .first()
    )

    if not target:
        raise ValueError("User not found or inactive.")

    report = UserReport(
        reporter_id=reporter_id,
        reported_user_id=reported_user_id,
        reason=reason,
        description=description.strip() if description else None,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report