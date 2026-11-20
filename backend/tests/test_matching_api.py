def create_user(client, email, full_name):
    # Register user
    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": full_name,
            "email": email,
            "password": "NivoraTest@123",
        },
    )
    assert register_response.status_code == 201

    # Login user
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": "NivoraTest@123",
        },
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


def create_lifestyle_profile(client, headers, **overrides):
    profile_data = {
        "city": "Indore",
        "occupation": "student",
        "bio": "Looking for a compatible roommate.",
        "budget_min": 5000,
        "budget_max": 10000,
        "sleep_time": "23:00",
        "wake_time": "07:00",
        "work_schedule": "day_shift",
        "cleanliness_level": "moderate",
        "noise_tolerance": "medium",
        "food_preference": "vegetarian",
        "social_level": "balanced",
        "guest_frequency": "sometimes",
        "pets_allowed": True,
    }

    profile_data.update(overrides)

    response = client.post(
        "/api/profile/",
        headers=headers,
        json=profile_data,
    )

    assert response.status_code == 201
    return response


def test_matching_requires_authentication(client):
    response = client.get("/api/matching/")

    assert response.status_code == 401


def test_matching_requires_own_lifestyle_profile(client):
    headers = create_user(
        client,
        "matching1@example.com",
        "Matching User",
    )

    response = client.get(
        "/api/matching/",
        headers=headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Please create your lifestyle profile first."
    )


def test_matching_excludes_current_user(client):
    headers = create_user(
        client,
        "matching2@example.com",
        "Current User",
    )

    create_lifestyle_profile(client, headers)

    response = client.get(
        "/api/matching/",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["total_matches"] == 0
    assert response.json()["matches"] == []


def test_matching_finds_compatible_roommates(client):
    current_headers = create_user(
        client,
        "matching3@example.com",
        "Current User",
    )

    create_lifestyle_profile(client, current_headers)

    candidate_headers = create_user(
        client,
        "matching4@example.com",
        "Compatible User",
    )

    create_lifestyle_profile(client, candidate_headers)

    response = client.get(
        "/api/matching/",
        headers=current_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_matches"] == 1
    assert data["matches"][0]["full_name"] == "Compatible User"
    assert data["matches"][0]["compatibility_score"] == 100


def test_matching_filters_by_city(client):
    current_headers = create_user(
        client,
        "matching5@example.com",
        "Current User",
    )

    create_lifestyle_profile(client, current_headers)

    candidate_headers = create_user(
        client,
        "matching6@example.com",
        "Bhopal User",
    )

    create_lifestyle_profile(
        client,
        candidate_headers,
        city="Bhopal",
    )

    response = client.get(
        "/api/matching/?city=Bhopal",
        headers=current_headers,
    )

    assert response.status_code == 200
    assert response.json()["total_matches"] == 1
    assert response.json()["matches"][0]["city"] == "Bhopal"


def test_matching_sorts_by_compatibility(client):
    current_headers = create_user(
        client,
        "matching7@example.com",
        "Current User",
    )

    create_lifestyle_profile(client, current_headers)

    # Highly compatible candidate
    best_headers = create_user(
        client,
        "matching8@example.com",
        "Best Match",
    )

    create_lifestyle_profile(client, best_headers)

    # Less compatible candidate
    other_headers = create_user(
        client,
        "matching9@example.com",
        "Other Match",
    )

    create_lifestyle_profile(
        client,
        other_headers,
        sleep_time="03:00",
        wake_time="11:00",
        cleanliness_level="relaxed",
        noise_tolerance="high",
        budget_min=15000,
        budget_max=20000,
        social_level="extrovert",
        guest_frequency="frequently",
        food_preference="non_vegetarian",
        pets_allowed=False,
    )

    response = client.get(
        "/api/matching/",
        headers=current_headers,
    )

    assert response.status_code == 200

    matches = response.json()["matches"]

    assert len(matches) == 2
    assert matches[0]["full_name"] == "Best Match"
    assert matches[0]["compatibility_score"] >= (
        matches[1]["compatibility_score"]
    )

def test_roommate_details_requires_authentication(client):
    response = client.get("/api/matching/2")

    assert response.status_code == 401


def test_get_roommate_details(client):
    current_headers = create_user(
        client,
        "details1@example.com",
        "Current User",
    )
    create_lifestyle_profile(client, current_headers)

    roommate_headers = create_user(
        client,
        "details2@example.com",
        "Roommate User",
    )
    profile_response = create_lifestyle_profile(
        client,
        roommate_headers,
        city="Bhopal",
        occupation="working_professional",
        bio="A quiet and responsible person.",
        budget_min=7000,
        budget_max=12000,
        sleep_time="22:30",
        wake_time="06:30",
        work_schedule="remote",
        cleanliness_level="very_clean",
        noise_tolerance="low",
        food_preference="vegetarian",
        social_level="introvert",
        guest_frequency="rarely",
        pets_allowed=False,
    )

    roommate_id = profile_response.json()["user_id"]

    response = client.get(
        f"/api/matching/{roommate_id}",
        headers=current_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["user_id"] == roommate_id
    assert data["full_name"] == "Roommate User"
    assert data["city"] == "Bhopal"
    assert data["occupation"] == "working_professional"
    assert data["bio"] == "A quiet and responsible person."
    assert data["budget_min"] == 7000
    assert data["budget_max"] == 12000
    assert data["sleep_time"] == "22:30"
    assert data["wake_time"] == "06:30"
    assert data["work_schedule"] == "remote"
    assert data["cleanliness_level"] == "very_clean"
    assert data["noise_tolerance"] == "low"
    assert data["food_preference"] == "vegetarian"
    assert data["social_level"] == "introvert"
    assert data["guest_frequency"] == "rarely"
    assert data["pets_allowed"] is False
    assert 0 <= data["compatibility_score"] <= 100
    assert data["compatibility_score"] > 0
    assert "category_scores" in data
    assert "matched_factors" in data
    assert "conflict_factors" in data


def test_roommate_details_not_found(client):
    current_headers = create_user(
        client,
        "details3@example.com",
        "Current User",
    )
    create_lifestyle_profile(client, current_headers)

    response = client.get(
        "/api/matching/9999",
        headers=current_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Roommate not found."


def test_cannot_view_self_as_roommate(client):
    headers = create_user(
        client,
        "details4@example.com",
        "Current User",
    )
    profile_response = create_lifestyle_profile(client, headers)
    user_id = profile_response.json()["user_id"]

    response = client.get(
        f"/api/matching/{user_id}",
        headers=headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "You cannot view yourself as a roommate match."
    )


def test_roommate_details_requires_current_user_profile(client):
    headers = create_user(
        client,
        "details5@example.com",
        "Current User",
    )

    response = client.get(
        "/api/matching/2",
        headers=headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Please create your lifestyle profile first."
    )