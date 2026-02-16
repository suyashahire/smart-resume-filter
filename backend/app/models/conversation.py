"""
Conversation model for AI chatbot history.
"""

from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    """Message sender role."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    """A single message in a conversation."""
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)  # Citations, context used, etc.


class Conversation(Document):
    """Conversation document model for MongoDB."""
    
    user_id: str = Field(...)  # Reference to User who started the chat
    title: str = Field(default="New Conversation")
    messages: List[ChatMessage] = Field(default_factory=list)
    
    # Context tracking
    context_type: Optional[str] = None  # "resume", "job", "candidate", "general"
    context_ids: List[str] = Field(default_factory=list)  # Related document IDs
    
    # Status
    is_active: bool = Field(default=True)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "conversations"
        indexes = [
            "user_id",
            "created_at",
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "title": "Resume Analysis",
                "messages": [
                    {"role": "user", "content": "Tell me about the top candidates"},
                    {"role": "assistant", "content": "Based on the uploaded resumes..."}
                ]
            }
        }


# Pydantic schemas for API requests/responses

class ChatRequest(BaseModel):
    """Schema for sending a chat message."""
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None  # None for new conversation


class ChatResponse(BaseModel):
    """Schema for chat response."""
    conversation_id: str
    message: str
    sources: List[Dict[str, Any]] = []  # RAG sources used
    title: str = "New Conversation"


class ConversationSummary(BaseModel):
    """Schema for conversation list."""
    id: str
    title: str
    last_message: Optional[str] = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime
