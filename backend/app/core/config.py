"""
config.py - Application Configuration & Settings
"""
import os
from pydantic_settings import BaseSettings

WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.path.join(WORKSPACE_ROOT, "data")
MODELS_DIR = os.path.join(WORKSPACE_ROOT, "models")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Emirates P2P Intelligence"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production-prototype"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{os.path.join(WORKSPACE_ROOT, 'backend', 'p2p_intelligence.db')}"
    
    # Paths
    WORKSPACE_DIR: str = WORKSPACE_ROOT
    DATA_PATH: str = DATA_DIR
    MODELS_PATH: str = MODELS_DIR
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]
    
    class Config:
        case_sensitive = True

settings = Settings()
