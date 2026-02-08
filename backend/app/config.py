"""
Configuration settings for the HireQ backend.
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server Configuration
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DEBUG: bool = False  # Disabled for better performance (no hot-reload overhead)
    ENVIRONMENT: str = "development"
    
    # MongoDB Configuration
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "hireq"
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # OpenAI API (for Whisper Speech-to-Text)
    OPENAI_API_KEY: str = ""
    
    # AWS S3 Configuration
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "hireq-uploads"
    AWS_REGION: str = "us-east-1"
    
    # Frontend URL (for CORS)
    FRONTEND_URL: str = "http://localhost:3000"
    
    # File Upload Configuration
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_RESUME_EXTENSIONS: str = ".pdf,.docx"
    ALLOWED_AUDIO_EXTENSIONS: str = ".mp3,.wav,.m4a,.mp4"
    
    # ML Model Configuration
    # Using smaller models for better performance
    SPACY_MODEL: str = "en_core_web_sm"  # Changed from en_core_web_lg (~780MB -> ~12MB)
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"  # Already lightweight (~80MB)
    SENTIMENT_MODEL: str = "distilbert-base-uncased-finetuned-sst-2-english"  # Keep for accuracy
    
    # Upload directory (local fallback)
    UPLOAD_DIR: str = "uploads"
    
    @property
    def allowed_resume_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_RESUME_EXTENSIONS.split(",")]
    
    @property
    def allowed_audio_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_AUDIO_EXTENSIONS.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "resumes"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "interviews"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "reports"), exist_ok=True)

