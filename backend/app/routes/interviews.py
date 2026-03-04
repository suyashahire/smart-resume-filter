"""
Interview routes for uploading and analyzing interview recordings.
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status, Query
from typing import List, Optional
from datetime import datetime
import os
import aiofiles

from app.config import settings
from app.models.user import User
from app.models.resume import Resume
from app.models.interview import (
    Interview, InterviewUploadResponse, InterviewAnalysisResponse,
    InterviewListResponse, SentimentAnalysis
)
from app.models.screening import ScreeningResult
from app.routes.auth import get_current_user
from app.services.transcription import get_transcription_service
from app.services.sentiment import get_sentiment_service
from app.services.websocket_manager import get_connection_manager, EventType

router = APIRouter()

# Use singleton instances for model reuse (pre-loaded at startup)
transcription_service = get_transcription_service()
sentiment_service = get_sentiment_service()


def validate_audio_extension(filename: str) -> bool:
    """Validate if file has allowed audio/video extension."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in settings.allowed_audio_extensions_list


@router.post("/upload", response_model=InterviewUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_interview(
    resume_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an interview recording for a candidate.
    
    - **resume_id**: ID of the candidate's resume
    - **file**: Audio/video file (MP3, WAV, M4A, MP4)
    - Maximum file size: 50MB
    """
    # Validate resume exists
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add interview for this resume"
        )
    
    # Validate file extension
    if not validate_audio_extension(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {settings.ALLOWED_AUDIO_EXTENSIONS}"
        )
    
    # Check file size (50MB for audio/video)
    file_content = await file.read()
    file_size = len(file_content)
    max_size = 50 * 1024 * 1024  # 50MB
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size: 50MB"
        )
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, "interviews", safe_filename)
    
    # Save file locally
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(file_content)
    
    # Create interview document
    interview = Interview(
        user_id=str(current_user.id),
        resume_id=resume_id,
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file.content_type or "audio/mpeg"
    )
    
    await interview.insert()
    
    return InterviewUploadResponse(
        id=str(interview.id),
        resume_id=interview.resume_id,
        file_name=interview.file_name,
        is_transcribed=interview.is_transcribed,
        is_analyzed=interview.is_analyzed,
        created_at=interview.created_at
    )


@router.post("/{interview_id}/transcribe", response_model=InterviewAnalysisResponse)
async def transcribe_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Transcribe an interview recording using Speech-to-Text.
    
    Uses OpenAI Whisper API for accurate transcription.
    """
    interview = await Interview.get(interview_id)
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if interview.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to transcribe this interview"
        )
    
    if not os.path.exists(interview.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview file not found on server"
        )
    
    try:
        # Transcribe audio
        transcript = await transcription_service.transcribe(interview.file_path)
        
        interview.transcript = transcript
        interview.is_transcribed = True
        interview.transcription_error = None
        interview.updated_at = datetime.utcnow()
        
    except Exception as e:
        interview.is_transcribed = False
        interview.transcription_error = str(e)
        await interview.save()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )
    
    await interview.save()
    
    return InterviewAnalysisResponse(
        id=str(interview.id),
        resume_id=interview.resume_id,
        file_name=interview.file_name,
        transcript=interview.transcript,
        analysis=interview.analysis,
        is_transcribed=interview.is_transcribed,
        is_analyzed=interview.is_analyzed,
        created_at=interview.created_at
    )


@router.post("/{interview_id}/analyze", response_model=InterviewAnalysisResponse)
async def analyze_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze an interview transcript for sentiment and confidence.
    
    Requires the interview to be transcribed first.
    
    Analysis includes:
    - Overall sentiment score (0-100)
    - Confidence score (0-100)
    - Key positive/negative phrases
    - Communication metrics
    """
    interview = await Interview.get(interview_id)
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if interview.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to analyze this interview"
        )
    
    if not interview.is_transcribed or not interview.transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview must be transcribed before analysis"
        )
    
    try:
        # Analyze sentiment
        analysis = await sentiment_service.analyze(interview.transcript)
        
        interview.analysis = analysis
        interview.is_analyzed = True
        interview.analysis_error = None
        interview.updated_at = datetime.utcnow()
        
        # Update screening result if exists
        screening_result = await ScreeningResult.find_one(
            ScreeningResult.resume_id == interview.resume_id
        )
        
        if screening_result:
            screening_result.interview_id = str(interview.id)
            screening_result.interview_sentiment_score = analysis.sentiment_score
            screening_result.interview_confidence_score = analysis.confidence_score
            
            # Calculate final score (60% resume, 20% sentiment, 20% confidence)
            screening_result.final_score = (
                screening_result.overall_score * 0.6 +
                analysis.sentiment_score * 0.2 +
                analysis.confidence_score * 0.2
            )
            
            await screening_result.save()
        
    except Exception as e:
        interview.is_analyzed = False
        interview.analysis_error = str(e)
        await interview.save()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
    
    await interview.save()
    
    # Broadcast interview analyzed event
    ws_manager = get_connection_manager()
    await ws_manager.broadcast_event(
        EventType.INTERVIEW_ANALYZED,
        {
            "id": str(interview.id),
            "resume_id": interview.resume_id,
            "sentiment_score": interview.analysis.sentiment_score if interview.analysis else None,
            "confidence_score": interview.analysis.confidence_score if interview.analysis else None,
            "is_analyzed": interview.is_analyzed
        },
        user_id=str(current_user.id)
    )
    
    return InterviewAnalysisResponse(
        id=str(interview.id),
        resume_id=interview.resume_id,
        file_name=interview.file_name,
        transcript=interview.transcript,
        analysis=interview.analysis,
        is_transcribed=interview.is_transcribed,
        is_analyzed=interview.is_analyzed,
        created_at=interview.created_at
    )


@router.post("/{interview_id}/process", response_model=InterviewAnalysisResponse)
async def process_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Process an interview: transcribe and analyze in one step.
    
    This is a convenience endpoint that combines transcription and analysis.
    """
    interview = await Interview.get(interview_id)
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if interview.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process this interview"
        )
    
    if not os.path.exists(interview.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview file not found on server"
        )
    
    try:
        # Step 1: Transcribe
        transcript = await transcription_service.transcribe(interview.file_path)
        interview.transcript = transcript
        interview.is_transcribed = True
        
        # Step 2: Analyze
        analysis = await sentiment_service.analyze(transcript)
        interview.analysis = analysis
        interview.is_analyzed = True
        
        interview.updated_at = datetime.utcnow()
        
        # Update screening result if exists
        screening_result = await ScreeningResult.find_one(
            ScreeningResult.resume_id == interview.resume_id
        )
        
        if screening_result:
            screening_result.interview_id = str(interview.id)
            screening_result.interview_sentiment_score = analysis.sentiment_score
            screening_result.interview_confidence_score = analysis.confidence_score
            screening_result.final_score = (
                screening_result.overall_score * 0.6 +
                analysis.sentiment_score * 0.2 +
                analysis.confidence_score * 0.2
            )
            await screening_result.save()
        
    except Exception as e:
        interview.transcription_error = str(e)
        interview.analysis_error = str(e)
        await interview.save()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}"
        )
    
    await interview.save()
    
    return InterviewAnalysisResponse(
        id=str(interview.id),
        resume_id=interview.resume_id,
        file_name=interview.file_name,
        transcript=interview.transcript,
        analysis=interview.analysis,
        is_transcribed=interview.is_transcribed,
        is_analyzed=interview.is_analyzed,
        created_at=interview.created_at
    )


@router.get("/", response_model=List[InterviewListResponse])
async def list_interviews(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = Query(None, description="Search by candidate name or email"),
    min_score: Optional[float] = Query(None, description="Minimum sentiment score"),
    max_score: Optional[float] = Query(None, description="Maximum sentiment score"),
    analyzed_only: bool = Query(False, description="Only return analyzed interviews"),
    current_user: User = Depends(get_current_user)
):
    """List all interviews uploaded by the current user with optional filters."""
    query = {"user_id": str(current_user.id)}
    
    if analyzed_only:
        query["is_analyzed"] = True
    
    interviews = await Interview.find(
        query
    ).sort(-Interview.created_at).to_list()
    
    # Collect resume IDs to batch-lookup candidate info
    resume_ids = list(set(i.resume_id for i in interviews))
    resumes = await Resume.find({"_id": {"$in": [Resume.get_motor_collection().codec_options.codec.document_class(rid) if False else rid for rid in resume_ids]}}).to_list() if False else []
    
    # Build resume_id -> resume map
    resume_map = {}
    if resume_ids:
        try:
            from beanie import PydanticObjectId
            object_ids = []
            for rid in resume_ids:
                try:
                    object_ids.append(PydanticObjectId(rid))
                except Exception:
                    pass
            if object_ids:
                resumes = await Resume.find({"_id": {"$in": object_ids}}).to_list()
                resume_map = {str(r.id): r for r in resumes}
        except Exception:
            pass
    
    results = []
    for interview in interviews:
        resume = resume_map.get(interview.resume_id)
        candidate_name = resume.candidate_name if resume and hasattr(resume, 'candidate_name') else None
        candidate_email = resume.candidate_email if resume and hasattr(resume, 'candidate_email') else None
        
        # Search filter
        if search:
            search_lower = search.lower()
            name_match = candidate_name and search_lower in candidate_name.lower()
            email_match = candidate_email and search_lower in candidate_email.lower()
            file_match = search_lower in interview.file_name.lower()
            if not (name_match or email_match or file_match):
                continue
        
        # Score filters
        sentiment = interview.analysis.sentiment_score if interview.analysis else 0
        if min_score is not None and sentiment < min_score:
            continue
        if max_score is not None and sentiment > max_score:
            continue
        
        results.append(InterviewListResponse(
            id=str(interview.id),
            resume_id=interview.resume_id,
            file_name=interview.file_name,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            sentiment_score=sentiment,
            confidence_score=interview.analysis.confidence_score if interview.analysis else 0,
            is_analyzed=interview.is_analyzed,
            created_at=interview.created_at,
        ))
    
    return results[skip:skip + limit]


@router.get("/{interview_id}", response_model=InterviewAnalysisResponse)
async def get_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific interview by ID."""
    interview = await Interview.get(interview_id)
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if interview.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this interview"
        )
    
    return InterviewAnalysisResponse(
        id=str(interview.id),
        resume_id=interview.resume_id,
        file_name=interview.file_name,
        transcript=interview.transcript,
        analysis=interview.analysis,
        is_transcribed=interview.is_transcribed,
        is_analyzed=interview.is_analyzed,
        created_at=interview.created_at
    )


@router.get("/resume/{resume_id}", response_model=InterviewAnalysisResponse)
async def get_interview_by_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get interview for a specific resume/candidate."""
    interview = await Interview.find_one(
        Interview.resume_id == resume_id,
        Interview.user_id == str(current_user.id)
    )
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No interview found for this resume"
        )
    
    return InterviewAnalysisResponse(
        id=str(interview.id),
        resume_id=interview.resume_id,
        file_name=interview.file_name,
        transcript=interview.transcript,
        analysis=interview.analysis,
        is_transcribed=interview.is_transcribed,
        is_analyzed=interview.is_analyzed,
        created_at=interview.created_at
    )


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an interview by ID."""
    interview = await Interview.get(interview_id)
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if interview.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this interview"
        )
    
    # Delete file from storage
    if os.path.exists(interview.file_path):
        os.remove(interview.file_path)
    
    await interview.delete()
    
    return None

