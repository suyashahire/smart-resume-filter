"""
Messaging routes for HR-Candidate chat functionality.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from typing import Optional, List

from app.models.user import User, UserRole
from app.models.job import JobDescription
from app.models.message import (
    DirectMessage, DirectConversation,
    MessageCreate, MessageResponse, 
    ConversationResponse, ConversationListResponse, MessagesListResponse,
    UserSummary
)
from app.routes.auth import get_current_user

router = APIRouter()


# ==================== Helper Functions ====================

def get_other_user_id(conversation: DirectConversation, current_user: User) -> str:
    """Get the other user's ID in a conversation."""
    if str(current_user.id) == conversation.hr_user_id:
        return conversation.candidate_user_id
    return conversation.hr_user_id


def get_unread_count(conversation: DirectConversation, current_user: User) -> int:
    """Get unread count for the current user."""
    if current_user.role == UserRole.CANDIDATE:
        return conversation.unread_count_candidate
    return conversation.unread_count_hr


# ==================== Conversations ====================

@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    current_user: User = Depends(get_current_user),
):
    """
    Get all conversations for the current user.
    
    Works for both HR and Candidates.
    """
    # Build query based on user role
    if current_user.role == UserRole.CANDIDATE:
        query = {"candidate_user_id": str(current_user.id)}
    else:
        # HR or Admin
        query = {"hr_user_id": str(current_user.id)}
    
    conversations = await DirectConversation.find(query).sort("-last_message_at").to_list()
    
    # Build response with other user info
    result = []
    for conv in conversations:
        other_user_id = get_other_user_id(conv, current_user)
        other_user = await User.get(other_user_id)
        
        if not other_user:
            continue
        
        job_title = None
        if conv.job_id:
            job = await JobDescription.get(conv.job_id)
            if job:
                job_title = job.title
        
        result.append(ConversationResponse(
            id=str(conv.id),
            other_user=UserSummary(
                id=str(other_user.id),
                name=other_user.name,
                email=other_user.email,
                role=other_user.role.value,
            ),
            job_id=conv.job_id,
            job_title=job_title,
            last_message_at=conv.last_message_at,
            last_message_preview=conv.last_message_preview,
            unread_count=get_unread_count(conv, current_user),
            created_at=conv.created_at,
        ))
    
    return ConversationListResponse(
        conversations=result,
        total=len(result)
    )


@router.get("/conversations/{conversation_id}", response_model=MessagesListResponse)
async def get_conversation_messages(
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
):
    """
    Get all messages in a conversation.
    """
    # Verify conversation exists and user has access
    conversation = await DirectConversation.get(conversation_id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Check access
    user_id = str(current_user.id)
    if user_id != conversation.hr_user_id and user_id != conversation.candidate_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this conversation"
        )
    
    # Get messages
    messages = await DirectMessage.find(
        {"conversation_id": conversation_id}
    ).sort("-sent_at").skip(skip).limit(limit).to_list()
    
    # Reverse to show oldest first
    messages.reverse()
    
    return MessagesListResponse(
        messages=[
            MessageResponse(
                id=str(msg.id),
                conversation_id=msg.conversation_id,
                sender_id=msg.sender_id,
                receiver_id=msg.receiver_id,
                content=msg.content,
                sent_at=msg.sent_at,
                read_at=msg.read_at,
                is_mine=msg.sender_id == user_id,
            )
            for msg in messages
        ],
        conversation_id=conversation_id,
        total=len(messages)
    )


# ==================== Send Messages ====================

@router.post("/send", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to another user.
    
    Creates a new conversation if one doesn't exist.
    """
    # Get receiver
    receiver = await User.get(message_data.receiver_id)
    
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Validate sender-receiver roles
    sender_id = str(current_user.id)
    receiver_id = message_data.receiver_id
    
    # Determine HR and candidate IDs
    if current_user.role == UserRole.CANDIDATE:
        if receiver.role not in [UserRole.HR_MANAGER, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidates can only message HR staff"
            )
        hr_user_id = receiver_id
        candidate_user_id = sender_id
    else:
        # HR/Admin sending to candidate
        if receiver.role != UserRole.CANDIDATE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="HR can only message candidates through this system"
            )
        hr_user_id = sender_id
        candidate_user_id = receiver_id
    
    # Find or create conversation
    conversation = await DirectConversation.find_one({
        "hr_user_id": hr_user_id,
        "candidate_user_id": candidate_user_id,
    })
    
    if not conversation:
        # Create new conversation
        conversation = DirectConversation(
            hr_user_id=hr_user_id,
            candidate_user_id=candidate_user_id,
            job_id=message_data.job_id,
        )
        await conversation.insert()
    
    # Create message
    message = DirectMessage(
        conversation_id=str(conversation.id),
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=message_data.content,
    )
    
    await message.insert()
    
    # Update conversation
    conversation.last_message_at = message.sent_at
    conversation.last_message_preview = message.content[:100]
    
    # Update unread count for receiver
    if current_user.role == UserRole.CANDIDATE:
        conversation.unread_count_hr += 1
    else:
        conversation.unread_count_candidate += 1
    
    await conversation.save()
    
    return MessageResponse(
        id=str(message.id),
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        sent_at=message.sent_at,
        read_at=message.read_at,
        is_mine=True,
    )


# ==================== Mark as Read ====================

@router.post("/read/{conversation_id}")
async def mark_as_read(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Mark all messages in a conversation as read.
    """
    conversation = await DirectConversation.get(conversation_id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Check access
    user_id = str(current_user.id)
    if user_id != conversation.hr_user_id and user_id != conversation.candidate_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this conversation"
        )
    
    # Mark messages as read
    await DirectMessage.find({
        "conversation_id": conversation_id,
        "receiver_id": user_id,
        "read_at": None
    }).update_many({"$set": {"read_at": datetime.utcnow()}})
    
    # Reset unread count
    if current_user.role == UserRole.CANDIDATE:
        conversation.unread_count_candidate = 0
    else:
        conversation.unread_count_hr = 0
    
    await conversation.save()
    
    return {"message": "Messages marked as read"}


# ==================== Unread Count ====================

@router.get("/unread")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
):
    """
    Get total unread message count for the current user.
    """
    # Build query based on user role
    if current_user.role == UserRole.CANDIDATE:
        conversations = await DirectConversation.find(
            {"candidate_user_id": str(current_user.id)}
        ).to_list()
        total = sum(c.unread_count_candidate for c in conversations)
    else:
        conversations = await DirectConversation.find(
            {"hr_user_id": str(current_user.id)}
        ).to_list()
        total = sum(c.unread_count_hr for c in conversations)
    
    return {"unread_count": total}
