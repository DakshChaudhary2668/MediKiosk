from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = "https://mock.supabase.co"
    supabase_secret_key: str = "mock-secret-key"
    groq_api_key: str = "mock-groq-api-key"
    sarvam_api_key: str = "mock-sarvam-api-key"
    groq_model: str = "llama-3.3-70b-versatile"
    sarvam_stt_model: str = "saaras:v3"
    sarvam_tts_model: str = "bulbul:v3"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
