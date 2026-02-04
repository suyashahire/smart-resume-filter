"""
Reports routes for generating and downloading candidate reports.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from typing import Optional
from datetime import datetime
import os

from app.config import settings
from app.models.user import User
from app.models.resume import Resume
from app.models.interview import Interview
from app.models.screening import ScreeningResult
from app.routes.auth import get_current_user
from app.services.report_generator import ReportGeneratorService

router = APIRouter()

# Initialize report generator
report_generator = ReportGeneratorService()


class CandidateReport:
    """Candidate report data structure."""
    def __init__(
        self,
        candidate_id: str,
        name: str,
        email: str,
        phone: str,
        skills: list,
        education: str,
        experience: str,
        resume_score: float,
        sentiment_score: Optional[float],
        confidence_score: Optional[float],
        final_score: float,
        recommendation: str,
        skill_matches: list,
        transcript: Optional[str],
        job_title: str,
        generated_at: datetime
    ):
        self.candidate_id = candidate_id
        self.name = name
        self.email = email
        self.phone = phone
        self.skills = skills
        self.education = education
        self.experience = experience
        self.resume_score = resume_score
        self.sentiment_score = sentiment_score
        self.confidence_score = confidence_score
        self.final_score = final_score
        self.recommendation = recommendation
        self.skill_matches = skill_matches
        self.transcript = transcript
        self.job_title = job_title
        self.generated_at = generated_at


@router.get("/{resume_id}")
async def get_candidate_report(
    resume_id: str,
    job_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get a comprehensive report for a candidate.
    
    - **resume_id**: ID of the candidate's resume
    - **job_id**: Optional job ID to get job-specific screening results
    
    Returns:
    - Candidate information
    - Resume score
    - Interview analysis (if available)
    - Final combined score
    - Recommendation
    """
    # Get resume
    resume = await Resume.get(resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this report"
        )
    
    # Get screening result
    if job_id:
        screening_result = await ScreeningResult.find_one(
            ScreeningResult.resume_id == resume_id,
            ScreeningResult.job_id == job_id
        )
    else:
        # Get the latest screening result
        screening_result = await ScreeningResult.find_one(
            ScreeningResult.resume_id == resume_id
        )
    
    # Get interview if exists
    interview = await Interview.find_one(
        Interview.resume_id == resume_id,
        Interview.user_id == str(current_user.id)
    )
    
    # Build report
    resume_score = screening_result.overall_score if screening_result else 0
    sentiment_score = None
    confidence_score = None
    transcript = None
    
    if interview and interview.is_analyzed:
        sentiment_score = interview.analysis.sentiment_score
        confidence_score = interview.analysis.confidence_score
        transcript = interview.transcript
    
    # Calculate final score
    if sentiment_score is not None and confidence_score is not None:
        final_score = (resume_score * 0.6) + (sentiment_score * 0.2) + (confidence_score * 0.2)
    else:
        final_score = resume_score
    
    # Determine recommendation
    if final_score >= 75:
        recommendation = "Highly Recommended"
    elif final_score >= 60:
        recommendation = "Recommended"
    elif final_score >= 45:
        recommendation = "Maybe"
    else:
        recommendation = "Not Recommended"
    
    # Get skill matches
    skill_matches = []
    if screening_result:
        skill_matches = [sm.skill for sm in screening_result.skill_matches if sm.is_matched]
    
    # Get job title
    job_title = "N/A"
    if screening_result:
        from app.models.job import JobDescription
        job = await JobDescription.get(screening_result.job_id)
        if job:
            job_title = job.title
    
    return {
        "candidate_id": str(resume.id),
        "name": resume.parsed_data.name,
        "email": resume.parsed_data.email,
        "phone": resume.parsed_data.phone,
        "skills": resume.parsed_data.skills,
        "education": resume.parsed_data.education,
        "experience": resume.parsed_data.experience,
        "resume_score": round(resume_score, 1),
        "sentiment_score": round(sentiment_score, 1) if sentiment_score else None,
        "confidence_score": round(confidence_score, 1) if confidence_score else None,
        "final_score": round(final_score, 1),
        "recommendation": recommendation,
        "skill_matches": skill_matches,
        "transcript": transcript,
        "job_title": job_title,
        "has_interview": interview is not None and interview.is_analyzed,
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/{resume_id}/pdf")
async def download_candidate_report_pdf(
    resume_id: str,
    job_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Download a candidate report as PDF.
    
    - **resume_id**: ID of the candidate's resume
    - **job_id**: Optional job ID for job-specific report
    """
    # Get report data
    report_data = await get_candidate_report(resume_id, job_id, current_user)
    
    # Generate PDF
    try:
        pdf_path = await report_generator.generate_pdf(report_data)
        
        return FileResponse(
            path=pdf_path,
            filename=f"candidate_report_{report_data['name'].replace(' ', '_')}.pdf",
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard statistics for the current user.
    
    Returns:
    - Total resumes
    - Total interviews
    - Average scores
    - Top candidates
    """
    # Count resumes
    total_resumes = await Resume.find(
        Resume.user_id == str(current_user.id)
    ).count()
    
    # Count interviews
    total_interviews = await Interview.find(
        Interview.user_id == str(current_user.id),
        Interview.is_analyzed == True
    ).count()
    
    # Get screening results
    screening_results = await ScreeningResult.find(
        ScreeningResult.user_id == str(current_user.id)
    ).to_list()
    
    # Calculate statistics
    total_screened = len(screening_results)
    
    if total_screened > 0:
        avg_score = sum(sr.overall_score for sr in screening_results) / total_screened
        excellent_matches = len([sr for sr in screening_results if sr.overall_score >= 75])
        good_matches = len([sr for sr in screening_results if 60 <= sr.overall_score < 75])
        fair_matches = len([sr for sr in screening_results if 45 <= sr.overall_score < 60])
        low_matches = len([sr for sr in screening_results if sr.overall_score < 45])
    else:
        avg_score = 0
        excellent_matches = good_matches = fair_matches = low_matches = 0
    
    # Get top 5 candidates
    top_candidates = []
    sorted_results = sorted(screening_results, key=lambda x: x.final_score or x.overall_score, reverse=True)[:5]
    
    for sr in sorted_results:
        resume = await Resume.get(sr.resume_id)
        if resume:
            top_candidates.append({
                "id": str(resume.id),
                "name": resume.parsed_data.name,
                "email": resume.parsed_data.email,
                "score": sr.final_score or sr.overall_score
            })
    
    # Get skills distribution
    all_skills = []
    resumes = await Resume.find(
        Resume.user_id == str(current_user.id),
        Resume.is_parsed == True
    ).to_list()
    
    for resume in resumes:
        all_skills.extend(resume.parsed_data.skills)
    
    skill_counts = {}
    for skill in all_skills:
        skill_counts[skill] = skill_counts.get(skill, 0) + 1
    
    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "total_resumes": total_resumes,
        "total_screened": total_screened,
        "total_interviews": total_interviews,
        "average_score": round(avg_score, 1),
        "excellent_matches": excellent_matches,
        "good_matches": good_matches,
        "fair_matches": fair_matches,
        "low_matches": low_matches,
        "top_candidates": top_candidates,
        "skills_distribution": [{"skill": s, "count": c} for s, c in top_skills],
        "score_distribution": [
            {"range": "0-44", "count": low_matches},
            {"range": "45-59", "count": fair_matches},
            {"range": "60-74", "count": good_matches},
            {"range": "75-100", "count": excellent_matches}
        ]
    }

