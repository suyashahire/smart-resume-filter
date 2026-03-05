"""
Authentication routes for user registration, login, and management.
"""

import logging
import re
from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timedelta, timezone
from typing import Optional, Callable
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.models.user import (
    User, UserCreate, UserLogin, UserResponse, 
    UserUpdate, Token, TokenData, UserRole, AccountStatus
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Account lockout settings
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with token_version for revocation support."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        token_ver: int = payload.get("tv", 0)
        
        if user_id is None:
            raise credentials_exception
            
        token_data = TokenData(user_id=user_id)
        
    except JWTError:
        raise credentials_exception
    
    user = await User.get(token_data.user_id)
    
    if user is None:
        raise credentials_exception
    
    # Check token version for revocation
    if token_ver != getattr(user, 'token_version', 0):
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user


# ==================== Role-Based Access Control ====================

def require_role(*allowed_roles: UserRole) -> Callable:
    """Create a dependency that requires specific user roles.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user: User = Depends(require_role(UserRole.ADMIN))):
            ...
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this action"
            )
        return current_user
    return role_checker


# Convenience dependencies for common role checks
require_hr = require_role(UserRole.HR_MANAGER, UserRole.ADMIN)
require_candidate = require_role(UserRole.CANDIDATE)
require_admin = require_role(UserRole.ADMIN)
require_hr_or_admin = require_role(UserRole.HR_MANAGER, UserRole.ADMIN)

# Rate limiter
from app.limiter import limiter


async def _authenticate_user(email: str, password: str, request: Request) -> tuple[User, str]:
    """Shared authentication logic with lockout, logging, and token_version.
    
    Returns (user, access_token) on success.
    Raises HTTPException on failure.
    """
    user = await User.find_one(User.email == email)
    
    # Check account lockout
    if user and user.locked_until and user.locked_until > datetime.now(timezone.utc):
        remaining = int((user.locked_until - datetime.now(timezone.utc)).total_seconds() / 60) + 1
        logger.warning("auth.login_locked email=%s remaining_min=%d", email[:3] + "***", remaining)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked. Try again in {remaining} minute(s)."
        )
    
    if not user or not verify_password(password, user.password_hash):
        # Increment failed attempts
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                logger.warning("auth.account_locked email=%s attempts=%d", email[:3] + "***", user.failed_login_attempts)
            await user.save()
        logger.warning("auth.login_failed email=%s ip=%s", email[:3] + "***", request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check account status
    if user.account_status == AccountStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval. You'll receive an email once approved."
        )
    
    if user.account_status == AccountStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account application was not approved. Contact support for details."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Reset failed attempts on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.now(timezone.utc)
    await user.save()
    
    # Create access token with token_version
    access_token = create_access_token(data={
        "sub": str(user.id),
        "tv": getattr(user, 'token_version', 0),
    })
    
    logger.info("auth.login_success user_id=%s role=%s", str(user.id), user.role.value)
    return user, access_token


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, user_data: UserCreate):
    """
    Register a new user.
    
    - **name**: User's full name
    - **email**: User's email address (must be unique)
    - **password**: Password (minimum 8 characters, must contain letter + digit)
    - **role**: User role (hr_manager, admin, viewer, candidate)
    
    Registration behavior:
    - Candidates: Immediately active (account_status=approved)
    - HR Managers: Pending admin approval (account_status=pending, is_active=false)
    - Admins: Can only be created by existing admins
    """
    # Check if user already exists
    existing_user = await User.find_one(User.email == user_data.email)
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration failed. If this email is already in use, please log in instead."
        )
    
    # Prevent self-registration as admin
    if user_data.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts can only be created by existing administrators"
        )
    
    # Create new user with role-based account status
    hashed_password = get_password_hash(user_data.password)
    
    # Candidates are immediately active, HR needs admin approval
    if user_data.role == UserRole.CANDIDATE:
        account_status = AccountStatus.APPROVED
        is_active = True
    else:
        # HR_MANAGER and VIEWER need admin approval
        account_status = AccountStatus.PENDING
        is_active = False
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role,
        company=user_data.company,
        account_status=account_status,
        is_active=is_active
    )
    
    await user.insert()
    
    logger.info("auth.register user_id=%s role=%s", str(user.id), user.role.value)
    
    # For pending accounts, don't return a token
    if account_status == AccountStatus.PENDING:
        # Return a special response indicating pending status
        return Token(
            access_token="",  # No token for pending accounts
            user=UserResponse(
                id=str(user.id),
                name=user.name,
                email=user.email,
                role=user.role,
                is_active=user.is_active,
                account_status=user.account_status,
                company=user.company,
                notification_preferences=user.notification_preferences,
                created_at=user.created_at,
                last_login=user.last_login
            )
        )
    
    # Create access token for active accounts
    access_token = create_access_token(data={"sub": str(user.id), "tv": 0})
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            account_status=user.account_status,
            company=user.company,
            notification_preferences=user.notification_preferences,
            created_at=user.created_at,
            last_login=user.last_login
        )
    )


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login with email and password.
    
    Returns a JWT access token for authenticated requests.
    """
    user, access_token = await _authenticate_user(form_data.username, form_data.password, request)
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            account_status=user.account_status,
            company=user.company,
            notification_preferences=user.notification_preferences,
            created_at=user.created_at,
            last_login=user.last_login
        )
    )


@router.post("/login/json", response_model=Token)
@limiter.limit("10/minute")
async def login_json(request: Request, login_data: UserLogin):
    """
    Login with JSON body (alternative to form data).
    
    - **email**: User's email address
    - **password**: User's password
    """
    user, access_token = await _authenticate_user(login_data.email, login_data.password, request)
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            account_status=user.account_status,
            company=user.company,
            notification_preferences=user.notification_preferences,
            created_at=user.created_at,
            last_login=user.last_login
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's information."""
    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        account_status=current_user.account_status,
        company=current_user.company,
        notification_preferences=current_user.notification_preferences,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update the current user's information."""
    if user_update.name is not None:
        current_user.name = user_update.name
    
    if user_update.email is not None:
        # Check if email is already taken
        existing = await User.find_one(User.email == user_update.email)
        if existing and str(existing.id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = user_update.email
    
    if user_update.company is not None:
        current_user.company = user_update.company
    
    if user_update.notification_preferences is not None:
        current_user.notification_preferences = user_update.notification_preferences
    
    current_user.updated_at = datetime.now(timezone.utc)
    await current_user.save()
    
    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        account_status=current_user.account_status,
        company=current_user.company,
        notification_preferences=current_user.notification_preferences,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )


class ChangePasswordRequest(BaseModel):
    """Schema for password change requests."""
    current_password: str
    new_password: str = Field(..., min_length=12)

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


@router.post("/change-password")
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Change the current user's password.
    
    - **current_password**: Current password for verification
    - **new_password**: New password (minimum 8 characters, must contain letter + digit)
    """
    # Verify current password
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password and invalidate all existing tokens
    current_user.password_hash = get_password_hash(data.new_password)
    current_user.token_version = getattr(current_user, 'token_version', 0) + 1
    current_user.updated_at = datetime.now(timezone.utc)
    await current_user.save()
    
    logger.info("auth.password_changed user_id=%s", str(current_user.id))
    
    return {"message": "Password changed successfully. Please log in again."}


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user)
):
    """
    Delete the current user's account and all associated data.
    
    This is irreversible. Cascades deletes to:
    - Resumes
    - Applications
    - Screening results
    - Interviews
    - Conversations
    - Notifications
    """
    from app.models.resume import Resume
    from app.models.application import Application
    from app.models.screening import ScreeningResult
    from app.models.interview import Interview
    from app.models.conversation import Conversation
    from app.models.message import DirectConversation, DirectMessage
    from app.models.notification import Notification
    
    user_id = str(current_user.id)
    
    # Gather resume IDs first (before deleting anything)
    user_resumes = await Resume.find({"user_id": user_id}).to_list()
    resume_ids = [str(r.id) for r in user_resumes]
    
    # Delete screening results and interviews linked to resumes
    if resume_ids:
        await ScreeningResult.find({"resume_id": {"$in": resume_ids}}).delete()
        await Interview.find({"resume_id": {"$in": resume_ids}}).delete()
    
    # Delete resumes, applications
    await Resume.find({"user_id": user_id}).delete()
    await Application.find({"candidate_id": user_id}).delete()
    
    # Delete AI chatbot conversations (Conversation model uses user_id)
    await Conversation.find({"user_id": user_id}).delete()
    
    # Delete direct messaging conversations and messages
    await DirectConversation.find(
        {"$or": [{"hr_user_id": user_id}, {"candidate_user_id": user_id}]}
    ).delete()
    await DirectMessage.find(
        {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]}
    ).delete()
    
    # Delete notifications (Notification model uses recipient_id)
    await Notification.find({"recipient_id": user_id}).delete()
    
    # Finally delete the user
    await current_user.delete()
    
    return {"message": "Account deleted successfully"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout the current user.
    
    Note: Since we use JWT tokens, logout is handled client-side by removing the token.
    This endpoint is for logging purposes.
    """
    return {"message": "Successfully logged out", "user": current_user.email}

