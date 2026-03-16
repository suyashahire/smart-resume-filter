"""
Job Description routes for creating and managing job postings.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List
from datetime import datetime, timezone
import logging

from app.models.user import User, UserRole
from app.models.job import (
    JobDescription, JobDescriptionCreate, JobDescriptionResponse,
    JobDescriptionUpdate, ScreeningRequest
)
from app.models.resume import Resume, ResumeWithScore
from app.models.screening import ScreeningResult, ScreeningResultResponse, ScreeningResultsList
from app.models.application import Application, ApplicationStatus, StatusChange, ApplicationStatusUpdate
from app.models.notification import Notification, NotificationType
from app.models.message import DirectMessage, DirectConversation
from app.routes.auth import get_current_user, require_hr
from beanie import PydanticObjectId
from app.services.job_parser import JobParserService
from app.services.matching import get_matching_service
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
logger = logging.getLogger(__name__)
job_parser = JobParserService()
matching_service = get_matching_service()


def _job_to_response(job: JobDescription) -> JobDescriptionResponse:
    """Convert a JobDescription document to its API response."""
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
        application_mode=job.application_mode,
        created_at=job.created_at,
    )


@router.post("/", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_job_description(
    job_data: JobDescriptionCreate,
    current_user: User = Depends(require_hr)
):
    """
    Create a new job description.
    
    The system will automatically extract required skills from the description.
    """
    # Extract skills from description
    extracted_skills = await job_parser.extract_skills(job_data.description)
    
    # Create job description
    job = JobDescription(
        user_id=str(current_user.id),
        title=job_data.title,
        description=job_data.description,
        required_skills=extracted_skills,
        experience_required=job_data.experience_required,
        education_required=job_data.education_required,
        location=job_data.location,
        salary_range=job_data.salary_range,
        job_type=job_data.job_type,
        company=getattr(current_user, 'company', None),
        application_mode=job_data.application_mode,
    )
    
    await job.insert()
    
    # Broadcast job created event
    ws_manager = get_connection_manager()
    await ws_manager.broadcast_event(
        EventType.JOB_CREATED,
        {
            "id": str(job.id),
            "title": job.title,
            "required_skills": job.required_skills,
            "location": job.location
        },
        user_id=str(current_user.id)
    )
    
    return _job_to_response(job)


@router.get("/", response_model=List[JobDescriptionResponse])
async def list_job_descriptions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    active_only: bool = True,
    current_user: User = Depends(require_hr)
):
    """List all job descriptions created by the current user."""
    if active_only:
        jobs = await JobDescription.find(
            JobDescription.user_id == str(current_user.id),
            JobDescription.is_active == True
        ).skip(skip).limit(limit).sort(-JobDescription.created_at).to_list()
    else:
        jobs = await JobDescription.find(
            JobDescription.user_id == str(current_user.id)
        ).skip(skip).limit(limit).sort(-JobDescription.created_at).to_list()
    
    return [
        _job_to_response(job)
        for job in jobs
    ]


@router.get("/{job_id}", response_model=JobDescriptionResponse)
async def get_job_description(
    job_id: str,
    current_user: User = Depends(require_hr)
):
    """Get a specific job description by ID."""
    job = await JobDescription.get(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found"
        )
    
    if job.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this job description"
        )
    
    return _job_to_response(job)


@router.put("/{job_id}", response_model=JobDescriptionResponse)
async def update_job_description(
    job_id: str,
    job_update: JobDescriptionUpdate,
    current_user: User = Depends(require_hr)
):
    """Update a job description."""
    job = await JobDescription.get(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found"
        )
    
    if job.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this job description"
        )
    
    # Update fields
    update_data = job_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(job, field, value)
    
    # Re-extract skills if description changed
    if job_update.description:
        job.required_skills = await job_parser.extract_skills(job_update.description)
    
    job.updated_at = datetime.now(timezone.utc)
    await job.save()
    
    return _job_to_response(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_description(
    job_id: str,
    current_user: User = Depends(require_hr)
):
    """Delete a job description."""
    job = await JobDescription.get(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found"
        )
    
    if job.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this job description"
        )
    
    # Delete associated screening results
    await ScreeningResult.find(ScreeningResult.job_id == job_id).delete()
    
    # Broadcast job deleted event
    ws_manager = get_connection_manager()
    await ws_manager.broadcast_event(
        EventType.JOB_DELETED,
        {
            "id": job_id,
            "title": job.title
        },
        user_id=str(current_user.id)
    )
    
    await job.delete()
    
    return None


@router.post("/{job_id}/screen", response_model=List[ResumeWithScore])
async def screen_candidates(
    job_id: str,
    screening_request: ScreeningRequest = None,
    current_user: User = Depends(require_hr)
):
    """
    Screen candidates against a job description.
    
    This will:
    1. Match candidate skills against job requirements
    2. Calculate similarity scores using ML
    3. Rank candidates by match score
    4. Store screening results
    
    - **resume_ids**: Optional list of specific resume IDs to screen. If empty, screens all resumes.
    """
    job = await JobDescription.get(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found"
        )
    
    if job.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to screen for this job"
        )
    
    # Get resumes to screen
    if screening_request and screening_request.resume_ids and len(screening_request.resume_ids) > 0:
        # Screen only specified resumes
        resumes = []
        for resume_id in screening_request.resume_ids:
            resume = await Resume.get(resume_id)
            if resume and resume.user_id == str(current_user.id):
                resumes.append(resume)
    else:
        # Screen all user's resumes
        resumes = await Resume.find(
            Resume.user_id == str(current_user.id),
            Resume.is_parsed == True
        ).to_list()
    
    if not resumes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No resumes found to screen"
        )
    
    # Perform matching
    results = await matching_service.match_candidates(resumes, job)
    
    # Store screening results and update job
    # Check for existing results to avoid duplicates
    for result in results:
        # Check if a screening result already exists for this job/resume combination
        existing_result = await ScreeningResult.find_one(
            ScreeningResult.job_id == str(job.id),
            ScreeningResult.resume_id == result["resume_id"]
        )
        
        if existing_result:
            # Update existing result
            existing_result.overall_score = result["score"]
            existing_result.score_breakdown = result["score_breakdown"]
            existing_result.skill_matches = result["skill_matches"]
            existing_result.matched_skills_count = result["matched_skills_count"]
            existing_result.total_required_skills = len(job.required_skills)
            existing_result.recommendation = result["recommendation"]
            await existing_result.save()
        else:
            # Create new result
            screening_result = ScreeningResult(
                user_id=str(current_user.id),
                job_id=str(job.id),
                resume_id=result["resume_id"],
                overall_score=result["score"],
                score_breakdown=result["score_breakdown"],
                skill_matches=result["skill_matches"],
                matched_skills_count=result["matched_skills_count"],
                total_required_skills=len(job.required_skills),
                recommendation=result["recommendation"]
            )
            await screening_result.insert()
    
    # Update job stats — use total screening results count, not just this batch
    job.candidates_screened = await ScreeningResult.find(
        ScreeningResult.job_id == str(job.id)
    ).count()
    job.updated_at = datetime.now(timezone.utc)
    await job.save()
    
    # Broadcast screening completed event
    ws_manager = get_connection_manager()
    for result in results:
        await ws_manager.broadcast_event(
            EventType.CANDIDATE_SCORED,
            {
                "job_id": str(job.id),
                "job_title": job.title,
                "resume_id": result["resume_id"],
                "candidate_name": result["name"],
                "score": result["score"],
                "recommendation": result["recommendation"]
            },
            user_id=str(current_user.id)
        )
    
    # Return ranked candidates
    return [
        ResumeWithScore(
            id=result["resume_id"],
            name=result["name"],
            email=result["email"],
            phone=result["phone"],
            skills=result["skills"],
            education=result["education"],
            experience=result["experience"],
            score=result["score"],
            skill_matches=result["matched_skills"]
        )
        for result in results
    ]


@router.get("/{job_id}/results", response_model=List[ResumeWithScore])
async def get_screening_results(
    job_id: str,
    current_user: User = Depends(require_hr)
):
    """Get screening results for a job description."""
    job = await JobDescription.get(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found"
        )
    
    if job.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access these results"
        )
    
    # Get screening results
    screening_results = await ScreeningResult.find(
        ScreeningResult.job_id == job_id
    ).sort(-ScreeningResult.overall_score).to_list()
    
    # Batch-fetch all resumes to avoid N+1
    resume_ids = list({sr.resume_id for sr in screening_results if sr.resume_id})
    if resume_ids:
        resumes_list = await Resume.find({"_id": {"$in": _to_object_ids(resume_ids)}}).to_list()
        resume_map = {str(r.id): r for r in resumes_list}
    else:
        resume_map = {}
    
    # Batch-fetch all resume owners
    owner_ids = list({r.user_id for r in resume_map.values() if r.user_id})
    if owner_ids:
        owners_list = await User.find({"_id": {"$in": _to_object_ids(owner_ids)}}).to_list()
        owner_map = {str(u.id): u for u in owners_list}
    else:
        owner_map = {}
    
    results = []
    for sr in screening_results:
        resume = resume_map.get(sr.resume_id)
        if resume:
            # Determine source: check if there's an application linked
            source = "hr_upload"
            application_id = None
            candidate_user_id = None
            if sr.application_id:
                source = "candidate_portal"
                application_id = sr.application_id
            
            # Check if the resume's uploader is a candidate (portal user)
            if resume.user_id:
                resume_owner = owner_map.get(resume.user_id)
                if resume_owner and resume_owner.role == UserRole.CANDIDATE:
                    candidate_user_id = resume.user_id
                    source = "candidate_portal"
            
            results.append(ResumeWithScore(
                id=str(resume.id),
                name=resume.parsed_data.name,
                email=resume.parsed_data.email,
                phone=resume.parsed_data.phone,
                skills=resume.parsed_data.skills,
                education=resume.parsed_data.education,
                experience=resume.parsed_data.experience,
                score=sr.overall_score,
                skill_matches=[sm.skill for sm in sr.skill_matches if sm.is_matched],
                source=source,
                application_id=application_id,
                candidate_user_id=candidate_user_id,
            ))
    
    return results


# ==================== Application Approval Endpoints ====================

@router.get("/{job_id}/applications/pending")
async def get_pending_applications(
    job_id: str,
    current_user: User = Depends(require_hr)
):
    """
    Get all applications pending approval for a job.
    
    Only the HR user who created the job can view these.
    """
    job = await JobDescription.get(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view applications for this job"
        )
    
    # Get pending applications
    applications = await Application.find({
        "job_id": job_id,
        "status": ApplicationStatus.PENDING_APPROVAL.value
    }).to_list()
    
    # Batch-fetch all resumes and candidates to avoid N+1
    app_resume_ids = list({app.resume_id for app in applications if app.resume_id})
    app_candidate_ids = list({app.candidate_id for app in applications if app.candidate_id})
    
    if app_resume_ids:
        resumes_list = await Resume.find({"_id": {"$in": _to_object_ids(app_resume_ids)}}).to_list()
        resume_map = {str(r.id): r for r in resumes_list}
    else:
        resume_map = {}
    
    if app_candidate_ids:
        candidates_list = await User.find({"_id": {"$in": _to_object_ids(app_candidate_ids)}}).to_list()
        candidate_map = {str(c.id): c for c in candidates_list}
    else:
        candidate_map = {}
    
    results = []
    for app in applications:
        resume = None
        candidate_name = "Unknown"
        
        if app.resume_id:
            resume = resume_map.get(app.resume_id)
            if resume and resume.parsed_data:
                candidate_name = resume.parsed_data.name or resume.parsed_data.email or "Unknown"
        
        # Get candidate user info if no resume name
        if candidate_name == "Unknown" and app.candidate_id:
            candidate = candidate_map.get(app.candidate_id)
            if candidate:
                candidate_name = candidate.name or candidate.email
        
        results.append({
            "application_id": str(app.id),
            "candidate_id": app.candidate_id,
            "candidate_name": candidate_name,
            "resume_id": app.resume_id,
            "applied_at": app.applied_at,
            "status": app.status,
        })
    
    return results


@router.put("/applications/{application_id}/approve")
async def approve_application(
    application_id: str,
    current_user: User = Depends(require_hr)
):
    """
    Approve a pending application.
    
    This will:
    1. Mark the application as approved
    2. Auto-screen the candidate's resume against the job
    3. Add them to the screening results
    """
    application = await Application.get(application_id)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check if already processed
    if application.status != ApplicationStatus.PENDING_APPROVAL:
        # If already processed, silently clean up the notification and return success
        # This prevents the "already approved" error when notification persists
        status_val = application.status.value if hasattr(application.status, 'value') else str(application.status)
        if status_val in ('applied', 'screening', 'interview', 'offer', 'hired'):
            # Already approved — delete any lingering approval notification
            try:
                await Notification.find({
                    "application_id": str(application.id),
                    "type": NotificationType.APPLICATION_APPROVAL_REQUIRED.value,
                }).delete()
            except Exception:
                pass
            return {
                "message": "Application was already approved",
                "application_id": str(application.id),
                "screening_result_id": application.screening_result_id,
                "score": None
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application is not pending approval (current status: {status_val})"
        )
    
    # Get the job
    job = await JobDescription.get(application.job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Verify HR owns this job
    if job.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve applications for this job"
        )
    
    # Update application
    application.status = ApplicationStatus.APPLIED
    application.is_approved_for_screening = True
    application.approval_decision_at = datetime.now(timezone.utc)
    application.approval_decision_by = str(current_user.id)
    application.status_history.append(
        StatusChange(
            from_status=ApplicationStatus.PENDING_APPROVAL.value,
            to_status=ApplicationStatus.APPLIED.value,
            changed_at=datetime.now(timezone.utc),
            changed_by=str(current_user.id),
            note="Application approved by HR"
        )
    )
    
    screening_result = None
    
    # Auto-screen if resume available
    if application.resume_id:
        resume = await Resume.get(application.resume_id)
        if resume and resume.is_parsed:
            try:
                results = await matching_service.match_candidates([resume], job)
                
                if results and len(results) > 0:
                    result = results[0]
                    
                    # Check if screening result exists
                    existing = await ScreeningResult.find_one(
                        ScreeningResult.job_id == str(job.id),
                        ScreeningResult.resume_id == str(resume.id)
                    )
                    
                    if existing:
                        existing.overall_score = result["score"]
                        existing.score_breakdown = result["score_breakdown"]
                        existing.skill_matches = result["skill_matches"]
                        existing.matched_skills_count = result["matched_skills_count"]
                        existing.total_required_skills = len(job.required_skills)
                        existing.recommendation = result["recommendation"]
                        existing.application_id = str(application.id)
                        await existing.save()
                        screening_result = existing
                    else:
                        screening_result = ScreeningResult(
                            user_id=str(current_user.id),
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
                    
                    # Update job candidates count
                    job.candidates_screened = await ScreeningResult.find(
                        ScreeningResult.job_id == str(job.id)
                    ).count()
                    await job.save()
                    
            except Exception as e:
                logger.warning("Screening failed for approved application %s: %s", application.id, e)
    
    await application.save()
    
    # Clean up the approval notification since it's now processed
    try:
        await Notification.find({
            "application_id": str(application.id),
            "type": NotificationType.APPLICATION_APPROVAL_REQUIRED.value,
        }).delete()
    except Exception:
        pass
    
    # Broadcast to HR
    ws_manager = get_connection_manager()
    await ws_manager.broadcast_event(
        EventType.CANDIDATE_SCORED,
        {
            "job_id": str(job.id),
            "job_title": job.title,
            "application_id": str(application.id),
            "action": "approved",
            "score": screening_result.overall_score if screening_result else None,
        },
        user_id=str(current_user.id)
    )
    
    return {
        "message": "Application approved successfully",
        "application_id": str(application.id),
        "screening_result_id": str(screening_result.id) if screening_result else None,
        "score": screening_result.overall_score if screening_result else None
    }


@router.put("/applications/{application_id}/reject")
async def reject_application(
    application_id: str,
    reason: str = None,
    current_user: User = Depends(require_hr)
):
    """
    Reject a pending application.
    
    The candidate will not be screened or included in results.
    """
    application = await Application.get(application_id)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check if already processed
    if application.status != ApplicationStatus.PENDING_APPROVAL:
        status_val = application.status.value if hasattr(application.status, 'value') else str(application.status)
        if status_val == 'rejected':
            try:
                await Notification.find({
                    "application_id": str(application.id),
                    "type": NotificationType.APPLICATION_APPROVAL_REQUIRED.value,
                }).delete()
            except Exception:
                pass
            return {
                "message": "Application was already rejected",
                "application_id": str(application.id),
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application is not pending approval (current status: {status_val})"
        )
    
    # Get the job
    job = await JobDescription.get(application.job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Verify HR owns this job
    if job.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reject applications for this job"
        )
    
    # Update application
    application.status = ApplicationStatus.REJECTED
    application.is_approved_for_screening = False
    application.approval_decision_at = datetime.now(timezone.utc)
    application.approval_decision_by = str(current_user.id)
    application.status_history.append(
        StatusChange(
            from_status=ApplicationStatus.PENDING_APPROVAL.value,
            to_status=ApplicationStatus.REJECTED.value,
            changed_at=datetime.now(timezone.utc),
            changed_by=str(current_user.id),
            note=reason or "Application rejected by HR"
        )
    )
    
    await application.save()
    
    # Optionally notify the candidate
    try:
        candidate = await User.get(application.candidate_id)
        if candidate:
            notification = Notification(
                recipient_id=application.candidate_id,
                type=NotificationType.APPLICATION_REJECTED,
                title="Application Update",
                message=f"Your application for {job.title} was not selected to proceed.",
                job_id=str(job.id),
                application_id=str(application.id),
                job_title=job.title,
            )
            await notification.insert()
    except Exception as e:
        logger.warning("Failed to notify candidate of rejection: %s", e)
    
    # Clean up the approval notification since it's now processed
    try:
        await Notification.find({
            "application_id": str(application.id),
            "type": NotificationType.APPLICATION_APPROVAL_REQUIRED.value,
        }).delete()
    except Exception:
        pass
    
    return {
        "message": "Application rejected",
        "application_id": str(application.id),
    }


@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    body: ApplicationStatusUpdate,
    current_user: User = Depends(require_hr),
):
    """
    Update an application's pipeline status (e.g. hired, rejected, interview, offer).

    Creates a notification for the candidate, sends a WebSocket push,
    and auto-sends a direct message informing them of the decision.
    """
    application = await Application.get(application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    # Get the job and verify ownership
    job = await JobDescription.get(application.job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    if job.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update applications for this job",
        )

    new_status = body.status
    old_status = application.status

    # Update application status + history
    application.status = new_status
    application.updated_at = datetime.now(timezone.utc)
    application.status_history.append(
        StatusChange(
            from_status=old_status.value,
            to_status=new_status.value,
            changed_at=datetime.now(timezone.utc),
            changed_by=str(current_user.id),
            note=body.note,
        )
    )
    await application.save()

    # Keep denormalized screening result in sync
    try:
        if application.screening_result_id:
            sr = await ScreeningResult.get(application.screening_result_id)
            if sr:
                sr.application_status = new_status.value
                await sr.save()
    except Exception:
        logger.exception("Failed to sync screening result status for app %s", application_id)

    # ---- Candidate notification + messaging ----
    candidate_id = application.candidate_id
    candidate = await User.get(candidate_id) if candidate_id else None

    if candidate:
        # Build human-friendly messages
        if new_status == ApplicationStatus.HIRED:
            notif_title = "Congratulations! You're Hired!"
            notif_message = f"Great news! You have been selected for the position of {job.title}. We look forward to having you on board!"
            dm_content = f"🎉 Congratulations! You have been hired for the position of {job.title}! We are excited to welcome you to the team. We'll be in touch with next steps soon."
            notif_type = NotificationType.APPLICATION_HIRED
        elif new_status == ApplicationStatus.REJECTED:
            notif_title = "Application Update"
            notif_message = f"Thank you for your interest in {job.title}. After careful consideration, we have decided to move forward with other candidates."
            dm_content = f"Thank you for your interest in the {job.title} position. After careful consideration, we've decided to move forward with other candidates. We appreciate the time you invested and wish you the best in your career search."
            notif_type = NotificationType.APPLICATION_REJECTED
        elif new_status == ApplicationStatus.OFFER:
            notif_title = "You Have an Offer!"
            notif_message = f"Exciting news! An offer is being extended for the {job.title} position. Check your messages for details."
            dm_content = f"We're pleased to inform you that we'd like to extend an offer for the {job.title} position! Please stay tuned for the detailed offer letter and next steps."
            notif_type = NotificationType.GENERAL
        elif new_status == ApplicationStatus.INTERVIEW:
            notif_title = "Interview Scheduled"
            notif_message = f"You've been moved to the interview stage for {job.title}. We'll reach out with scheduling details."
            dm_content = f"Good news! You've been selected for an interview for the {job.title} position. We'll be in touch shortly with scheduling details."
            notif_type = NotificationType.GENERAL
        else:
            notif_title = "Application Status Update"
            notif_message = f"Your application for {job.title} has been updated to: {new_status.value}."
            dm_content = None  # Don't auto-DM for generic status changes
            notif_type = NotificationType.GENERAL

        # 1) Create in-app notification
        try:
            notification = Notification(
                recipient_id=candidate_id,
                type=notif_type,
                title=notif_title,
                message=notif_message,
                job_id=str(job.id),
                application_id=str(application.id),
                candidate_id=candidate_id,
                candidate_name=candidate.name if candidate else None,
                job_title=job.title,
            )
            await notification.insert()
        except Exception as e:
            logger.warning("Failed to create notification: %s", e)

        # 2) Push WebSocket event to candidate
        try:
            ws_manager = get_connection_manager()
            await ws_manager.broadcast_event(
                EventType.APPLICATION_STATUS_CHANGED,
                {
                    "application_id": str(application.id),
                    "job_id": str(job.id),
                    "job_title": job.title,
                    "new_status": new_status.value,
                    "old_status": old_status.value,
                    "note": body.note,
                },
                user_id=candidate_id,
            )
        except Exception as e:
            logger.warning("WebSocket broadcast failed: %s", e)

        # 3) Auto-send a direct message from HR to candidate
        if dm_content:
            try:
                hr_id = str(current_user.id)
                sorted_ids = sorted([hr_id, candidate_id])
                slot_hr = sorted_ids[0]
                slot_candidate = sorted_ids[1]

                conversation = await DirectConversation.find_one({
                    "hr_user_id": slot_hr,
                    "candidate_user_id": slot_candidate,
                })
                if not conversation:
                    conversation = DirectConversation(
                        hr_user_id=slot_hr,
                        candidate_user_id=slot_candidate,
                        job_id=str(job.id),
                    )
                    await conversation.insert()

                dm = DirectMessage(
                    conversation_id=str(conversation.id),
                    sender_id=hr_id,
                    receiver_id=candidate_id,
                    content=dm_content,
                )
                await dm.insert()

                conversation.last_message_at = dm.sent_at
                conversation.last_message_preview = dm_content[:100]
                if candidate_id == conversation.hr_user_id:
                    conversation.unread_count_hr += 1
                else:
                    conversation.unread_count_candidate += 1
                # Un-delete for both users
                if conversation.deleted_for_users:
                    conversation.deleted_for_users = []
                await conversation.save()

                # Push new_message WS event so candidate messages page updates
                await ws_manager.broadcast_event(
                    EventType.NEW_MESSAGE,
                    {
                        "message_id": str(dm.id),
                        "conversation_id": str(conversation.id),
                        "sender_id": hr_id,
                        "sender_name": current_user.name,
                        "receiver_id": candidate_id,
                        "content": dm_content[:100],
                        "sent_at": dm.sent_at.isoformat() if dm.sent_at else None,
                    },
                    user_id=candidate_id,
                )
            except Exception as e:
                logger.warning("Failed to auto-send DM: %s", e)

    return {
        "message": f"Application status updated to {new_status.value}",
        "application_id": str(application.id),
        "new_status": new_status.value,
        "old_status": old_status.value,
    }


@router.get("/applications/by-status/{app_status}")
async def get_applications_by_status(
    app_status: str,
    current_user: User = Depends(require_hr),
):
    """
    Get all applications with a specific status for jobs owned by this user.
    Used by calendar to show upcoming interviews.
    """
    # Find all jobs owned by the current user
    user_jobs = await JobDescription.find(
        {"user_id": str(current_user.id)}
    ).to_list()
    job_ids = [str(j.id) for j in user_jobs]
    job_map = {str(j.id): j for j in user_jobs}

    if not job_ids:
        return []

    # Find applications with the requested status for those jobs
    applications = await Application.find(
        {"job_id": {"$in": job_ids}, "status": app_status}
    ).sort(-Application.updated_at).to_list()

    results = []
    for app in applications:
        job = job_map.get(app.job_id)
        # Try to get candidate info
        candidate_name = app.candidate_name if hasattr(app, 'candidate_name') and app.candidate_name else None
        if not candidate_name and hasattr(app, 'candidate_id') and app.candidate_id:
            try:
                from app.models.user import User as UserModel
                candidate = await UserModel.get(app.candidate_id)
                if candidate:
                    candidate_name = candidate.name
            except Exception:
                logger.warning("Failed to fetch candidate name for %s", app.candidate_id)

        results.append({
            "id": str(app.id),
            "job_id": app.job_id,
            "job_title": job.title if job else "Unknown",
            "candidate_name": candidate_name or "Candidate",
            "status": app.status.value if hasattr(app.status, 'value') else str(app.status),
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "updated_at": app.updated_at.isoformat() if app.updated_at else None,
        })

    return results

