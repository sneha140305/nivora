def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": "testuser@example.com",
            "password": "NivoraTest@123",
        },
    )

    assert response.status_code == 201
    assert response.json()["email"] == "testuser@example.com"
    assert "hashed_password" not in response.json()


def test_duplicate_registration(client):
    user_data = {
        "full_name": "Test User",
        "email": "duplicate@example.com",
        "password": "NivoraTest@123",
    }

    client.post("/api/auth/register", json=user_data)
    response = client.post("/api/auth/register", json=user_data)

    assert response.status_code == 409


def test_login_user(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": "login@example.com",
            "password": "NivoraTest@123",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "NivoraTest@123",
        },
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": "wrongpass@example.com",
            "password": "NivoraTest@123",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "wrongpass@example.com",
            "password": "WrongPassword@123",
        },
    )

    assert response.status_code == 401


def test_get_current_user(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": "profile@example.com",
            "password": "NivoraTest@123",
        },
    )

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "profile@example.com",
            "password": "NivoraTest@123",
        },
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "profile@example.com"


def test_get_current_user_without_token(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401