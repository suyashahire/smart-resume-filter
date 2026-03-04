"""
Candidate routes for job browsing, applications, and profile management.
"""

from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.responses import FileResponse
from datetime import datetime, timezone
from typing import Optional, List
import os
import uuid

from app.models.user import User, UserRole, CandidateProfileUpdate
from app.models.job import JobDescription, JobDescriptionResponse, ApplicationMode
from app.models.resume import Resume, ResumeVersionResponse
from app.models.application import (
    Application, ApplicationStatus, StatusChange,
    ApplicationCreate, ApplicationResponse, ApplicationListResponse
)
from app.models.screening import ScreeningResult
from app.routes.auth import get_current_user, require_candidate
from app.services.resume_parser import get_resume_parser
from app.services.matching import get_matching_service
from app.models.notification import Notification, NotificationType
from app.services.websocket_manager import get_connection_manager, EventType
from beanie import PydanticObjectId

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
matching_service = get_matching_service()


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
    import re as re_module
    
    # Build query for open jobs with all filters applied at DB level
    query = {"status": "open", "is_active": True}
    
    if search:
        search_regex = re_module.escape(search)
        query["$or"] = [
            {"title": {"$regex": search_regex, "$options": "i"}},
            {"description": {"$regex": search_regex, "$options": "i"}},
            {"required_skills": {"$elemMatch": {"$regex": search_regex, "$options": "i"}}},
        ]
    
    if job_type:
        query["job_type"] = job_type
    
    if location:
        location_regex = re_module.escape(location)
        query["location"] = {"$regex": location_regex, "$options": "i"}
    
    jobs = await JobDescription.find(query).skip(skip).limit(limit).to_list()
    
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


@router.get("/jobs/saved")
async def get_saved_jobs(
    current_user: User = Depends(require_candidate),
):
    """
    Get list of saved job IDs for the current candidate.
    """
    return {"saved_jobs": current_user.saved_jobs}


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
    The application flow depends on the job's application_mode:
    - AUTO_INCLUDE: Automatically screen and include in results
    - REQUIRE_APPROVAL: HR must approve before candidate is screened
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
    
    # Get resume - use provided or primary resume 
    resume = None
    if resume_id:
        resume = await Resume.get(resume_id)
        if not resume or resume.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found"
            )
    else:
        # Try to get primary resume first, then fall back to most recent
        resume = await Resume.find_one({
            "user_id": str(current_user.id),
            "is_primary": True
        })
        if not resume:
            # Fall back to most recent resume
            resumes = await Resume.find(
                {"user_id": str(current_user.id)}
            ).sort("-uploaded_at").limit(1).to_list()
            if resumes:
                resume = resumes[0]
        if resume:
            resume_id = str(resume.id)
    
    # Determine initial status based on application mode
    application_mode = getattr(job, 'application_mode', ApplicationMode.REQUIRE_APPROVAL)
    
    if application_mode == ApplicationMode.AUTO_INCLUDE:
        initial_status = ApplicationStatus.APPLIED
        is_approved = True
        status_note = "Application submitted - auto-approved for screening"
    else:
        initial_status = ApplicationStatus.PENDING_APPROVAL
        is_approved = False
        status_note = "Application submitted - pending HR approval"
    
    # Create application
    application = Application(
        candidate_id=str(current_user.id),
        job_id=job_id,
        resume_id=resume_id,
        status=initial_status,
        is_approved_for_screening=is_approved,
        source="candidate_portal",
        status_history=[
            StatusChange(
                to_status=initial_status.value,
                changed_at=datetime.now(timezone.utc),
                note=status_note
            )
        ]
    )
    
    await application.insert()
    
    # Auto-screen if AUTO_INCLUDE mode and resume is available
    screening_result = None
    if application_mode == ApplicationMode.AUTO_INCLUDE and resume and resume.is_parsed:
        try:
            # Perform matching for this single candidate
            results = await matching_service.match_candidates([resume], job)
            
            if results and len(results) > 0:
                result = results[0]
                
                # Check if screening result already exists
                existing_screening = await ScreeningResult.find_one(
                    ScreeningResult.job_id == str(job.id),
                    ScreeningResult.resume_id == str(resume.id)
                )
                
                if existing_screening:
                    # Update existing
                    existing_screening.overall_score = result["score"]
                    existing_screening.score_breakdown = result["score_breakdown"]
                    existing_screening.skill_matches = result["skill_matches"]
                    existing_screening.matched_skills_count = result["matched_skills_count"]
                    existing_screening.total_required_skills = len(job.required_skills)
                    existing_screening.recommendation = result["recommendation"]
                    existing_screening.application_id = str(application.id)
                    await existing_screening.save()
                    screening_result = existing_screening
                else:
                    # Create new screening result
                    screening_result = ScreeningResult(
                        user_id=job.user_id,  # HR user who owns the job
                        job_id=str(job.id),
                        resume_id=str(resume.id),
                        overall_score=result["score"],
                        score_breakdown=result["score_breakdown"],
                        skill_matches=result["skill_matches"],
                        matched_skills_count=result["matched_skills_count"],
                        total_required_skills=len(job.required_skills),
                        recommendation=result["recommendation"],
                        application_id=str(application.id),
                    )
                    await screening_result.insert()
                
                # Update application with screening result
                application.screening_result_id = str(screening_result.id)
                application.status = ApplicationStatus.SCREENING
                application.status_history.append(
                    StatusChange(
                        from_status=ApplicationStatus.APPLIED.value,
                        to_status=ApplicationStatus.SCREENING.value,
                        changed_at=datetime.now(timezone.utc),
                        note=f"Auto-screened with score: {result['score']:.1f}"
                    )
                )
                await application.save()
                
                # Update job candidates count
                job.candidates_screened = await ScreeningResult.find(
                    ScreeningResult.job_id == str(job.id)
                ).count()
                await job.save()
                
        except Exception as e:
            print(f"⚠️ Auto-screening failed for application {application.id}: {e}")

    # ── Notify the HR user who created this job ──
    try:
        candidate_name = current_user.name or current_user.email
        
        if application_mode == ApplicationMode.AUTO_INCLUDE:
            notification_type = NotificationType.NEW_APPLICATION
            notification_title = "New Candidate Screened"
            if screening_result:
                notification_message = f"{candidate_name} applied for {job.title} and was auto-screened (Score: {screening_result.overall_score:.1f})"
            else:
                notification_message = f"{candidate_name} applied for {job.title} (auto-included)"
        else:
            notification_type = NotificationType.APPLICATION_APPROVAL_REQUIRED
            notification_title = "Application Needs Approval"
            notification_message = f"{candidate_name} applied for {job.title}. Review and approve to include in screening."
        
        notification = Notification(
            recipient_id=job.user_id,
            type=notification_type,
            title=notification_title,
            message=notification_message,
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
                "requires_approval": application_mode == ApplicationMode.REQUIRE_APPROVAL,
                "score": screening_result.overall_score if screening_result else None,
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
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(require_candidate),
):
    """
    Get applications for the current candidate with pagination.
    """
    query = Application.find({"candidate_id": str(current_user.id)}).sort("-applied_at")
    total_count = await Application.find({"candidate_id": str(current_user.id)}).count()
    applications = await query.skip(skip).limit(limit).to_list()
    
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
        total=total_count
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
        existing_resume.updated_at = datetime.now(timezone.utc)
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


# ==================== Multi-Version Resume Management ====================

MAX_RESUME_VERSIONS = 3


@router.get("/resumes", response_model=List[ResumeVersionResponse])
async def get_all_my_resumes(
    current_user: User = Depends(require_candidate),
):
    """
    Get all resume versions for the candidate (up to 3).
    """
    resumes = await Resume.find({"user_id": str(current_user.id)}).sort("version_number").to_list()
    
    return [
        ResumeVersionResponse(
            id=str(r.id),
            file_name=r.file_name,
            file_size=r.file_size,
            version_label=r.version_label,
            is_primary=r.is_primary,
            version_number=r.version_number,
            parsed_data=r.parsed_data,
            is_parsed=r.is_parsed,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in resumes
    ]


@router.post("/resumes", response_model=ResumeVersionResponse)
async def upload_resume_version(
    file: UploadFile = File(...),
    version_label: Optional[str] = None,
    current_user: User = Depends(require_candidate),
):
    """
    Upload a new resume version. Candidates can have up to 3 versions.
    The first uploaded resume is automatically set as primary.
    """
    # Check existing resume count
    existing_resumes = await Resume.find({"user_id": str(current_user.id)}).to_list()
    
    if len(existing_resumes) >= MAX_RESUME_VERSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_RESUME_VERSIONS} resume versions allowed. Please delete one before uploading a new version."
        )
    
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
    
    # Check file size (max 10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )
    
    # Save file to disk
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "resumes")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    unique_id = uuid.uuid4().hex[:8]
    safe_filename = f"{current_user.id}_{unique_id}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Parse resume
    parser = get_resume_parser()
    try:
        parsed_data, raw_text = await parser.parse_resume(file_path)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse resume: {str(e)}"
        )
    
    # Determine version number
    next_version = max([r.version_number for r in existing_resumes], default=0) + 1
    
    # First resume is automatically primary
    is_primary = len(existing_resumes) == 0
    
    # Create new resume version
    resume = Resume(
        user_id=str(current_user.id),
        file_name=file.filename,
        file_path=file_path,
        file_size=len(content),
        file_type=file.content_type or "application/octet-stream",
        parsed_data=parsed_data,
        raw_text=raw_text,
        is_parsed=True,
        version_label=version_label,
        is_primary=is_primary,
        version_number=next_version,
    )
    await resume.insert()
    
    return ResumeVersionResponse(
        id=str(resume.id),
        file_name=resume.file_name,
        file_size=resume.file_size,
        version_label=resume.version_label,
        is_primary=resume.is_primary,
        version_number=resume.version_number,
        parsed_data=resume.parsed_data,
        is_parsed=resume.is_parsed,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
    )


@router.put("/resumes/{resume_id}/set-primary")
async def set_resume_as_primary(
    resume_id: str,
    current_user: User = Depends(require_candidate),
):
    """
    Set a resume version as the primary (active) resume for applications.
    """
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own resumes"
        )
    
    # Unset current primary
    await Resume.find({"user_id": str(current_user.id), "is_primary": True}).update(
        {"$set": {"is_primary": False, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Set new primary
    resume.is_primary = True
    resume.updated_at = datetime.now(timezone.utc)
    await resume.save()
    
    return {
        "message": "Resume set as primary successfully",
        "resume_id": str(resume.id)
    }


@router.put("/resumes/{resume_id}")
async def update_resume_version(
    resume_id: str,
    version_label: Optional[str] = None,
    current_user: User = Depends(require_candidate),
):
    """
    Update a resume version's label/metadata.
    """
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own resumes"
        )
    
    if version_label is not None:
        resume.version_label = version_label
    
    resume.updated_at = datetime.now(timezone.utc)
    await resume.save()
    
    return {
        "message": "Resume updated successfully",
        "resume": {
            "id": str(resume.id),
            "version_label": resume.version_label,
        }
    }


@router.delete("/resumes/{resume_id}")
async def delete_resume_version(
    resume_id: str,
    current_user: User = Depends(require_candidate),
):
    """
    Delete a resume version. Cannot delete if it's the only resume.
    If deleting the primary, another version becomes primary automatically.
    """
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own resumes"
        )
    
    # Check if it's the only resume
    resume_count = await Resume.find({"user_id": str(current_user.id)}).count()
    
    if resume_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your only resume. Upload a new version first."
        )
    
    was_primary = resume.is_primary
    
    # Delete file from disk
    if resume.file_path and os.path.exists(resume.file_path):
        os.remove(resume.file_path)
    
    # Delete from database
    await resume.delete()
    
    # If was primary, set another resume as primary
    if was_primary:
        other_resume = await Resume.find_one({"user_id": str(current_user.id)})
        if other_resume:
            other_resume.is_primary = True
            other_resume.updated_at = datetime.now(timezone.utc)
            await other_resume.save()
    
    return {"message": "Resume deleted successfully"}


@router.get("/resumes/{resume_id}/download")
async def download_candidate_resume(
    resume_id: str,
    current_user: User = Depends(require_candidate),
):
    """
    Download a resume file for viewing.
    Returns the PDF or DOCX file that was originally uploaded.
    """
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own resumes"
        )
    
    if not resume.file_path or not os.path.exists(resume.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found on server"
        )
    
    # Determine media type based on file extension
    ext = os.path.splitext(resume.file_path)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    
    return FileResponse(
        path=resume.file_path,
        filename=resume.file_name,
        media_type=media_type
    )


# ==================== Dashboard Stats ====================

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_candidate),
):
    """
    Get aggregated dashboard statistics for the current candidate.
    Returns counts by application status plus upcoming interviews.
    """
    candidate_id = str(current_user.id)
    
    # Count applications by status using aggregation
    all_apps = await Application.find(
        {"candidate_id": candidate_id}
    ).to_list()

    total = len(all_apps)
    counts = {
        "applied": 0,
        "screening": 0,
        "interview": 0,
        "offer": 0,
        "hired": 0,
        "rejected": 0,
    }
    
    upcoming_interviews = []
    
    # Collect job_ids for interview-stage apps to batch-fetch
    interview_app_job_ids = []
    for app in all_apps:
        status_val = app.status.value if hasattr(app.status, 'value') else str(app.status)
        if status_val in counts:
            counts[status_val] += 1
        if status_val == "interview" and app.job_id:
            interview_app_job_ids.append(app.job_id)
    
    # Batch-fetch jobs for interview-stage applications
    if interview_app_job_ids:
        jobs_list = await JobDescription.find({"_id": {"$in": _to_object_ids(list(set(interview_app_job_ids)))}}).to_list()
        job_map = {str(j.id): j for j in jobs_list}
    else:
        job_map = {}
    
    for app in all_apps:
        status_val = app.status.value if hasattr(app.status, 'value') else str(app.status)
        
        # Collect apps in interview stage for "upcoming interviews"
        if status_val == "interview":
            # Try to get job title from batch-fetched map
            job_title = app.job_title if hasattr(app, 'job_title') and app.job_title else None
            company = app.company if hasattr(app, 'company') and app.company else None
            if not job_title and app.job_id:
                job = job_map.get(app.job_id)
                if job:
                    job_title = job.title
                    company = job.company
            
            upcoming_interviews.append({
                "application_id": str(app.id),
                "job_id": app.job_id,
                "job_title": job_title or "Unknown Position",
                "company": company,
                "applied_at": app.applied_at.isoformat() if app.applied_at else None,
                "updated_at": app.updated_at.isoformat() if app.updated_at else None,
            })

    return {
        "total": total,
        "pending": counts["applied"],
        "screening": counts["screening"],
        "interview": counts["interview"],
        "offers": counts["offer"],
        "hired": counts["hired"],
        "rejected": counts["rejected"],
        "upcoming_interviews": upcoming_interviews,
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
    data: CandidateProfileUpdate,
    current_user: User = Depends(require_candidate),
):
    """
    Update the candidate's profile.
    """
    if data.name is not None:
        current_user.name = data.name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.location is not None:
        current_user.location = data.location
    if data.title is not None:
        current_user.title = data.title
    if data.bio is not None:
        current_user.bio = data.bio
    if data.website is not None:
        current_user.website = data.website
    if data.linkedin is not None:
        current_user.linkedin = data.linkedin
    if data.github is not None:
        current_user.github = data.github
    if data.experience_years is not None:
        current_user.experience_years = data.experience_years
    if data.education is not None:
        current_user.education = data.education
    if data.skills is not None:
        current_user.skills = data.skills
    
    current_user.updated_at = datetime.now(timezone.utc)
    await current_user.save()
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "location": current_user.location,
            "title": current_user.title,
            "bio": current_user.bio,
            "website": current_user.website,
            "linkedin": current_user.linkedin,
            "github": current_user.github,
            "experience_years": current_user.experience_years,
            "education": current_user.education,
            "skills": current_user.skills,
        }
    }


# ==================== Saved / Bookmarked Jobs ====================

@router.post("/jobs/{job_id}/save")
async def save_job(
    job_id: str,
    current_user: User = Depends(require_candidate),
):
    """
    Save/bookmark a job for later.
    """
    job = await JobDescription.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job_id not in current_user.saved_jobs:
        current_user.saved_jobs.append(job_id)
        current_user.updated_at = datetime.now(timezone.utc)
        await current_user.save()

    return {"message": "Job saved", "saved_jobs": current_user.saved_jobs}


@router.delete("/jobs/{job_id}/save")
async def unsave_job(
    job_id: str,
    current_user: User = Depends(require_candidate),
):
    """
    Remove a saved/bookmarked job.
    """
    if job_id in current_user.saved_jobs:
        current_user.saved_jobs.remove(job_id)
        current_user.updated_at = datetime.now(timezone.utc)
        await current_user.save()

    return {"message": "Job unsaved", "saved_jobs": current_user.saved_jobs}
