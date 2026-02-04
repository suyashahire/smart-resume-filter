"""
Interview model for storing interview analysis data.
"""

from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SentimentAnalysis(BaseModel):
    """Sentiment analysis results."""
    overall_sentiment: str = "neutral"  # positive, negative, neutral
    sentiment_score: float = 0.0  # 0-100
    confidence_score: float = 0.0  # 0-100
    
    # Detailed breakdown
    positive_phrases: List[str] = []
    negative_phrases: List[str] = []
    key_topics: List[str] = []
    
    # Communication metrics
    clarity_score: float = 0.0
    enthusiasm_score: float = 0.0
    professionalism_score: float = 0.0


class Interview(Document):
    """Interview document model for MongoDB."""
    
    user_id: str = Field(...)  # Reference to User who uploaded
    resume_id: str = Field(...)  # Reference to candidate's Resume
    
    # File information
    file_name: str = Field(...)
    file_path: str = Field(...)  # Local path or S3 URL
    file_size: int = Field(default=0)
    file_type: str = Field(default="audio/mpeg")
    duration_seconds: Optional[float] = None
    
    # Transcription
    transcript: Optional[str] = None
    is_transcribed: bool = Field(default=False)
    transcription_error: Optional[str] = None
    
    # Analysis
    analysis: SentimentAnalysis = Field(default_factory=SentimentAnalysis)
    is_analyzed: bool = Field(default=False)
    analysis_error: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "interviews"
        indexes = [
            "user_id",
            "resume_id",
            "created_at",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "resume_id": "resume123",
                "file_name": "interview_john_doe.mp3",
                "transcript": "I have strong experience in...",
                "analysis": {
                    "sentiment_score": 85,
                    "confidence_score": 78
                }
            }
        }


# Pydantic schemas for API requests/responses

class InterviewUploadResponse(BaseModel):
    """Response after uploading an interview."""
    id: str
    resume_id: str
    file_name: str
    is_transcribed: bool
    is_analyzed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class InterviewAnalysisResponse(BaseModel):
    """Response with full interview analysis."""
    id: str
    resume_id: str
    file_name: str
    transcript: Optional[str]
    analysis: SentimentAnalysis
    is_transcribed: bool
    is_analyzed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class InterviewListResponse(BaseModel):
    """Response for listing interviews."""
    id: str
    resume_id: str
    file_name: str
    sentiment_score: float
    confidence_score: float
    is_analyzed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

