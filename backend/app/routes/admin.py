"""
Admin routes for user management and approval.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from datetime import datetime
from typing import Optional, List

from app.models.user import (
    User, UserRole, AccountStatus, 
    UserListResponse, ApproveUserRequest, RejectUserRequest
)
from app.routes.auth import get_current_user, require_admin

router = APIRouter()


# ==================== User Management ====================

@router.get("/users", response_model=List[UserListResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    account_status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_admin),
):
    """
    Get all users with optional filters.
    
    Admin only.
    """
    # Build query
    query = {}
    
    if role:
        try:
            role_enum = UserRole(role)
            query["role"] = role_enum
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}"
            )
    
    if account_status:
        try:
            status_enum = AccountStatus(account_status)
            query["account_status"] = status_enum
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid account_status: {account_status}"
            )
    
    users = await User.find(query).skip(skip).limit(limit).to_list()
    
    # Filter by search if provided
    if search:
        search_lower = search.lower()
        users = [u for u in users if 
                search_lower in u.name.lower() or 
                search_lower in u.email.lower()]
    
    return [
        UserListResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            account_status=user.account_status,
            rejection_reason=user.rejection_reason,
            created_at=user.created_at,
            last_login=user.last_login,
        )
        for user in users
    ]


@router.get("/users/pending", response_model=List[UserListResponse])
async def get_pending_users(
    current_user: User = Depends(require_admin),
):
    """
    Get all users pending approval.
    
    Admin only.
    """
    users = await User.find(
        {"account_status": AccountStatus.PENDING}
    ).sort("-created_at").to_list()
    
    return [
        UserListResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            account_status=user.account_status,
            rejection_reason=user.rejection_reason,
            created_at=user.created_at,
            last_login=user.last_login,
        )
        for user in users
    ]


@router.get("/users/{user_id}", response_model=UserListResponse)
async def get_user_detail(
    user_id: str,
    current_user: User = Depends(require_admin),
):
    """
    Get detailed information about a specific user.
    
    Admin only.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserListResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        account_status=user.account_status,
        rejection_reason=user.rejection_reason,
        created_at=user.created_at,
        last_login=user.last_login,
    )


@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: str,
    current_user: User = Depends(require_admin),
):
    """
    Approve a pending user account.
    
    Admin only.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.account_status != AccountStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User account is not pending approval (current status: {user.account_status.value})"
        )
    
    # Approve the user
    user.account_status = AccountStatus.APPROVED
    user.is_active = True
    user.approved_by = str(current_user.id)
    user.approved_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    
    await user.save()
    
    # TODO: Send email notification to user
    
    return {
        "message": "User approved successfully",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "account_status": user.account_status.value,
        }
    }


@router.post("/users/{user_id}/reject")
async def reject_user(
    user_id: str,
    request: RejectUserRequest,
    current_user: User = Depends(require_admin),
):
    """
    Reject a pending user account with a reason.
    
    Admin only.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.account_status != AccountStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User account is not pending approval (current status: {user.account_status.value})"
        )
    
    # Reject the user
    user.account_status = AccountStatus.REJECTED
    user.is_active = False
    user.rejection_reason = request.reason
    user.updated_at = datetime.utcnow()
    
    await user.save()
    
    # TODO: Send email notification to user
    
    return {
        "message": "User rejected",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "account_status": user.account_status.value,
            "rejection_reason": user.rejection_reason,
        }
    }


@router.post("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    current_user: User = Depends(require_admin),
):
    """
    Toggle a user's active status.
    
    Admin only.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow deactivating yourself
    if str(user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )
    
    user.is_active = not user.is_active
    user.updated_at = datetime.utcnow()
    
    await user.save()
    
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "is_active": user.is_active,
        }
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_admin),
):
    """
    Delete a user account.
    
    Admin only. Use with caution.
    """
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow deleting yourself
    if str(user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    # Don't allow deleting other admins
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin accounts"
        )
    
    await user.delete()
    
    return {"message": "User deleted successfully"}


# ==================== Statistics ====================

@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(require_admin),
):
    """
    Get admin dashboard statistics.
    
    Admin only.
    """
    total_users = await User.count()
    pending_users = await User.find({"account_status": AccountStatus.PENDING}).count()
    active_users = await User.find({"is_active": True}).count()
    
    # Count by role
    hr_users = await User.find({"role": UserRole.HR_MANAGER}).count()
    candidates = await User.find({"role": UserRole.CANDIDATE}).count()
    admins = await User.find({"role": UserRole.ADMIN}).count()
    
    return {
        "total_users": total_users,
        "pending_approval": pending_users,
        "active_users": active_users,
        "by_role": {
            "hr_managers": hr_users,
            "candidates": candidates,
            "admins": admins,
        }
    }
