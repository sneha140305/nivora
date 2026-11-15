def create_test_user_and_token(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Profile Test User",
            "email": "profiletest@example.com",
            "password": "NivoraTest@123",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "profiletest@example.com",
            "password": "NivoraTest@123",
        },
    )

    return response.json()["access_token"]


def test_create_lifestyle_profile(client):
    token = create_test_user_and_token(client)

    response = client.post(
        "/api/profile/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "city": "Indore",
            "occupation": "student",
            "budget_min": 5000,
            "budget_max": 10000,
            "sleep_time": "23:00",
            "wake_time": "07:00",
            "work_schedule": "day_shift",
            "cleanliness_level": "very_clean",
            "noise_tolerance": "medium",
            "food_preference": "vegetarian",
            "social_level": "balanced",
            "guest_frequency": "sometimes",
            "pets_allowed": False,
        },
    )

    assert response.status_code == 201
    assert response.json()["city"] == "Indore"
    assert response.json()["occupation"] == "student"


def test_get_lifestyle_profile(client):
    token = create_test_user_and_token(client)

    client.post(
        "/api/profile/",
        headers={"Authorization": f"Bearer {token}"},
        json={"city": "Indore"},
    )

    response = client.get(
        "/api/profile/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["city"] == "Indore"


def test_update_lifestyle_profile(client):
    token = create_test_user_and_token(client)

    client.post(
        "/api/profile/",
        headers={"Authorization": f"Bearer {token}"},
        json={"city": "Indore"},
    )

    response = client.put(
        "/api/profile/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "city": "Bhopal",
            "social_level": "introvert",
        },
    )

    assert response.status_code == 200
    assert response.json()["city"] == "Bhopal"
    assert response.json()["social_level"] == "introvert"


def test_duplicate_profile_creation(client):
    token = create_test_user_and_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/profile/",
        headers=headers,
        json={"city": "Indore"},
    )

    response = client.post(
        "/api/profile/",
        headers=headers,
        json={"city": "Bhopal"},
    )

    assert response.status_code == 409


def test_profile_requires_authentication(client):
    response = client.get("/api/profile/")

    assert response.status_code == 401


def test_get_missing_profile(client):
    token = create_test_user_and_token(client)

    response = client.get(
        "/api/profile/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404

def test_invalid_budget_range(client):
    token = create_test_user_and_token(client)

    response = client.post(
        "/api/profile/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "city": "Indore",
            "budget_min": 15000,
            "budget_max": 5000,
        },
    )

    assert response.status_code == 422


def test_invalid_sleep_time(client):
    token = create_test_user_and_token(client)

    response = client.post(
        "/api/profile/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "city": "Indore",
            "sleep_time": "invalid-time",
        },
    )

    assert response.status_code == 422


def test_empty_city_rejected(client):
    token = create_test_user_and_token(client)

    response = client.post(
        "/api/profile/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "city": "   ",
        },
    )

    assert response.status_code == 422