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

    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, registration.json()["id"]


def test_block_user(client):
    user_headers, _ = create_user(client, "blocker@example.com")
    _, target_id = create_user(client, "blocked@example.com")

    response = client.post(
        f"/api/safety/block/{target_id}",
        headers=user_headers,
    )

    assert response.status_code == 201
    assert response.json()["blocked_id"] == target_id


def test_get_blocked_users(client):
    user_headers, _ = create_user(client, "listblocker@example.com")
    _, target_id = create_user(client, "listblocked@example.com")

    client.post(
        f"/api/safety/block/{target_id}",
        headers=user_headers,
    )

    response = client.get(
        "/api/safety/blocked",
        headers=user_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["blocked_id"] == target_id


def test_cannot_block_yourself(client):
    headers, user_id = create_user(client, "selfblock@example.com")

    response = client.post(
        f"/api/safety/block/{user_id}",
        headers=headers,
    )

    assert response.status_code == 400


def test_cannot_block_same_user_twice(client):
    headers, target_id = create_user(client, "duplicateblocker@example.com")
    _, target_id = create_user(client, "duplicatetarget@example.com")

    client.post(
        f"/api/safety/block/{target_id}",
        headers=headers,
    )

    response = client.post(
        f"/api/safety/block/{target_id}",
        headers=headers,
    )

    assert response.status_code == 400


def test_unblock_user(client):
    headers, _ = create_user(client, "unblocker@example.com")
    _, target_id = create_user(client, "unblocked@example.com")

    client.post(
        f"/api/safety/block/{target_id}",
        headers=headers,
    )

    response = client.delete(
        f"/api/safety/block/{target_id}",
        headers=headers,
    )

    assert response.status_code == 200

    blocked = client.get(
        "/api/safety/blocked",
        headers=headers,
    )

    assert blocked.status_code == 200
    assert blocked.json() == []


def test_unblock_non_blocked_user(client):
    headers, _ = create_user(client, "notblocker@example.com")
    _, target_id = create_user(client, "notblocked@example.com")

    response = client.delete(
        f"/api/safety/block/{target_id}",
        headers=headers,
    )

    assert response.status_code == 404


def test_block_prevents_connection_request(client):
    blocker_headers, _ = create_user(client, "safeblocker@example.com")
    _, target_id = create_user(client, "safetarget@example.com")

    block_response = client.post(
        f"/api/safety/block/{target_id}",
        headers=blocker_headers,
    )
    assert block_response.status_code == 201

    connection_response = client.post(
        "/api/connections/",
        headers=blocker_headers,
        json={"receiver_id": target_id},
    )

    assert connection_response.status_code == 400


def test_block_prevents_profile_access(client):
    user_headers, _ = create_user(client, "profileblocker@example.com")
    _, target_id = create_user(client, "profileblocked@example.com")

    client.post(
        f"/api/safety/block/{target_id}",
        headers=user_headers,
    )

    response = client.get(
        f"/api/matching/{target_id}",
        headers=user_headers,
    )

    assert response.status_code == 404


def test_report_user(client):
    reporter_headers, _ = create_user(client, "reporter@example.com")
    _, target_id = create_user(client, "reported@example.com")

    response = client.post(
        f"/api/safety/report/{target_id}",
        headers=reporter_headers,
        json={
            "reason": "fake_profile",
            "description": "This profile appears to contain misleading information.",
        },
    )

    assert response.status_code == 201
    assert response.json()["reported_user_id"] == target_id
    assert response.json()["reason"] == "fake_profile"


def test_report_user_without_description(client):
    reporter_headers, _ = create_user(client, "reporter2@example.com")
    _, target_id = create_user(client, "reported2@example.com")

    response = client.post(
        f"/api/safety/report/{target_id}",
        headers=reporter_headers,
        json={"reason": "spam"},
    )

    assert response.status_code == 201
    assert response.json()["description"] is None


def test_cannot_report_yourself(client):
    headers, user_id = create_user(client, "selfreport@example.com")

    response = client.post(
        f"/api/safety/report/{user_id}",
        headers=headers,
        json={"reason": "other"},
    )

    assert response.status_code == 400


def test_report_rejects_invalid_reason(client):
    headers, _ = create_user(client, "invalidreporter@example.com")
    _, target_id = create_user(client, "invalidreported@example.com")

    response = client.post(
        f"/api/safety/report/{target_id}",
        headers=headers,
        json={"reason": "invalid_reason"},
    )

    assert response.status_code == 422