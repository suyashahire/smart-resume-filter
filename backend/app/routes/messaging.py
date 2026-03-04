"""
Messaging routes for HR-Candidate chat functionality.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
from typing import Optional, List

from app.models.user import User, UserRole
from app.models.job import JobDescription
from app.models.message import (
    DirectMessage, DirectConversation,
    MessageCreate, MessageResponse, 
    ConversationResponse, ConversationListResponse, MessagesListResponse,
    UserSummary
)
from beanie import PydanticObjectId
from app.routes.auth import get_current_user
from app.services.websocket_manager import get_connection_manager, EventType

def _to_object_ids(str_ids: list) -> list:
    """Convert a list of string IDs to PydanticObjectId, skipping invalid ones."""
    ids = []
    for sid in str_ids:
        try:
            ids.append(PydanticObjectId(sid))
        except Exception:
            pass
    return ids

router = APIRouter()


# ==================== Helper Functions ====================

def get_other_user_id(conversation: DirectConversation, current_user: User) -> str:
    """Get the other user's ID in a conversation."""
    if str(current_user.id) == conversation.hr_user_id:
        return conversation.candidate_user_id
    return conversation.hr_user_id


def _get_unread_count_for_user(conversation: DirectConversation, current_user: User) -> int:
    """Get unread count for the current user based on their position in the conversation."""
    user_id = str(current_user.id)
    if user_id == conversation.hr_user_id:
        return conversation.unread_count_hr
    return conversation.unread_count_candidate


# ==================== Conversations ====================

@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    current_user: User = Depends(get_current_user),
):
    """
    Get all conversations for the current user.
    
    Works for both HR and Candidates.
    """
    # Find all conversations where this user is a participant (either side) and not deleted
    user_id = str(current_user.id)
    query = {
        "$or": [{"hr_user_id": user_id}, {"candidate_user_id": user_id}],
        "deleted_for_users": {"$ne": user_id}
    }
    
    conversations = await DirectConversation.find(query).sort("-last_message_at").to_list()
    
    # Batch-fetch all referenced users and jobs to avoid N+1 queries
    other_user_ids = []
    job_ids = []
    for conv in conversations:
        other_user_ids.append(get_other_user_id(conv, current_user))
        if conv.job_id:
            job_ids.append(conv.job_id)
    
    # Deduplicate and batch-fetch
    if other_user_ids:
        users_list = await User.find({"_id": {"$in": _to_object_ids(list(set(other_user_ids)))}}).to_list()
        user_map = {str(u.id): u for u in users_list}
    else:
        user_map = {}
    
    if job_ids:
        jobs_list = await JobDescription.find({"_id": {"$in": _to_object_ids(list(set(job_ids)))}}).to_list()
        job_map = {str(j.id): j for j in jobs_list}
    else:
        job_map = {}
    
    # Build response with pre-fetched data
    result = []
    for conv in conversations:
        other_user_id = get_other_user_id(conv, current_user)
        other_user = user_map.get(other_user_id)
        
        if not other_user:
            continue
        
        job_title = None
        if conv.job_id:
            job = job_map.get(conv.job_id)
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
            unread_count=_get_unread_count_for_user(conv, current_user),
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
    
    sender_id = str(current_user.id)
    receiver_id = message_data.receiver_id
    
    # Assign participant slots consistently using sorted IDs
    # This ensures the same pair always maps to the same conversation
    sorted_ids = sorted([sender_id, receiver_id])
    hr_user_id = sorted_ids[0]
    candidate_user_id = sorted_ids[1]
    
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
    
    # Update unread count for receiver based on their position in the conversation
    if receiver_id == conversation.hr_user_id:
        conversation.unread_count_hr += 1
    else:
        conversation.unread_count_candidate += 1
    
    # Un-delete for both users when a new message is sent
    if conversation.deleted_for_users:
        conversation.deleted_for_users = []
    
    await conversation.save()
    
    # Broadcast real-time message event to receiver
    try:
        ws_manager = get_connection_manager()
        await ws_manager.broadcast_event(
            EventType.NEW_MESSAGE,
            {
                "message_id": str(message.id),
                "conversation_id": message.conversation_id,
                "sender_id": message.sender_id,
                "sender_name": current_user.name,
                "receiver_id": message.receiver_id,
                "content": message.content[:100],
                "sent_at": message.sent_at.isoformat() if message.sent_at else None,
            },
            user_id=receiver_id
        )
    except Exception as e:
        # Don't fail the send if broadcast fails
        print(f"WebSocket broadcast failed: {e}")
    
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
    }).update_many({"$set": {"read_at": datetime.now(timezone.utc)}})
    
    # Reset unread count based on user's position in the conversation
    user_id_str = str(current_user.id)
    if user_id_str == conversation.hr_user_id:
        conversation.unread_count_hr = 0
    else:
        conversation.unread_count_candidate = 0
    
    await conversation.save()
    
    # Broadcast read receipt to the other user so their UI updates check marks
    other_user_id = get_other_user_id(conversation, current_user)
    manager = get_connection_manager()
    await manager.broadcast_event(
        EventType.MESSAGES_READ,
        {
            "conversation_id": conversation_id,
            "read_by": user_id,
            "read_at": datetime.now(timezone.utc).isoformat(),
        },
        user_id=other_user_id,
    )
    
    return {"message": "Messages marked as read"}


# ==================== Unread Count ====================

@router.get("/unread")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
):
    """
    Get total unread message count for the current user.
    """
    # Find all conversations where this user is a participant (not deleted)
    user_id = str(current_user.id)
    conversations = await DirectConversation.find(
        {
            "$or": [{"hr_user_id": user_id}, {"candidate_user_id": user_id}],
            "deleted_for_users": {"$ne": user_id}
        }
    ).to_list()
    total = sum(
        c.unread_count_hr if c.hr_user_id == user_id else c.unread_count_candidate
        for c in conversations
    )
    
    return {"unread_count": total}


# ==================== Delete Conversation ====================

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Soft-delete a conversation for the current user only.
    
    The conversation remains visible to the other participant.
    If a new message is sent later, the conversation reappears for both users.
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
    
    # Add user to deleted list if not already there
    if user_id not in conversation.deleted_for_users:
        conversation.deleted_for_users.append(user_id)
    
    # Reset unread count for the deleting user
    if user_id == conversation.hr_user_id:
        conversation.unread_count_hr = 0
    else:
        conversation.unread_count_candidate = 0
    
    await conversation.save()
    
    return {"message": "Conversation deleted"}


# ==================== Typing Indicator ====================

@router.post("/typing/{conversation_id}")
async def send_typing_indicator(
    conversation_id: str,
    is_typing: bool = True,
    current_user: User = Depends(get_current_user),
):
    """
    Broadcast a typing indicator to the other user in the conversation.
    """
    conversation = await DirectConversation.get(conversation_id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    user_id = str(current_user.id)
    if user_id != conversation.hr_user_id and user_id != conversation.candidate_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this conversation"
        )
    
    other_user_id = get_other_user_id(conversation, current_user)
    manager = get_connection_manager()
    event_type = EventType.TYPING_STARTED if is_typing else EventType.TYPING_STOPPED
    await manager.broadcast_event(
        event_type,
        {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "user_name": current_user.name,
        },
        user_id=other_user_id,
    )
    
    return {"message": "Typing indicator sent"}
