"""
Job Description model for storing job requirements.
"""

from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class ApplicationMode(str, Enum):
    """Controls how candidate portal applications are handled."""
    AUTO_INCLUDE = "auto_include"       # Automatically screen and include in results
    REQUIRE_APPROVAL = "require_approval"  # Require HR approval before screening


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
    
    # Application mode for candidate portal
    application_mode: ApplicationMode = Field(default=ApplicationMode.REQUIRE_APPROVAL)
    
    # Company info (for candidate display)
    company: Optional[str] = None
    company_logo: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
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
    application_mode: ApplicationMode = ApplicationMode.REQUIRE_APPROVAL


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
    application_mode: ApplicationMode = ApplicationMode.REQUIRE_APPROVAL
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
    application_mode: Optional[ApplicationMode] = None


class ScreeningRequest(BaseModel):
    """Request for screening candidates against a job."""
    resume_ids: List[str] = []  # If empty, screen all resumes

