from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class LifestyleProfile(Base):
    __tablename__ = "lifestyle_profiles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Basic information
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Accommodation budget (monthly, in INR)
    budget_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    budget_max: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Sleep and daily routine
    sleep_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    wake_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    work_schedule: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Lifestyle preferences
    cleanliness_level: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    noise_tolerance: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    food_preference: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    social_level: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    guest_frequency: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    pets_allowed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )