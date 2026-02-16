# ML/NLP Services
from app.services.resume_parser import ResumeParserService, get_resume_parser
from app.services.job_parser import JobParserService
from app.services.matching import MatchingService, get_matching_service
from app.services.transcription import TranscriptionService
from app.services.sentiment import SentimentAnalysisService, get_sentiment_service
from app.services.report_generator import ReportGeneratorService
from app.services.chatbot import ChatbotService
from app.services.rag import RAGService
from app.services.websocket_manager import ConnectionManager, get_connection_manager

__all__ = [
    # Service classes
    "ResumeParserService",
    "JobParserService",
    "MatchingService",
    "TranscriptionService",
    "SentimentAnalysisService",
    "ReportGeneratorService",
    "ChatbotService",
    "RAGService",
    "ConnectionManager",
    "get_connection_manager",
    # Singleton getters (use these for model reuse)
    "get_resume_parser",
    "get_matching_service",
    "get_sentiment_service",
]

