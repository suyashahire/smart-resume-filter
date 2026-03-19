"""
Chat API routes for the AI chatbot.
"""

from fastapi import APIRouter, HTTPException, Depends, Request, status, Query
from typing import List, Optional
from datetime import datetime, timezone

from app.models.conversation import (
    Conversation, ChatMessage, MessageRole,
    ChatRequest, ChatResponse, ConversationSummary
)
from app.services.chatbot import get_chatbot_service
from app.services.rag import get_rag_service
from app.routes.auth import get_current_user, require_admin
from app.models.user import User
from app.limiter import limiter

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
        timestamp=datetime.now(timezone.utc)
    )
    conversation.messages.append(user_msg)
    
    # Build conversation history for context
    history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in conversation.messages[:-1]  # Exclude current message
    ]
    
    # Generate AI response with user context
    result = await chatbot.generate_response(
        user_message=request.message,
        conversation_history=history,
        user=current_user,
    )
    
    # Add assistant message
    assistant_msg = ChatMessage(
        role=MessageRole.ASSISTANT,
        content=result["response"],
        timestamp=datetime.now(timezone.utc),
        metadata={
            "model": result.get("model", "unknown"),
            "rag_used": result.get("rag_used", False),
            "user_context_used": result.get("user_context_used", False),
            "sources_count": len(result.get("sources", []))
        }
    )
    conversation.messages.append(assistant_msg)
    
    # Generate title for new conversations (first message)
    if len(conversation.messages) == 2:  # User + Assistant
        conversation.title = await chatbot.generate_title(request.message)
    
    # Save conversation
    conversation.updated_at = datetime.now(timezone.utc)
    await conversation.save()
    
    return ChatResponse(
        conversation_id=str(conversation.id),
        message=result["response"],
        sources=result.get("sources", []),
        title=conversation.title
    )


@router.post("/message/anonymous", response_model=ChatResponse)
@limiter.limit("5/minute")
async def send_message_anonymous(request: Request, body: ChatRequest):
    """
    Send a message without authentication.
    Uses a temp conversation per session (no persistence).
    Uses context field to select appropriate system prompt.
    
    Rate-limited to 5/min per IP to prevent abuse.
    TODO: Add CAPTCHA verification before production launch.
    """
    chatbot = get_chatbot_service()
    await chatbot._initialize()
    
    # Generate response without conversation history for anonymous users
    # Use context field for role-appropriate responses
    result = await chatbot.generate_response(
        user_message=body.message,
        conversation_history=[],
        user=None,
        context=body.context,  # 'candidate' or 'hr'
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
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0)
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
    conversation.updated_at = datetime.now(timezone.utc)
    await conversation.save()
    
    return {"message": "Conversation deleted"}


@router.post("/reindex")
async def reindex_rag(current_user: User = Depends(require_admin)):
    """Reindex all documents for RAG search."""
    rag = get_rag_service()
    await rag._initialize()
    
    if not rag.is_available():
        raise HTTPException(status_code=503, detail="RAG service not available")
    
    result = await rag.reindex_all()
    return result


@router.get("/status")
async def chatbot_status(current_user: User = Depends(get_current_user)):
    """Get chatbot and RAG status (requires authentication)."""
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


@router.get("/healthz")
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    try:
        from app.database import db
        # Ping MongoDB to verify connectivity
        await db.client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected", "error": str(e)}
        )
