"""
Application model for tracking candidate job applications.
"""

from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class ApplicationStatus(str, Enum):
    """Status of a job application."""
    PENDING_APPROVAL = "pending_approval"  # Waiting for HR to approve for screening
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    HIRED = "hired"
    WITHDRAWN = "withdrawn"


class StatusChange(BaseModel):
    """Record of a status change for timeline."""
    from_status: Optional[str] = None
    to_status: str
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    changed_by: Optional[str] = None  # User ID who made the change
    note: Optional[str] = None


class Application(Document):
    """Application document model for MongoDB.
    
    Tracks a candidate's application to a job.
    """
    
    candidate_id: str = Field(...)  # User ID of the candidate
    job_id: str = Field(...)        # JobDescription ID
    resume_id: Optional[str] = None  # Resume ID (if uploaded)
    
    # Application status
    status: ApplicationStatus = Field(default=ApplicationStatus.APPLIED)
    
    # Status timeline (history of changes)
    status_history: List[StatusChange] = []
    
    # Link to screening result (created when HR screens the candidate)
    screening_result_id: Optional[str] = None
    
    # Approval tracking (for jobs with require_approval mode)
    is_approved_for_screening: bool = Field(default=False)
    approval_decision_at: Optional[datetime] = None
    approval_decision_by: Optional[str] = None  # HR user ID who approved/rejected
    
    # Source tracking
    source: str = Field(default="candidate_portal")  # "candidate_portal" or "hr_upload"
    
    # Timestamps
    applied_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "applications"
        indexes = [
            "candidate_id",
            "job_id",
            "status",
            "applied_at",
            [("candidate_id", 1), ("job_id", 1)],
            [("job_id", 1), ("status", 1)],
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "candidate_id": "user123",
                "job_id": "job456",
                "status": "applied",
            }
        }


# Pydantic schemas for API requests/responses

class ApplicationCreate(BaseModel):
    """Schema for creating a new application."""
    job_id: str
    resume_id: Optional[str] = None


class ApplicationResponse(BaseModel):
    """Schema for application response."""
    id: str
    candidate_id: str
    job_id: str
    job_title: Optional[str] = None  # Populated from job
    company: Optional[str] = None    # Populated from job
    resume_id: Optional[str] = None
    status: ApplicationStatus
    status_history: List[StatusChange] = []
    screening_result_id: Optional[str] = None
    applied_at: datetime
    updated_at: datetime
    
    # Optional screening data (if available and visible)
    score: Optional[float] = None
    score_visible: bool = True
    feedback: Optional[str] = None
    feedback_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    """Schema for listing applications."""
    applications: List[ApplicationResponse]
    total: int


class ApplicationStatusUpdate(BaseModel):
    """Schema for updating application status."""
    status: ApplicationStatus
    note: Optional[str] = None
