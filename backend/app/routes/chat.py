"""
Chat API routes for the AI chatbot.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime

from app.models.conversation import (
    Conversation, ChatMessage, MessageRole,
    ChatRequest, ChatResponse, ConversationSummary
)
from app.services.chatbot import get_chatbot_service
from app.services.rag import get_rag_service
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to the AI chatbot and get a response.
    Creates a new conversation if conversation_id is not provided.
    """
    chatbot = get_chatbot_service()
    
    # Ensure chatbot is initialized
    await chatbot._initialize()
    
    # Get or create conversation
    conversation = None
    if request.conversation_id:
        conversation = await Conversation.get(request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if conversation.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
    
    if not conversation:
        conversation = Conversation(
            user_id=str(current_user.id),
            title="New Conversation",
            messages=[]
        )
        await conversation.insert()
    
    # Add user message
    user_msg = ChatMessage(
        role=MessageRole.USER,
        content=request.message,
        timestamp=datetime.utcnow()
    )
    conversation.messages.append(user_msg)
    
    # Build conversation history for context
    history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in conversation.messages[:-1]  # Exclude current message
    ]
    
    # Generate AI response
    result = await chatbot.generate_response(
        user_message=request.message,
        conversation_history=history,
    )
    
    # Add assistant message
    assistant_msg = ChatMessage(
        role=MessageRole.ASSISTANT,
        content=result["response"],
        timestamp=datetime.utcnow(),
        metadata={
            "model": result.get("model", "unknown"),
            "rag_used": result.get("rag_used", False),
            "sources_count": len(result.get("sources", []))
        }
    )
    conversation.messages.append(assistant_msg)
    
    # Generate title for new conversations (first message)
    if len(conversation.messages) == 2:  # User + Assistant
        conversation.title = await chatbot.generate_title(request.message)
    
    # Save conversation
    conversation.updated_at = datetime.utcnow()
    await conversation.save()
    
    return ChatResponse(
        conversation_id=str(conversation.id),
        message=result["response"],
        sources=result.get("sources", []),
        title=conversation.title
    )


@router.post("/message/anonymous", response_model=ChatResponse)
async def send_message_anonymous(request: ChatRequest):
    """
    Send a message without authentication.
    Uses a temp conversation per session (no persistence).
    """
    chatbot = get_chatbot_service()
    await chatbot._initialize()
    
    # Generate response without conversation history for anonymous users
    result = await chatbot.generate_response(
        user_message=request.message,
        conversation_history=[],
    )
    
    return ChatResponse(
        conversation_id="anonymous",
        message=result["response"],
        sources=result.get("sources", []),
        title="Chat"
    )


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    limit: int = 20,
    skip: int = 0
):
    """List user's conversations."""
    conversations = await Conversation.find(
        Conversation.user_id == str(current_user.id),
        Conversation.is_active == True
    ).sort(-Conversation.updated_at).skip(skip).limit(limit).to_list()
    
    return [
        ConversationSummary(
            id=str(conv.id),
            title=conv.title,
            last_message=conv.messages[-1].content[:100] if conv.messages else None,
            message_count=len(conv.messages),
            created_at=conv.created_at,
            updated_at=conv.updated_at
        )
        for conv in conversations
    ]


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation with all messages."""
    conversation = await Conversation.get(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "id": str(conversation.id),
        "title": conversation.title,
        "messages": [
            {
                "role": msg.role.value,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat(),
                "metadata": msg.metadata
            }
            for msg in conversation.messages
        ],
        "created_at": conversation.created_at.isoformat(),
        "updated_at": conversation.updated_at.isoformat()
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete (soft) a conversation."""
    conversation = await Conversation.get(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    conversation.is_active = False
    conversation.updated_at = datetime.utcnow()
    await conversation.save()
    
    return {"message": "Conversation deleted"}


@router.post("/reindex")
async def reindex_rag(current_user: User = Depends(get_current_user)):
    """Reindex all documents for RAG search."""
    rag = get_rag_service()
    await rag._initialize()
    
    if not rag.is_available():
        raise HTTPException(status_code=503, detail="RAG service not available")
    
    result = await rag.reindex_all()
    return result


@router.get("/status")
async def chatbot_status():
    """Get chatbot and RAG status (public endpoint)."""
    chatbot = get_chatbot_service()
    rag = get_rag_service()
    
    rag_stats = await rag.get_stats()
    
    return {
        "chatbot": {
            "available": chatbot.is_available(),
            "model": "gemini-2.0-flash" if chatbot.is_available() else "fallback",
        },
        "rag": rag_stats
    }
