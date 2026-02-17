"""
Notification model for HR alerts (e.g., new candidate applications).
"""

from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    """Types of notifications."""
    NEW_APPLICATION = "new_application"
    RESUME_SCREENED = "resume_screened"
    INTERVIEW_COMPLETED = "interview_completed"
    GENERAL = "general"


class Notification(Document):
    """Notification document for the HR dashboard."""

    recipient_id: str = Field(...)        # HR user_id who should see this
    type: NotificationType = Field(...)
    title: str = Field(...)
    message: str = Field(...)

    # Related entity IDs for deep-linking
    job_id: Optional[str] = None
    application_id: Optional[str] = None
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None

    # State
    is_read: bool = Field(default=False)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
        indexes = [
            "recipient_id",
            "is_read",
            "created_at",
        ]


# ─── API Schemas ────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    """Schema for a single notification."""
    id: str
    type: NotificationType
    title: str
    message: str
    job_id: Optional[str] = None
    application_id: Optional[str] = None
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Schema for listing notifications."""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
