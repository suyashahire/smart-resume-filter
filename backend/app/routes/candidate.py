"""
Candidate routes for job browsing, applications, and profile management.
"""

from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from datetime import datetime
from typing import Optional, List
import os
import uuid

from app.models.user import User, UserRole
from app.models.job import JobDescription, JobDescriptionResponse
from app.models.resume import Resume
from app.models.application import (
    Application, ApplicationStatus, StatusChange,
    ApplicationCreate, ApplicationResponse, ApplicationListResponse
)
from app.models.screening import ScreeningResult
from app.routes.auth import get_current_user, require_candidate
from app.services.resume_parser import get_resume_parser
from app.models.notification import Notification, NotificationType
from app.services.websocket_manager import get_connection_manager, EventType

router = APIRouter()


# ==================== Job Browsing ====================

@router.get("/jobs", response_model=List[JobDescriptionResponse])
async def get_open_jobs(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    job_type: Optional[str] = None,
    location: Optional[str] = None,
):
    """
    Get all open jobs for candidates to browse.
    
    No authentication required - jobs are public.
    """
    # Build query for open jobs
    query = {"status": "open", "is_active": True}
    
    jobs = await JobDescription.find(query).skip(skip).limit(limit).to_list()
    
    # Filter by search term if provided
    if search:
        search_lower = search.lower()
        jobs = [j for j in jobs if 
                search_lower in j.title.lower() or 
                search_lower in j.description.lower() or
                any(search_lower in skill.lower() for skill in j.required_skills)]
    
    # Filter by job type if provided
    if job_type:
        jobs = [j for j in jobs if j.job_type == job_type]
    
    # Filter by location if provided
    if location:
        location_lower = location.lower()
        jobs = [j for j in jobs if j.location and location_lower in j.location.lower()]
    
    return [
        JobDescriptionResponse(
            id=str(job.id),
            title=job.title,
            description=job.description,
            required_skills=job.required_skills,
            preferred_skills=job.preferred_skills,
            experience_required=job.experience_required,
            education_required=job.education_required,
            location=job.location,
            salary_range=job.salary_range,
            job_type=job.job_type,
            is_active=job.is_active,
            candidates_screened=job.candidates_screened,
            company=job.company,
            created_at=job.created_at,
        )
        for job in jobs
    ]


@router.get("/jobs/{job_id}", response_model=JobDescriptionResponse)
async def get_job_detail(job_id: str):
    """
    Get detailed information about a specific job.
    
    No authentication required.
    """
    job = await JobDescription.get(job_id)
    
    if not job or job.status != "open" or not job.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or no longer accepting applications"
        )
    
    return JobDescriptionResponse(
        id=str(job.id),
        title=job.title,
        description=job.description,
        required_skills=job.required_skills,
        preferred_skills=job.preferred_skills,
        experience_required=job.experience_required,
        education_required=job.education_required,
        location=job.location,
        salary_range=job.salary_range,
        job_type=job.job_type,
        is_active=job.is_active,
        candidates_screened=job.candidates_screened,
        company=job.company,
        created_at=job.created_at,
    )


# ==================== Job Applications ====================

@router.post("/jobs/{job_id}/apply", response_model=ApplicationResponse)
async def apply_to_job(
    job_id: str,
    resume_id: Optional[str] = None,
    current_user: User = Depends(require_candidate),
):
    """
    Apply to a job.
    
    Optionally include a resume_id if the candidate has uploaded a resume.
    """
    # Check if job exists and is open
    job = await JobDescription.get(job_id)
    if not job or job.status != "open" or not job.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or no longer accepting applications"
        )
    
    # Check if already applied
    existing = await Application.find_one({
        "candidate_id": str(current_user.id),
        "job_id": job_id
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job"
        )
    
    # If resume_id provided, verify it belongs to this user
    if resume_id:
        resume = await Resume.get(resume_id)
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
    
    # Create application
    application = Application(
        candidate_id=str(current_user.id),
        job_id=job_id,
        resume_id=resume_id,
        status=ApplicationStatus.APPLIED,
        status_history=[
            StatusChange(
                to_status=ApplicationStatus.APPLIED.value,
                changed_at=datetime.utcnow(),
                note="Application submitted"
            )
        ]
    )
    
    await application.insert()

    # ── Notify the HR user who created this job ──
    try:
        candidate_name = current_user.name or current_user.email
        notification = Notification(
            recipient_id=job.user_id,
            type=NotificationType.NEW_APPLICATION,
            title="New Application Received",
            message=f"{candidate_name} applied for {job.title}",
            job_id=job_id,
            application_id=str(application.id),
            candidate_id=str(current_user.id),
            candidate_name=candidate_name,
            job_title=job.title,
        )
        await notification.insert()

        # Real-time push via WebSocket
        ws_manager = get_connection_manager()
        await ws_manager.broadcast_event(
            EventType.NEW_APPLICATION,
            {
                "notification_id": str(notification.id),
                "candidate_name": candidate_name,
                "job_title": job.title,
                "job_id": job_id,
                "application_id": str(application.id),
            },
            user_id=job.user_id,  # Only send to the HR who owns this job
        )
    except Exception as e:
        # Don't fail the application if notification fails
        print(f"⚠️ Failed to send application notification: {e}")

    return ApplicationResponse(
        id=str(application.id),
        candidate_id=application.candidate_id,
        job_id=application.job_id,
        job_title=job.title,
        company=getattr(job, 'company', None),
        resume_id=application.resume_id,
        status=application.status,
        status_history=application.status_history,
        screening_result_id=application.screening_result_id,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
    )


@router.get("/applications", response_model=ApplicationListResponse)
async def get_my_applications(
    current_user: User = Depends(require_candidate),
):
    """
    Get all applications for the current candidate.
    """
    applications = await Application.find(
        {"candidate_id": str(current_user.id)}
    ).sort("-applied_at").to_list()
    
    # Build response with job details
    result = []
    for app in applications:
        job = await JobDescription.get(app.job_id)
        
        # Get screening result if available
        score = None
        score_visible = True
        feedback = None
        feedback_at = None
        
        if app.screening_result_id:
            screening = await ScreeningResult.get(app.screening_result_id)
            if screening:
                score_visible = screening.score_visible_to_candidate
                if score_visible:
                    score = screening.overall_score
                feedback = screening.candidate_feedback
                feedback_at = screening.feedback_sent_at
        
        result.append(ApplicationResponse(
            id=str(app.id),
            candidate_id=app.candidate_id,
            job_id=app.job_id,
            job_title=job.title if job else "Unknown Job",
            company=getattr(job, 'company', None) if job else None,
            resume_id=app.resume_id,
            status=app.status,
            status_history=app.status_history,
            screening_result_id=app.screening_result_id,
            applied_at=app.applied_at,
            updated_at=app.updated_at,
            score=score,
            score_visible=score_visible,
            feedback=feedback,
            feedback_at=feedback_at,
        ))
    
    return ApplicationListResponse(
        applications=result,
        total=len(result)
    )


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
async def get_application_detail(
    application_id: str,
    current_user: User = Depends(require_candidate),
):
    """
    Get detailed information about a specific application.
    """
    application = await Application.get(application_id)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Verify ownership
    if application.candidate_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own applications"
        )
    
    job = await JobDescription.get(application.job_id)
    
    # Get screening result if available
    score = None
    score_visible = True
    feedback = None
    feedback_at = None
    
    if application.screening_result_id:
        screening = await ScreeningResult.get(application.screening_result_id)
        if screening:
            score_visible = screening.score_visible_to_candidate
            if score_visible:
                score = screening.overall_score
            feedback = screening.candidate_feedback
            feedback_at = screening.feedback_sent_at
    
    return ApplicationResponse(
        id=str(application.id),
        candidate_id=application.candidate_id,
        job_id=application.job_id,
        job_title=job.title if job else "Unknown Job",
        company=getattr(job, 'company', None) if job else None,
        resume_id=application.resume_id,
        status=application.status,
        status_history=application.status_history,
        screening_result_id=application.screening_result_id,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
        score=score,
        score_visible=score_visible,
        feedback=feedback,
        feedback_at=feedback_at,
    )


@router.post("/applications/{application_id}/withdraw")
async def withdraw_application(
    application_id: str,
    current_user: User = Depends(require_candidate),
):
    """
    Withdraw an application.
    
    This permanently deletes the application and any associated
    screening result from the database.
    """
    application = await Application.get(application_id)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Verify ownership
    if application.candidate_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only withdraw your own applications"
        )
    
    # Check if can be withdrawn (hired cannot be withdrawn)
    if application.status == ApplicationStatus.HIRED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This application cannot be withdrawn"
        )
    
    # Delete associated screening result if exists
    if application.screening_result_id:
        screening = await ScreeningResult.get(application.screening_result_id)
        if screening:
            await screening.delete()
    
    # Delete the application record
    await application.delete()
    
    return {"message": "Application withdrawn and deleted successfully"}


@router.delete("/applications/{application_id}")
async def delete_application(
    application_id: str,
    current_user: User = Depends(require_candidate),
):
    """
    Delete an application permanently.
    
    Removes the application and any associated screening result.
    """
    application = await Application.get(application_id)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Verify ownership
    if application.candidate_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own applications"
        )
    
    # Delete associated screening result if exists
    if application.screening_result_id:
        screening = await ScreeningResult.get(application.screening_result_id)
        if screening:
            await screening.delete()
    
    # Delete the application record
    await application.delete()
    
    return {"message": "Application deleted successfully"}


# ==================== Resume Management ====================

@router.get("/resume")
async def get_my_resume(
    current_user: User = Depends(require_candidate),
):
    """
    Get the candidate's current resume.
    """
    # Find resume by candidate's email
    resume = await Resume.find_one({"user_id": str(current_user.id)})
    
    if not resume:
        # Try to find by email match
        resume = await Resume.find_one({"parsed_data.email": current_user.email})
    
    if not resume:
        return {"message": "No resume found", "resume": None}
    
    return {
        "message": "Resume found",
        "resume": {
            "id": str(resume.id),
            "file_name": resume.file_name,
            "parsed_data": resume.parsed_data,
            "created_at": resume.created_at,
            "updated_at": resume.updated_at,
        }
    }


@router.post("/resume")
async def upload_my_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(require_candidate),
):
    """
    Upload or update the candidate's resume.
    """
    # Validate file type
    allowed_types = [".pdf", ".doc", ".docx"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size (max 5MB)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )
    
    # Save file to disk for parsing
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "resumes")
    os.makedirs(upload_dir, exist_ok=True)
    
    safe_filename = f"{current_user.id}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Parse resume from file path
    parser = get_resume_parser()
    try:
        parsed_data, raw_text = await parser.parse_resume(file_path)
    except Exception as e:
        # Clean up file on parse failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse resume: {str(e)}"
        )
    
    # Check if user already has a resume
    existing_resume = await Resume.find_one({"user_id": str(current_user.id)})
    
    if existing_resume:
        # Delete old file if different
        if existing_resume.file_path and existing_resume.file_path != file_path:
            if os.path.exists(existing_resume.file_path):
                os.remove(existing_resume.file_path)
        # Update existing resume
        existing_resume.file_name = file.filename
        existing_resume.file_path = file_path
        existing_resume.file_size = len(content)
        existing_resume.file_type = file.content_type or "application/octet-stream"
        existing_resume.parsed_data = parsed_data
        existing_resume.raw_text = raw_text
        existing_resume.is_parsed = True
        existing_resume.parse_error = None
        existing_resume.updated_at = datetime.utcnow()
        await existing_resume.save()
        resume = existing_resume
    else:
        # Create new resume
        resume = Resume(
            user_id=str(current_user.id),
            file_name=file.filename,
            file_path=file_path,
            file_size=len(content),
            file_type=file.content_type or "application/octet-stream",
            parsed_data=parsed_data,
            raw_text=raw_text,
            is_parsed=True,
        )
        await resume.insert()
    
    return {
        "message": "Resume uploaded successfully",
        "resume": {
            "id": str(resume.id),
            "file_name": resume.file_name,
            "parsed_data": parsed_data,
        }
    }


# ==================== Profile ====================

@router.get("/profile")
async def get_profile(
    current_user: User = Depends(require_candidate),
):
    """
    Get the candidate's profile.
    """
    # Get application stats
    total_applications = await Application.find(
        {"candidate_id": str(current_user.id)}
    ).count()
    
    pending_applications = await Application.find({
        "candidate_id": str(current_user.id),
        "status": {"$in": [
            ApplicationStatus.APPLIED.value,
            ApplicationStatus.SCREENING.value,
            ApplicationStatus.INTERVIEW.value
        ]}
    }).count()
    
    return {
        "user": {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
            "created_at": current_user.created_at,
        },
        "stats": {
            "total_applications": total_applications,
            "pending_applications": pending_applications,
        }
    }


@router.put("/profile")
async def update_profile(
    name: Optional[str] = None,
    current_user: User = Depends(require_candidate),
):
    """
    Update the candidate's profile.
    """
    if name:
        current_user.name = name
    
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
        }
    }
