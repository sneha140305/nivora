from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    actor_id: int,
    notification_type: str,
    title: str,
    message: str,
    link: str,
):
    notification = Notification(
        user_id=user_id,
        actor_id=actor_id,
        notification_type=notification_type,
        title=title,
        message=message,
        link=link,
    )

    db.add(notification)
    db.flush()

    return notification
