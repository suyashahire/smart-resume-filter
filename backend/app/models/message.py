"""
Message and Conversation models for HR-Candidate chat functionality.
"""

from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DirectMessage(Document):
    """Individual chat message between HR and Candidate."""
    
    conversation_id: str = Field(...)  # Reference to DirectConversation
    sender_id: str = Field(...)        # User ID of sender
    receiver_id: str = Field(...)      # User ID of receiver
    content: str = Field(..., min_length=1, max_length=5000)
    
    # Read status
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None
    
    class Settings:
        name = "direct_messages"
        indexes = [
            "conversation_id",
            "sender_id",
            "receiver_id",
            "sent_at",
        ]


class DirectConversation(Document):
    """Chat conversation between HR and Candidate.
    
    One conversation per HR-Candidate pair, optionally linked to a job.
    """
    
    hr_user_id: str = Field(...)         # HR user ID
    candidate_user_id: str = Field(...)  # Candidate user ID
    job_id: Optional[str] = None         # Optional job context
    
    # Last message info for display
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    last_message_preview: Optional[str] = None
    
    # Unread counts
    unread_count_hr: int = 0
    unread_count_candidate: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "direct_conversations"
        indexes = [
            "hr_user_id",
            "candidate_user_id",
            "job_id",
            "last_message_at",
        ]


# Pydantic schemas for API requests/responses

class MessageCreate(BaseModel):
    """Schema for creating a new message."""
    receiver_id: str
    content: str = Field(..., min_length=1, max_length=5000)
    job_id: Optional[str] = None  # Optional job context


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: str
    conversation_id: str
    sender_id: str
    receiver_id: str
    content: str
    sent_at: datetime
    read_at: Optional[datetime] = None
    is_mine: bool = False  # Set based on current user
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """Schema for conversation response."""
    id: str
    other_user: "UserSummary"
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    last_message_at: datetime
    last_message_preview: Optional[str] = None
    unread_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    """Brief user info for conversation display."""
    id: str
    name: str
    email: str
    role: str


class ConversationListResponse(BaseModel):
    """Schema for listing conversations."""
    conversations: List[ConversationResponse]
    total: int


class MessagesListResponse(BaseModel):
    """Schema for listing messages in a conversation."""
    messages: List[MessageResponse]
    conversation_id: str
    total: int


class MarkReadRequest(BaseModel):
    """Schema for marking messages as read."""
    pass  # No additional data needed


# Update forward references
ConversationResponse.model_rebuild()
