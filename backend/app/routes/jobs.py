"""
Job Description routes for creating and managing job postings.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime

from app.config import settings
from app.models.user import User
from app.models.job import (
    JobDescription, JobDescriptionCreate, JobDescriptionResponse,
    JobDescriptionUpdate, ScreeningRequest
)
from app.models.resume import Resume, ResumeWithScore
from app.models.screening import ScreeningResult, ScreeningResultResponse, ScreeningResultsList
from app.routes.auth import get_current_user
from app.services.job_parser import JobParserService
from app.services.matching import get_matching_service
from app.services.websocket_manager import get_connection_manager, EventType

router = APIRouter()

# Use singleton instances for model reuse (pre-loaded at startup)
job_parser = JobParserService()
matching_service = get_matching_service()


@router.post("/", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_job_description(
    job_data: JobDescriptionCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new job description.
    
    The system will automatically extract required skills from the description.
    """
    # Extract skills from description
    extracted_skills = await job_parser.extract_skills(job_data.description)
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
        job_type=job_data.job_type
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
        created_at=job.created_at
    )


@router.get("/", response_model=List[JobDescriptionResponse])
async def list_job_descriptions(
    skip: int = 0,
    limit: int = 50,
    active_only: bool = True,
    current_user: User = Depends(get_current_user)
):
    """List all job descriptions created by the current user."""
    query = Resume.user_id == str(current_user.id)
    
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
            created_at=job.created_at
        )
        for job in jobs
    ]


@router.get("/{job_id}", response_model=JobDescriptionResponse)
async def get_job_description(
    job_id: str,
    current_user: User = Depends(get_current_user)
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
        created_at=job.created_at
    )


@router.put("/{job_id}", response_model=JobDescriptionResponse)
async def update_job_description(
    job_id: str,
    job_update: JobDescriptionUpdate,
    current_user: User = Depends(get_current_user)
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
    
    job.updated_at = datetime.utcnow()
    await job.save()
    
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
        created_at=job.created_at
    )


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_description(
    job_id: str,
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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
    
    # Update job stats
    job.candidates_screened = len(results)
    job.updated_at = datetime.utcnow()
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
    current_user: User = Depends(get_current_user)
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
    
    results = []
    for sr in screening_results:
        resume = await Resume.get(sr.resume_id)
        if resume:
            results.append(ResumeWithScore(
                id=str(resume.id),
                name=resume.parsed_data.name,
                email=resume.parsed_data.email,
                phone=resume.parsed_data.phone,
                skills=resume.parsed_data.skills,
                education=resume.parsed_data.education,
                experience=resume.parsed_data.experience,
                score=sr.overall_score,
                skill_matches=[sm.skill for sm in sr.skill_matches if sm.is_matched]
            ))
    
    return results

