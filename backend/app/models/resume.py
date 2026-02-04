"""
Resume model for storing parsed resume data.
"""

from beanie import Document, Link
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class ParsedResumeData(BaseModel):
    """Structured data extracted from resume."""
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: List[str] = []
    education: str = ""
    experience: str = ""
    summary: Optional[str] = None
    certifications: List[str] = []
    languages: List[str] = []
    linkedin: Optional[str] = None
    github: Optional[str] = None
    years_of_experience: Optional[float] = None


class Resume(Document):
    """Resume document model for MongoDB."""
    
    user_id: str = Field(...)  # Reference to User who uploaded
    file_name: str = Field(...)
    file_path: str = Field(...)  # Local path or S3 URL
    file_size: int = Field(default=0)  # Size in bytes
    file_type: str = Field(default="application/pdf")
    
    # Parsed data
    parsed_data: ParsedResumeData = Field(default_factory=ParsedResumeData)
    raw_text: Optional[str] = None  # Full extracted text
    
    # Processing status
    is_parsed: bool = Field(default=False)
    parse_error: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "resumes"
        indexes = [
            "user_id",
            "created_at",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "file_name": "john_doe_resume.pdf",
                "file_path": "/uploads/resumes/john_doe_resume.pdf",
                "parsed_data": {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+91 9876543210",
                    "skills": ["Python", "JavaScript", "React"],
                    "education": "B.Tech Computer Science",
                    "experience": "3 years at TCS"
                }
            }
        }


# Pydantic schemas for API requests/responses

class ResumeUploadResponse(BaseModel):
    """Response after uploading a resume."""
    id: str
    file_name: str
    is_parsed: bool
    parsed_data: ParsedResumeData
    created_at: datetime
    
    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    """Response for listing resumes."""
    id: str
    file_name: str
    parsed_data: ParsedResumeData
    is_parsed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ResumeWithScore(BaseModel):
    """Resume with matching score for results."""
    id: str
    name: str
    email: str
    phone: str
    skills: List[str]
    education: str
    experience: str
    score: float
    skill_matches: List[str] = []
    
    class Config:
        from_attributes = True

