"""
Resume Insights API endpoints for match score, keyword coverage, and formatting health.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
from app.models.user import User
from app.models.resume import Resume
from app.routes.auth import get_current_user

router = APIRouter()

@router.get("/insights/{resume_id}")
async def get_resume_insights(resume_id: str, current_user: User = Depends(get_current_user)) -> Dict:
    """
    Return match score, keyword coverage, and formatting health for a resume.
    """
    resume = await Resume.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this resume")

    # Placeholder logic for now
    # TODO: Replace with real scoring/analysis logic
    match_score = 0
    keyword_coverage = 0
    formatting_health = 0
    if resume.parsed_data:
        # Example: count skills for keyword coverage
        keyword_coverage = min(len(resume.parsed_data.skills) * 10, 100)
        # Example: formatting health based on raw_text length
        formatting_health = 100 if resume.raw_text and len(resume.raw_text) > 100 else 50
        # Example: match score random for now
        match_score = 50

    return {
        "match_score": match_score,
        "keyword_coverage": keyword_coverage,
        "formatting_health": formatting_health
    }
