import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "HeartBeat AI"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(default="SUPER_SECRET_KEY_FOR_HEARTBEAT_AI_DEVELOPMENT_12345")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Database
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/heartbeat")
    
    # External APIs
    SONAUTO_API_KEY: str = Field(default="")
    STRIPE_API_KEY: str = Field(default="")
    GEMINI_API_KEY: str = Field(default="")
    
    # App Settings
    FREE_GENERATIONS_LIMIT: int = 3
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
