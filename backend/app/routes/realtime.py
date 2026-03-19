"""
WebSocket routes for real-time updates.
"""

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from typing import Optional
from jose import jwt, JWTError

from app.services.websocket_manager import get_connection_manager, EventType
from app.config import settings
from app.models.user import User
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


async def verify_websocket_token(token: Optional[str]) -> Optional[str]:
    """
    Verify JWT token for WebSocket connection.
    Returns user_id if valid, None if invalid, revoked, or no token.
    """
    if not token:
        return None
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        token_ver = payload.get("tv", 0)
        
        if not user_id:
            return None
        
        # Verify token_version matches — rejects revoked tokens
        user = await User.get(user_id)
        if not user or not user.is_active:
            return None
        if getattr(user, 'token_version', 0) != token_ver:
            return None
        
        return user_id
    except JWTError:
        return None


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None)
):
    """
    WebSocket endpoint for real-time updates.
    
    Connect via: ws://localhost:8000/api/realtime/ws?token=<jwt_token>
    
    Authentication:
    - A valid JWT token is REQUIRED
    - Connections without a valid token are rejected with code 4001
    
    Events sent to clients:
    - resume_uploaded: New resume uploaded
    - resume_parsed: Resume parsing completed
    - candidate_scored: Candidate matching score calculated
    - pipeline_status_changed: Candidate pipeline status updated
    - interview_analyzed: Interview analysis completed
    - report_generated: Report generated
    - job_created: New job created
    - job_deleted: Job deleted
    """
    manager = get_connection_manager()
    
    # Verify token — reject unauthenticated connections
    authenticated_user_id = await verify_websocket_token(token)
    if not authenticated_user_id:
        await websocket.close(code=4001, reason="Authentication required")
        return
    
    await manager.connect(websocket, authenticated_user_id)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Handle ping/pong for keepalive
            if data == "ping":
                await websocket.send_text("pong")
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.exception("WebSocket error for user %s", authenticated_user_id)
        manager.disconnect(websocket)


@router.get("/connections")
async def get_connection_stats(current_user: User = Depends(get_current_user)):
    """Get current WebSocket connection statistics (authenticated)."""
    manager = get_connection_manager()
    
    return {
        "total_connections": manager.get_connection_count(),
        "users_connected": len(manager.active_connections)
    }
