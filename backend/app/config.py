"""App configuration from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_key: str = ""  # server-side only, never sent to browser
    ai_engine_url: str = ""
    debug: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
