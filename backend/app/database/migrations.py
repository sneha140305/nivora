from sqlalchemy import inspect, text

from app.database.session import engine


def migrate_profile_photo_columns():
    inspector = inspect(engine)

    if "users" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("users")
    }

    with engine.begin() as connection:
        if "profile_photo_url" not in existing_columns:
            connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN profile_photo_url VARCHAR(500)"
                )
            )

        if "profile_photo_public_id" not in existing_columns:
            connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN profile_photo_public_id VARCHAR(255)"
                )
            )

        if "token_version" not in existing_columns:
            connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0"
                )
            )
