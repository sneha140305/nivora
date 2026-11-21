from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.database.base import Base
from app.database.session import engine
from app.models import LifestyleProfile, User
from app.api.profile import router as profile_router
from app.api.matching import router as matching_router
from app.api.connections import router as connections_router
from app.api.messages import router as messages_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NIVORA API",
    description="Lifestyle-Based Smart Roommate Matching Platform",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register authentication routes
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(matching_router)
app.include_router(connections_router)
app.include_router(messages_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to NIVORA API",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}