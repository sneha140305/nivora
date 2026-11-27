from conftest import TestingSessionLocal
from app.models.user import User

def set_user_profile_photo(user_id, photo_url):
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        user.profile_photo_url = photo_url
        db.commit()
    finally:
        db.close()

def create_user(client, email, full_name="Test User"):
    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": full_name,
            "email": email,
            "password": "NivoraTest@123",
        },
    )
    assert registration.status_code == 201

    login = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": "NivoraTest@123",
        },
    )

    headers = {
        "Authorization": f"Bearer {login.json()['access_token']}"
    }

    profile = client.post(
        "/api/profile/",
        headers=headers,
        json={"city": "Indore"},
    )
    assert profile.status_code == 201

    return headers, registration.json()["id"]


def create_accepted_connection(
    client,
    sender_headers,
    receiver_headers,
    receiver_id,
):
    request = client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )
    assert request.status_code == 201

    response = client.patch(
        f"/api/connections/{request.json()['id']}",
        headers=receiver_headers,
        json={"status": "accepted"},
    )
    assert response.status_code == 200


def test_notifications_require_authentication(client):
    response = client.get("/api/notifications/")

    assert response.status_code == 401


def test_connection_request_creates_notification(client):
    sender_headers, _ = create_user(
        client, "notification_sender@example.com", "Sender"
    )
    receiver_headers, sender_id = create_user(
        client, "notification_receiver@example.com", "Receiver"
    )

    response = client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": sender_id},
    )

    assert response.status_code == 201

    notifications = client.get(
        "/api/notifications/",
        headers=receiver_headers,
    )

    assert notifications.status_code == 200
    assert len(notifications.json()) == 1

    notification = notifications.json()[0]

    assert notification["notification_type"] == "connection_request"
    assert notification["actor_id"] != notification["user_id"]
    assert notification["title"] == "New Connection Request"
    assert notification["is_read"] is False
    assert notification["actor_profile_photo_url"] is None


def test_accepting_connection_creates_notification(client):
    sender_headers, sender_id = create_user(
        client, "accept_sender@example.com", "Sender"
    )
    receiver_headers, receiver_id = create_user(
        client, "accept_receiver@example.com", "Receiver"
    )

    create_accepted_connection(
        client,
        sender_headers,
        receiver_headers,
        receiver_id,
    )

    notifications = client.get(
        "/api/notifications/",
        headers=sender_headers,
    )

    assert notifications.status_code == 200
    assert len(notifications.json()) == 1

    notification = notifications.json()[0]

    assert notification["notification_type"] == "connection_accepted"
    assert notification["actor_id"] == receiver_id
    assert notification["user_id"] == sender_id


def test_new_message_creates_notification(client):
    sender_headers, sender_id = create_user(
        client, "message_notification_sender@example.com", "Sender"
    )
    receiver_headers, receiver_id = create_user(
        client, "message_notification_receiver@example.com", "Receiver"
    )

    create_accepted_connection(
        client,
        sender_headers,
        receiver_headers,
        receiver_id,
    )

    sent = client.post(
        f"/api/messages/chat/{receiver_id}",
        headers=sender_headers,
        json={"content": "Hello from NIVORA!"},
    )

    assert sent.status_code == 201

    notifications = client.get(
        "/api/notifications/",
        headers=receiver_headers,
    )

    message_notifications = [
        item
        for item in notifications.json()
        if item["notification_type"] == "new_message"
    ]

    assert len(message_notifications) == 1
    assert message_notifications[0]["actor_id"] == sender_id
    assert message_notifications[0]["user_id"] == receiver_id
    assert message_notifications[0]["is_read"] is False


def test_unread_notification_count(client):
    sender_headers, _ = create_user(
        client, "count_sender@example.com"
    )
    receiver_headers, receiver_id = create_user(
        client, "count_receiver@example.com"
    )

    client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    response = client.get(
        "/api/notifications/unread-count",
        headers=receiver_headers,
    )

    assert response.status_code == 200
    assert response.json()["unread_count"] == 1


def test_mark_notification_as_read(client):
    sender_headers, _ = create_user(
        client, "read_notification_sender@example.com"
    )
    receiver_headers, receiver_id = create_user(
        client, "read_notification_receiver@example.com"
    )

    client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    notifications = client.get(
        "/api/notifications/",
        headers=receiver_headers,
    )

    notification_id = notifications.json()[0]["id"]

    response = client.patch(
        f"/api/notifications/{notification_id}/read",
        headers=receiver_headers,
    )

    assert response.status_code == 200

    count = client.get(
        "/api/notifications/unread-count",
        headers=receiver_headers,
    )

    assert count.json()["unread_count"] == 0


def test_mark_all_notifications_as_read(client):
    sender_headers, _ = create_user(
        client, "all_read_sender@example.com"
    )
    receiver_headers, receiver_id = create_user(
        client, "all_read_receiver@example.com"
    )

    client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    response = client.patch(
        "/api/notifications/read-all",
        headers=receiver_headers,
    )

    assert response.status_code == 200

    count = client.get(
        "/api/notifications/unread-count",
        headers=receiver_headers,
    )

    assert count.json()["unread_count"] == 0


def test_delete_notification(client):
    sender_headers, _ = create_user(
        client, "delete_sender@example.com"
    )
    receiver_headers, receiver_id = create_user(
        client, "delete_receiver@example.com"
    )

    client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    notifications = client.get(
        "/api/notifications/",
        headers=receiver_headers,
    )

    notification_id = notifications.json()[0]["id"]

    response = client.delete(
        f"/api/notifications/{notification_id}",
        headers=receiver_headers,
    )

    assert response.status_code == 200

    remaining = client.get(
        "/api/notifications/",
        headers=receiver_headers,
    )

    assert remaining.json() == []


def test_users_cannot_access_other_users_notifications(client):
    sender_headers, _ = create_user(
        client, "private_sender@example.com"
    )
    receiver_headers, receiver_id = create_user(
        client, "private_receiver@example.com"
    )

    client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    notifications = client.get(
        "/api/notifications/",
        headers=receiver_headers,
    )

    notification_id = notifications.json()[0]["id"]

    unauthorized_read = client.patch(
        f"/api/notifications/{notification_id}/read",
        headers=sender_headers,
    )

    unauthorized_delete = client.delete(
        f"/api/notifications/{notification_id}",
        headers=sender_headers,
    )

    assert unauthorized_read.status_code == 404
    assert unauthorized_delete.status_code == 404

def test_notification_includes_actor_profile_photo(client):
    sender_headers, sender_id = create_user(
        client, "photo_sender@example.com", "Photo Sender"
    )
    receiver_headers, receiver_id = create_user(
        client, "photo_receiver@example.com", "Photo Receiver"
    )

    photo_url = "https://example.com/profile-photo.jpg"
    set_user_profile_photo(sender_id, photo_url)

    response = client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    assert response.status_code == 201

    notifications = client.get(
        "/api/notifications/",
        headers=receiver_headers,
    )

    assert notifications.status_code == 200
    assert len(notifications.json()) == 1
    assert notifications.json()[0]["actor_profile_photo_url"] == photo_url


