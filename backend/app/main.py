"""
HireQ - AI-Powered Recruitment Platform - Main FastAPI Application
"""

import logging
import logging.config
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.limiter import limiter
from app.routes import auth, resumes, jobs, interviews, reports, realtime, chat, candidate, admin, messaging, insights, notifications

# ── Structured logging configuration ────────────────────────────
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "format": "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            "datefmt": "%Y-%m-%dT%H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structured",
            "stream": "ext://sys.stdout",
        },
    },
    "root": {
        "level": settings.LOG_LEVEL if hasattr(settings, "LOG_LEVEL") else "INFO",
        "handlers": ["console"],
    },
    "loggers": {
        "uvicorn": {"level": "INFO"},
        "uvicorn.access": {"level": "WARNING"},
        "app": {"level": "DEBUG", "propagate": True},
    },
}
logging.config.dictConfig(LOGGING_CONFIG)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    await connect_to_mongo()
    logger.info("HireQ API is starting up...")
    logger.info("Connected to MongoDB: %s", settings.DATABASE_NAME)
    
    logger.info("Pre-loading ML models...")
    try:
        from app.services.resume_parser import get_resume_parser
        from app.services.matching import get_matching_service
        from app.services.sentiment import get_sentiment_service
        
        # Initialize singleton services and pre-load models
        resume_parser = get_resume_parser()
        await resume_parser._initialize()
        logger.info("spaCy NLP model loaded")
        
        matching_service = get_matching_service()
        await matching_service._initialize()
        logger.info("Sentence-BERT model loaded")
        
        sentiment_service = get_sentiment_service()
        await sentiment_service._initialize()
        logger.info("Sentiment analysis model loaded")
        
        # Initialize RAG and Chatbot services
        from app.services.rag import get_rag_service
        from app.services.chatbot import get_chatbot_service
        
        rag_service = get_rag_service()
        await rag_service._initialize()
        
        chatbot_service = get_chatbot_service()
        await chatbot_service._initialize()
        
        logger.info("All ML models pre-loaded successfully")
    except Exception as e:
        logger.warning("Could not pre-load some models: %s — will load on first use", e)
    
    yield
    
    # Shutdown
    await close_mongo_connection()
    logger.info("HireQ API is shutting down")


# Create FastAPI application
_docs_kwargs = {}
if settings.ENVIRONMENT == "production":
    _docs_kwargs = {"docs_url": None, "redoc_url": None, "openapi_url": None}

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
    lifespan=lifespan,
    **_docs_kwargs
)

# Configure CORS - Build allowed origins list
allowed_origins = []

if settings.ENVIRONMENT != "production":
    allowed_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

# Add production frontend URL
if settings.FRONTEND_URL:
    allowed_origins.append(settings.FRONTEND_URL)
    # Also add without trailing slash if present, or with it if not
    if settings.FRONTEND_URL.endswith("/"):
        allowed_origins.append(settings.FRONTEND_URL.rstrip("/"))
    else:
        allowed_origins.append(settings.FRONTEND_URL + "/")

# Support Vercel preview deployments (only project-specific)
cors_origin_regex = None
if settings.ENVIRONMENT == "production" and settings.FRONTEND_URL:
    # Only allow Vercel URLs matching our project slug
    cors_origin_regex = r"https://smart-resume-filter[\w-]*\.vercel\.app"
else:
    # In development, allow any vercel preview
    cors_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Attach rate limiter to the FastAPI app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Global exception handler for invalid ObjectId errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_msg = str(exc).lower()
    if "invalid id" in err_msg or "not a valid objectid" in err_msg or "bson" in err_msg:
        return JSONResponse(
            status_code=400,
            content={"detail": "Invalid ID format"},
        )
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 1)
    logger.info(
        "%s %s → %s (%sms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Job Descriptions"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["Interviews"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(realtime.router, prefix="/api/realtime", tags=["Real-time Updates"])

app.include_router(chat.router, prefix="/api/chat", tags=["AI Chatbot"])
app.include_router(candidate.router, prefix="/api/candidate", tags=["Candidate Portal"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(messaging.router, prefix="/api/messages", tags=["Messaging"])
app.include_router(insights.router, prefix="/api", tags=["Resume Insights"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API health check."""
    result = {
        "message": "HireQ API",
        "version": "1.0.0",
        "status": "running",
    }
    if settings.ENVIRONMENT != "production":
        result["docs"] = "/docs"
    return result


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint with real service status."""
    from app.database import db

    # Check database
    db_status = "disconnected"
    try:
        if db.client:
            await db.client.admin.command("ping")
            db_status = "connected"
    except Exception:
        db_status = "error"

    # Check ML models
    ml_status = "not_loaded"
    try:
        from app.services.matching import get_matching_service
        ms = get_matching_service()
        if getattr(ms, '_initialized', False):
            ml_status = "loaded"
    except Exception:
        ml_status = "error"

    # Check RAG service
    rag_status = "not_loaded"
    try:
        from app.services.rag import get_rag_service
        rs = get_rag_service()
        if getattr(rs, '_initialized', False):
            rag_status = "loaded"
    except Exception:
        rag_status = "error"

    overall = "healthy" if db_status == "connected" and ml_status == "loaded" else "degraded"

    return {
        "status": overall,
        "database": db_status,
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

