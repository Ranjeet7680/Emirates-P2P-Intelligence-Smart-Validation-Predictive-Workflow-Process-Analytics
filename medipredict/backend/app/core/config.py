import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediPredict AI"
    VERSION: str = "2.5.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # AI Providers
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    LOCAL_MODEL_BASE_URL: str = os.getenv("LOCAL_MODEL_BASE_URL", "")

    # Database & Security
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./medipredict.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medipredict-enterprise-secure-jwt-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Safety
    EMERGENCY_HOTLINES: dict = {
        "US_CAN": "911",
        "UK": "999",
        "EU": "112",
        "UAE": "998 / 999",
        "INTERNATIONAL": "Local Emergency Services"
    }

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
