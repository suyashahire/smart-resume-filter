"""
WebSocket routes for real-time updates.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
import jwt

from app.services.websocket_manager import get_connection_manager, EventType
from app.config import settings

router = APIRouter()


async def verify_websocket_token(token: Optional[str]) -> Optional[str]:
    """
    Verify JWT token for WebSocket connection.
    Returns user_id if valid, None if invalid or no token.
    """
    if not token:
        return None
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("sub")  # user_id from token
    except jwt.PyJWTError:
        return None


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: Optional[str] = Query(default="anonymous"),
    token: Optional[str] = Query(default=None)
):
    """
    WebSocket endpoint for real-time updates.
    
    Connect via: ws://localhost:8000/api/realtime/ws?user_id=<user_id>&token=<jwt_token>
    
    Authentication:
    - If token is provided, it will be verified and user_id extracted
    - If no token, user_id parameter is used (for backward compatibility)
    - In production, always use token for security
    
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
    
    # Verify token if provided
    authenticated_user_id = await verify_websocket_token(token)
    final_user_id = authenticated_user_id or user_id or "anonymous"
    
    await manager.connect(websocket, final_user_id)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Handle ping/pong for keepalive
            if data == "ping":
                await websocket.send_text("pong")
            
            # Could handle other client-to-server messages here if needed
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.get("/connections")
async def get_connection_stats():
    """Get current WebSocket connection statistics."""
    manager = get_connection_manager()
    
    return {
        "total_connections": manager.get_connection_count(),
        "users_connected": len(manager.active_connections)
    }
