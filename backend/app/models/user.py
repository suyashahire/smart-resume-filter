"""
User model for authentication and authorization.
"""

from beanie import Document
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


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
    
    # Account approval (for HR accounts requiring admin approval)
    account_status: AccountStatus = Field(default=AccountStatus.APPROVED)
    rejection_reason: Optional[str] = None
    approved_by: Optional[str] = None  # Admin user ID who approved
    approved_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
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
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.HR_MANAGER
    company: Optional[str] = None


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
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user details."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    company: Optional[str] = None


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


class ApproveUserRequest(BaseModel):
    """Request to approve a user."""
    pass  # No additional data needed


class RejectUserRequest(BaseModel):
    """Request to reject a user."""
    reason: str = Field(..., min_length=1, max_length=500)

