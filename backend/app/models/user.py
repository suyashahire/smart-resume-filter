"""
User model for authentication and authorization.
"""

from beanie import Document
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, List
from datetime import datetime, timezone
from enum import Enum
import re


class UserRole(str, Enum):
    """User roles for authorization."""
    HR_MANAGER = "hr_manager"
    ADMIN = "admin"
    VIEWER = "viewer"
    CANDIDATE = "candidate"  # Job applicants


class AccountStatus(str, Enum):
    """Account approval status."""
    PENDING = "pending"      # Awaiting admin approval (HR only)
    APPROVED = "approved"    # Active account
    REJECTED = "rejected"    # Rejected by admin


class User(Document):
    """User document model for MongoDB."""
    
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., unique=True)
    password_hash: str = Field(...)
    role: UserRole = Field(default=UserRole.HR_MANAGER)
    is_active: bool = Field(default=True)
    
    # Company info (for HR users)
    company: Optional[str] = None
    
    # Notification preferences (category -> enabled)
    # None means all enabled (default). Categories: resume_uploads, candidate_scoring,
    # new_applications, messages, job_updates, interviews
    notification_preferences: Optional[Dict[str, bool]] = None
    
    # Account approval (for HR accounts requiring admin approval)
    account_status: AccountStatus = Field(default=AccountStatus.APPROVED)
    rejection_reason: Optional[str] = None
    approved_by: Optional[str] = None  # Admin user ID who approved
    approved_at: Optional[datetime] = None
    
    # Candidate profile fields
    phone: Optional[str] = None
    location: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    experience_years: Optional[int] = None
    education: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    
    # Saved/bookmarked jobs (for candidates)
    saved_jobs: List[str] = Field(default_factory=list)
    
    # Token revocation: increment to invalidate all existing JWTs
    token_version: int = Field(default=0)
    
    # Brute-force protection
    failed_login_attempts: int = Field(default=0)
    locked_until: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "role",
            "account_status",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "HR Manager",
                "email": "hr@company.com",
                "role": "hr_manager",
                "account_status": "approved",
                "company": "Acme Corp"
            }
        }


# Pydantic schemas for API requests/responses

class UserCreate(BaseModel):
    """Schema for creating a new user."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=12)
    role: UserRole = UserRole.HR_MANAGER
    company: Optional[str] = None

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (without password)."""
    id: str
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    account_status: AccountStatus = AccountStatus.APPROVED
    rejection_reason: Optional[str] = None
    company: Optional[str] = None
    notification_preferences: Optional[Dict[str, bool]] = None
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user details.
    
    Note: `role` and `is_active` are intentionally excluded to prevent
    privilege-escalation via the self-service PUT /api/auth/me endpoint.
    Only admins can change roles/active status through dedicated admin routes.
    """
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    notification_preferences: Optional[Dict[str, bool]] = None


class Token(BaseModel):
    """JWT Token response schema."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Token payload data."""
    user_id: Optional[str] = None
    email: Optional[str] = None


# Admin schemas for user management

class UserListResponse(BaseModel):
    """Response for listing users (admin)."""
    id: str
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    account_status: AccountStatus
    rejection_reason: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class CandidateProfileUpdate(BaseModel):
    """Schema for updating candidate profile."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    location: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    experience_years: Optional[int] = None
    education: Optional[str] = None
    skills: Optional[List[str]] = None


class ApproveUserRequest(BaseModel):
    """Request to approve a user."""
    pass  # No additional data needed


class RejectUserRequest(BaseModel):
    """Request to reject a user."""
    reason: str = Field(..., min_length=1, max_length=500)

