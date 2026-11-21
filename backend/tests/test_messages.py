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


def test_messages_require_authentication(client):
    response = client.get("/api/messages/conversations")

    assert response.status_code == 401


def test_cannot_message_without_accepted_connection(client):
    sender_headers, _ = create_user(
        client, "message_sender@example.com"
    )
    _, receiver_id = create_user(
        client, "message_receiver@example.com"
    )

    response = client.post(
        f"/api/messages/chat/{receiver_id}",
        headers=sender_headers,
        json={"content": "Hello!"},
    )

    assert response.status_code == 403


def test_send_and_fetch_messages(client):
    sender_headers, sender_id = create_user(
        client, "chat_sender@example.com", "Sender"
    )
    receiver_headers, receiver_id = create_user(
        client, "chat_receiver@example.com", "Receiver"
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
        json={"content": "Hello!"},
    )

    assert sent.status_code == 201
    assert sent.json()["sender_id"] == sender_id
    assert sent.json()["recipient_id"] == receiver_id
    assert sent.json()["content"] == "Hello!"
    assert sent.json()["read_at"] is None

    history = client.get(
        f"/api/messages/chat/{sender_id}",
        headers=receiver_headers,
    )

    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["content"] == "Hello!"


def test_conversations_show_unread_messages(client):
    sender_headers, _ = create_user(
        client, "unread_sender@example.com", "Sender"
    )
    receiver_headers, receiver_id = create_user(
        client, "unread_receiver@example.com", "Receiver"
    )

    create_accepted_connection(
        client,
        sender_headers,
        receiver_headers,
        receiver_id,
    )

    client.post(
        f"/api/messages/chat/{receiver_id}",
        headers=sender_headers,
        json={"content": "First message"},
    )

    conversations = client.get(
        "/api/messages/conversations",
        headers=receiver_headers,
    )

    assert conversations.status_code == 200
    assert len(conversations.json()) == 1
    assert conversations.json()[0]["full_name"] == "Sender"
    assert conversations.json()[0]["last_message"] == "First message"
    assert conversations.json()[0]["unread_count"] == 1


def test_mark_messages_as_read(client):
    sender_headers, sender_id = create_user(
        client, "read_sender@example.com", "Sender"
    )
    receiver_headers, receiver_id = create_user(
        client, "read_receiver@example.com", "Receiver"
    )

    create_accepted_connection(
        client,
        sender_headers,
        receiver_headers,
        receiver_id,
    )

    client.post(
        f"/api/messages/chat/{receiver_id}",
        headers=sender_headers,
        json={"content": "Please read this"},
    )

    marked = client.patch(
        f"/api/messages/chat/{sender_id}/read",
        headers=receiver_headers,
    )

    assert marked.status_code == 200
    assert marked.json()["updated_count"] == 1

    conversations = client.get(
        "/api/messages/conversations",
        headers=receiver_headers,
    )

    assert conversations.json()[0]["unread_count"] == 0


def test_cannot_message_yourself(client):
    headers, user_id = create_user(
        client, "self_message@example.com"
    )

    response = client.post(
        f"/api/messages/chat/{user_id}",
        headers=headers,
        json={"content": "Hello myself"},
    )

    assert response.status_code == 400