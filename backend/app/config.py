from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_secret_key: str
    groq_api_key: str
    sarvam_api_key: str
    groq_model: str = "openai/gpt-oss-20b"
    sarvam_stt_model: str = "saaras:v3"
    sarvam_tts_model: str = "bulbul:v3"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
