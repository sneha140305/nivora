from app.api import profile as profile_api


def create_test_user_and_token(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Photo Test User",
            "email": "phototest@example.com",
            "password": "NivoraTest@123",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "phototest@example.com",
            "password": "NivoraTest@123",
        },
    )

    return response.json()["access_token"]


def test_upload_profile_photo(client, monkeypatch):
    token = create_test_user_and_token(client)

    async def mock_upload(file):
        return {
            "url": "https://example.com/profile.png",
            "public_id": "nivora/profile_photos/test",
        }

    monkeypatch.setattr(
        profile_api,
        "upload_profile_photo",
        mock_upload,
    )

    response = client.post(
        "/api/profile/photo",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": ("profile.png", b"fake-image", "image/png")
        },
    )

    assert response.status_code == 200
    assert response.json()["profile_photo_url"] == (
        "https://example.com/profile.png"
    )

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["profile_photo_url"] == (
        "https://example.com/profile.png"
    )


def test_upload_rejects_unsupported_file_type(client):
    token = create_test_user_and_token(client)

    response = client.post(
        "/api/profile/photo",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": ("document.pdf", b"fake-pdf", "application/pdf")
        },
    )

    assert response.status_code == 400


def test_upload_rejects_empty_image(client):
    token = create_test_user_and_token(client)

    response = client.post(
        "/api/profile/photo",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": ("empty.png", b"", "image/png")
        },
    )

    assert response.status_code == 400


def test_upload_rejects_large_image(client):
    token = create_test_user_and_token(client)

    response = client.post(
        "/api/profile/photo",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "large.png",
                b"x" * (5 * 1024 * 1024 + 1),
                "image/png",
            )
        },
    )

    assert response.status_code == 413


def test_remove_profile_photo(client, monkeypatch):
    token = create_test_user_and_token(client)

    async def mock_upload(file):
        return {
            "url": "https://example.com/profile.png",
            "public_id": "nivora/profile_photos/test",
        }

    deleted_photos = []

    def mock_delete(public_id):
        deleted_photos.append(public_id)

    monkeypatch.setattr(
        profile_api,
        "upload_profile_photo",
        mock_upload,
    )

    monkeypatch.setattr(
        profile_api,
        "delete_cloudinary_photo",
        mock_delete,
    )

    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/profile/photo",
        headers=headers,
        files={
            "file": ("profile.png", b"fake-image", "image/png")
        },
    )

    response = client.delete(
        "/api/profile/photo",
        headers=headers,
    )

    assert response.status_code == 200

    me_response = client.get(
        "/api/auth/me",
        headers=headers,
    )

    assert me_response.json()["profile_photo_url"] is None
    assert deleted_photos == ["nivora/profile_photos/test"]


def test_photo_upload_requires_authentication(client):
    response = client.post(
        "/api/profile/photo",
        files={
            "file": ("profile.png", b"fake-image", "image/png")
        },
    )

    assert response.status_code == 401