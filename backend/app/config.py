from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Database (Supabase PostgreSQL)
    DATABASE_URL: str

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    # OpenAI
    OPENAI_API_KEY: str = ""

    # Kakao
    KAKAO_REST_API_KEY: str = ""

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = {
        "env_file": "../.env",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
