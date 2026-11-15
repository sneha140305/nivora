import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("NIVORA_SECRET_KEY")

if not SECRET_KEY or len(SECRET_KEY.encode()) < 32:
    raise RuntimeError("A secure NIVORA_SECRET_KEY of at least 32 bytes is required")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30