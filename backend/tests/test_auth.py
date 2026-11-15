from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app

# Use a separate in-memory database for tests
TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def setup_function():
    Base.metadata.create_all(bind=test_engine)


def teardown_function():
    Base.metadata.drop_all(bind=test_engine)


def test_register_user():
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


def test_duplicate_registration():
    user_data = {
        "full_name": "Test User",
        "email": "duplicate@example.com",
        "password": "NivoraTest@123",
    }

    client.post("/api/auth/register", json=user_data)
    response = client.post("/api/auth/register", json=user_data)

    assert response.status_code == 409


def test_login_user():
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


def test_login_wrong_password():
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


def test_get_current_user():
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


def test_get_current_user_without_token():
    response = client.get("/api/auth/me")

    assert response.status_code == 401