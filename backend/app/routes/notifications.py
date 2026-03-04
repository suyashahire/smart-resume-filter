"""
Notification routes for the HR dashboard.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from bson import ObjectId
from app.models.notification import (
    Notification,
    NotificationResponse,
    NotificationListResponse,
    NotificationType,
)
from app.models.application import Application, ApplicationStatus
from app.models.user import User
from app.routes.auth import get_current_user

router = APIRouter()


def _to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=str(n.id),
        type=n.type,
        title=n.title,
        message=n.message,
        job_id=n.job_id,
        application_id=n.application_id,
        candidate_id=n.candidate_id,
        candidate_name=n.candidate_name,
        job_title=n.job_title,
        is_read=n.is_read,
        created_at=n.created_at,
    )


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
):
    """Get notifications for the current user."""
    query = {"recipient_id": str(current_user.id)}
    if unread_only:
        query["is_read"] = False

    notifications = (
        await Notification.find(query)
        .sort("-created_at")
        .limit(limit)
        .to_list()
    )

    # Auto-clean stale approval notifications whose applications have already been processed
    clean_notifications = []
    stale_ids = []
    for n in notifications:
        n_type = n.type.value if hasattr(n.type, 'value') else str(n.type)
        if n_type == 'application_approval_required' and n.application_id:
            try:
                app = await Application.get(n.application_id)
                if not app or app.status != ApplicationStatus.PENDING_APPROVAL:
                    stale_ids.append(n.id)
                    continue
            except Exception:
                stale_ids.append(n.id)
                continue
        clean_notifications.append(n)

    # Delete stale notifications in background
    if stale_ids:
        try:
            from beanie import PydanticObjectId
            await Notification.find({"_id": {"$in": [PydanticObjectId(str(sid)) for sid in stale_ids]}}).delete()
        except Exception:
            pass

    unread_count = await Notification.find({
        "recipient_id": str(current_user.id),
        "is_read": False,
    }).count()

    return NotificationListResponse(
        notifications=[_to_response(n) for n in clean_notifications],
        total=len(clean_notifications),
        unread_count=unread_count,
    )


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    n = await Notification.get(notification_id)
    if not n or n.recipient_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    await n.save()
    return {"status": "ok"}


@router.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read."""
    await Notification.find({
        "recipient_id": str(current_user.id),
        "is_read": False,
    }).update_many({"$set": {"is_read": True}})
    return {"status": "ok"}


@router.delete("/all")
async def delete_all_notifications(
    current_user: User = Depends(get_current_user),
):
    """Delete all notifications for the current user."""
    await Notification.find({
        "recipient_id": str(current_user.id),
    }).delete()
    return {"status": "ok"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a notification."""
    # Validate that the ID is a valid MongoDB ObjectId
    if not ObjectId.is_valid(notification_id):
        # Client-side-only notification (e.g. from WebSocket), not in DB
        return {"status": "ok"}
    n = await Notification.get(notification_id)
    if not n or n.recipient_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Notification not found")
    await n.delete()
    return {"status": "ok"}
