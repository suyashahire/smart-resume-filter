"""
Job Description model for storing job requirements.
"""

from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class JobDescription(Document):
    """Job Description document model for MongoDB."""
    
    user_id: str = Field(...)  # Reference to User who created
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10)
    
    # Extracted/Specified requirements
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    experience_required: str = ""
    education_required: str = ""
    
    # Additional details
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: str = "full-time"  # full-time, part-time, contract, internship
    
    # Status
    status: str = "open"  # open, closed, draft
    is_active: bool = Field(default=True)
    candidates_screened: int = Field(default=0)
    
    # Company info (for candidate display)
    company: Optional[str] = None
    company_logo: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "job_descriptions"
        indexes = [
            "user_id",
            "is_active",
            "created_at",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Full Stack Developer",
                "description": "Looking for an experienced developer...",
                "required_skills": ["JavaScript", "React", "Node.js"],
                "experience_required": "2+ years",
                "education_required": "B.Tech/B.E. in Computer Science"
            }
        }


# Pydantic schemas for API requests/responses

class JobDescriptionCreate(BaseModel):
    """Schema for creating a job description."""
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10)
    experience_required: str = ""
    education_required: str = ""
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: str = "full-time"


class JobDescriptionResponse(BaseModel):
    """Response schema for job description."""
    id: str
    title: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str]
    experience_required: str
    education_required: str
    location: Optional[str]
    salary_range: Optional[str]
    job_type: str
    is_active: bool
    candidates_screened: int
    company: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobDescriptionUpdate(BaseModel):
    """Schema for updating a job description."""
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    is_active: Optional[bool] = None


class ScreeningRequest(BaseModel):
    """Request for screening candidates against a job."""
    resume_ids: List[str] = []  # If empty, screen all resumes

