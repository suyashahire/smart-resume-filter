"""
WebSocket Connection Manager for real-time updates.
Manages client connections and broadcasts events.
"""

from fastapi import WebSocket
from typing import Dict, List, Set, Any
import json
import asyncio
from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    """Types of real-time events."""
    RESUME_UPLOADED = "resume_uploaded"
    RESUME_PARSED = "resume_parsed"
    CANDIDATE_SCORED = "candidate_scored"
    PIPELINE_STATUS_CHANGED = "pipeline_status_changed"
    INTERVIEW_ANALYZED = "interview_analyzed"
    REPORT_GENERATED = "report_generated"
    JOB_CREATED = "job_created"
    JOB_DELETED = "job_deleted"
    CONNECTION_ESTABLISHED = "connection_established"


class ConnectionManager:
    """
    Manages WebSocket connections and broadcasts.
    Singleton pattern to ensure single instance across the app.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        # Active connections: user_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # All connections for broadcast
        self.all_connections: Set[WebSocket] = set()
        # Connection metadata
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}
        
        self._initialized = True
    
    async def connect(self, websocket: WebSocket, user_id: str = "anonymous"):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        # Add to user-specific connections
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        # Add to all connections
        self.all_connections.add(websocket)
        
        # Store connection metadata
        self.connection_info[websocket] = {
            "user_id": user_id,
            "connected_at": datetime.utcnow().isoformat(),
        }
        
        # Send connection confirmation
        await self.send_personal_message(
            websocket,
            {
                "type": EventType.CONNECTION_ESTABLISHED,
                "data": {
                    "message": "Connected to HireQ real-time updates",
                    "connected_at": datetime.utcnow().isoformat(),
                    "total_connections": len(self.all_connections)
                }
            }
        )
        
        print(f"📡 WebSocket connected: user={user_id}, total={len(self.all_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        # Remove from all connections
        self.all_connections.discard(websocket)
        
        # Remove from user-specific connections
        info = self.connection_info.get(websocket, {})
        user_id = info.get("user_id", "anonymous")
        
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Remove metadata
        if websocket in self.connection_info:
            del self.connection_info[websocket]
        
        print(f"📡 WebSocket disconnected: user={user_id}, total={len(self.all_connections)}")
    
    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections of a specific user."""
        if user_id not in self.active_connections:
            return
        
        disconnected = []
        for websocket in self.active_connections[user_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error sending to user {user_id}: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected sockets
        for ws in disconnected:
            self.disconnect(ws)
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        disconnected = []
        
        for websocket in self.all_connections.copy():
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error broadcasting: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected sockets
        for ws in disconnected:
            self.disconnect(ws)
    
    async def broadcast_event(
        self,
        event_type: EventType,
        data: dict,
        user_id: str = None
    ):
        """
        Broadcast a typed event to clients.
        If user_id is provided, only send to that user's connections.
        """
        message = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if user_id:
            await self.send_to_user(user_id, message)
        else:
            await self.broadcast(message)
    
    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return len(self.all_connections)
    
    def get_user_connection_count(self, user_id: str) -> int:
        """Get number of connections for a specific user."""
        return len(self.active_connections.get(user_id, []))


# Singleton instance
_manager: ConnectionManager = None


def get_connection_manager() -> ConnectionManager:
    """Get the singleton ConnectionManager instance."""
    global _manager
    if _manager is None:
        _manager = ConnectionManager()
    return _manager
