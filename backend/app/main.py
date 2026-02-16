"""
HireQ - AI-Powered Recruitment Platform - Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, resumes, jobs, interviews, reports, realtime, chat, candidate, admin, messaging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    await connect_to_mongo()
    print("🚀 HireQ API is starting up...")
    print(f"📊 Connected to MongoDB: {settings.DATABASE_NAME}")
    
    # Pre-load ML models to avoid first-request lag
    # Using singleton instances so models are reused across requests
    print("⏳ Pre-loading ML models (this may take a moment)...")
    try:
        from app.services.resume_parser import get_resume_parser
        from app.services.matching import get_matching_service
        from app.services.sentiment import get_sentiment_service
        
        # Initialize singleton services and pre-load models
        resume_parser = get_resume_parser()
        await resume_parser._initialize()
        print("  ✅ spaCy NLP model loaded")
        
        matching_service = get_matching_service()
        await matching_service._initialize()
        print("  ✅ Sentence-BERT model loaded")
        
        sentiment_service = get_sentiment_service()
        await sentiment_service._initialize()
        print("  ✅ Sentiment analysis model loaded")
        
        # Initialize RAG and Chatbot services
        from app.services.rag import get_rag_service
        from app.services.chatbot import get_chatbot_service
        
        rag_service = get_rag_service()
        await rag_service._initialize()
        
        chatbot_service = get_chatbot_service()
        await chatbot_service._initialize()
        
        print("✅ All ML models pre-loaded successfully!")
    except Exception as e:
        print(f"⚠️ Warning: Could not pre-load some models: {e}")
        print("  Models will load on first use instead.")
    
    yield
    
    # Shutdown
    await close_mongo_connection()
    print("👋 HireQ API is shutting down...")


# Create FastAPI application
app = FastAPI(
    title="HireQ API",
    description="""
    HireQ - AI-powered recruitment platform for intelligent candidate screening and interview evaluation.
    
    ## Features
    - 📄 Resume Parsing with NLP
    - 🎯 AI-powered Job-Candidate Matching
    - 🎤 Interview Transcription & Analysis
    - 📊 Sentiment & Confidence Scoring
    - 📋 Comprehensive Candidate Reports
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS - Build allowed origins list
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production frontend URL
if settings.FRONTEND_URL:
    allowed_origins.append(settings.FRONTEND_URL)
    # Also add without trailing slash if present, or with it if not
    if settings.FRONTEND_URL.endswith("/"):
        allowed_origins.append(settings.FRONTEND_URL.rstrip("/"))
    else:
        allowed_origins.append(settings.FRONTEND_URL + "/")

# Support Vercel preview deployments (*.vercel.app)
if settings.ENVIRONMENT == "production":
    # In production, also allow Vercel preview URLs
    allowed_origins.extend([
        "https://*.vercel.app",  # Vercel preview deployments
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Job Descriptions"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["Interviews"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(realtime.router, prefix="/api/realtime", tags=["Real-time Updates"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chatbot"])
app.include_router(candidate.router, prefix="/api/candidate", tags=["Candidate Portal"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(messaging.router, prefix="/api/messages", tags=["Messaging"])


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "HireQ API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "ml_models": "loaded"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

