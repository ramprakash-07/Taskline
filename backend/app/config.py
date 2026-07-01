"""Configuration settings loaded from environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env file and environment variables."""
    MONGODB_URL: str
    DATABASE_NAME: str = "taskline"
    CLERK_JWKS_URL: str
    FRONTEND_URL: str = "http://localhost:5173"
    RESEND_API_KEY: str = ""  # Optional — email disabled if empty

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
