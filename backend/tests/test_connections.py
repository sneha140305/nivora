def create_user(client, email, full_name="Test User", create_profile=True):
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

    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    if create_profile:
        profile = client.post(
            "/api/profile/",
            headers=headers,
            json={"city": "Indore"},
        )
        assert profile.status_code == 201

    return headers, registration.json()["id"]


def test_send_connection_request(client):
    sender_headers, _ = create_user(
        client, "sender@example.com", "Sender"
    )
    _, receiver_id = create_user(
        client, "receiver@example.com", "Receiver"
    )

    response = client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    assert response.status_code == 201
    assert response.json()["receiver_id"] == receiver_id
    assert response.json()["status"] == "pending"


def test_duplicate_connection_request(client):
    sender_headers, _ = create_user(
        client, "sender2@example.com"
    )
    _, receiver_id = create_user(
        client, "receiver2@example.com"
    )

    payload = {"receiver_id": receiver_id}

    first = client.post(
        "/api/connections/",
        headers=sender_headers,
        json=payload,
    )

    second = client.post(
        "/api/connections/",
        headers=sender_headers,
        json=payload,
    )

    assert first.status_code == 201
    assert second.status_code == 400


def test_cannot_send_request_to_self(client):
    headers, user_id = create_user(
        client, "self@example.com"
    )

    response = client.post(
        "/api/connections/",
        headers=headers,
        json={"receiver_id": user_id},
    )

    assert response.status_code == 400
    assert "yourself" in response.json()["detail"]


def test_cannot_request_user_without_profile(client):
    sender_headers, _ = create_user(
        client, "sender3@example.com"
    )
    _, receiver_id = create_user(
        client,
        "receiver3@example.com",
        create_profile=False,
    )

    response = client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    assert response.status_code == 400


def test_accept_connection_request(client):
    sender_headers, sender_id = create_user(
        client, "sender4@example.com", "Sender"
    )
    receiver_headers, receiver_id = create_user(
        client, "receiver4@example.com", "Receiver"
    )

    sent = client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    assert sent.status_code == 201

    request_id = sent.json()["id"]

    response = client.patch(
        f"/api/connections/{request_id}",
        headers=receiver_headers,
        json={"status": "accepted"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "accepted"
    assert response.json()["sender_id"] == sender_id


def test_reject_connection_request(client):
    sender_headers, _ = create_user(
        client, "sender5@example.com"
    )
    receiver_headers, receiver_id = create_user(
        client, "receiver5@example.com", "Receiver"
    )

    sent = client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    request_id = sent.json()["id"]

    response = client.patch(
        f"/api/connections/{request_id}",
        headers=receiver_headers,
        json={"status": "rejected"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_unauthorized_user_cannot_respond(client):
    sender_headers, _ = create_user(
        client, "sender6@example.com"
    )
    receiver_headers, receiver_id = create_user(
        client, "receiver4@example.com", "Receiver"
    )
    other_headers, _ = create_user(
        client, "other6@example.com"
    )

    sent = client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    request_id = sent.json()["id"]

    response = client.patch(
        f"/api/connections/{request_id}",
        headers=other_headers,
        json={"status": "accepted"},
    )

    assert response.status_code == 403


def test_get_sent_and_received_requests(client):
    sender_headers, _ = create_user(
        client, "sender7@example.com", "Sender"
    )
    receiver_headers, receiver_id = create_user(
        client, "receiver7@example.com", "Receiver"
    )

    client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    sent = client.get(
        "/api/connections/sent",
        headers=sender_headers,
    )

    received = client.get(
        "/api/connections/received",
        headers=receiver_headers,
    )

    assert sent.status_code == 200
    assert received.status_code == 200

    assert len(sent.json()) == 1
    assert len(received.json()) == 1

    assert sent.json()[0]["user"]["full_name"] == "Receiver"
    assert received.json()[0]["user"]["full_name"] == "Sender"


def test_cannot_respond_to_processed_request(client):
    sender_headers, _ = create_user(
        client, "sender8@example.com"
    )
    receiver_headers, receiver_id = create_user(
        client, "receiver4@example.com", "Receiver"
    )

    sent = client.post(
        "/api/connections/",
        headers=sender_headers,
        json={"receiver_id": receiver_id},
    )

    request_id = sent.json()["id"]

    first_response = client.patch(
        f"/api/connections/{request_id}",
        headers=receiver_headers,
        json={"status": "accepted"},
    )

    second_response = client.patch(
        f"/api/connections/{request_id}",
        headers=receiver_headers,
        json={"status": "rejected"},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 400