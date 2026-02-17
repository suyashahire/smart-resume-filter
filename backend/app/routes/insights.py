"""
Resume Insights API endpoints for match score, keyword coverage, and formatting health.
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Dict
from app.models.user import User
from app.models.resume import Resume
from app.routes.auth import get_current_user

router = APIRouter()

@router.get("/insights/{resume_id}/ats-compatibility")
async def check_ats_compatibility(resume_id: str, current_user: User = Depends(get_current_user)):
    """
    Check ATS compatibility for a resume (basic logic: check for standard sections, avoid tables/graphics, check file type).
    Returns a score and a list of issues.
    """
    resume = await Resume.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this resume")

    issues = []
    score = 100
    text = resume.raw_text or ""
    # Check for standard sections
    for section in ["Experience", "Education", "Skills"]:
        if section.lower() not in text.lower():
            issues.append(f"Missing section: {section}")
            score -= 10
    # Check for tables/graphics (simple heuristic)
    if "table" in text.lower() or "graphic" in text.lower():
        issues.append("Avoid using tables or graphics")
        score -= 10
    # Check file type
    if not (resume.file_type.endswith("pdf") or resume.file_type.endswith("docx") or resume.file_type.endswith("msword")):
        issues.append("Save as PDF or DOCX")
        score -= 10
    score = max(score, 0)

    return {
        "ats_score": score,
        "issues": issues or ["No major ATS issues detected."]
    }
@router.post("/insights/{resume_id}/optimize")
async def optimize_resume_with_ai(resume_id: str, current_user: User = Depends(get_current_user), instructions: str = Body(None)):
    """
    Optimize a resume using AI (simple logic: add missing keywords, improve formatting, clarify summary).
    Accepts optional instructions for optimization.
    Returns improved resume text and a summary of changes.
    """
    resume = await Resume.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this resume")

    # Use parsed_data for improvement
    parsed = resume.parsed_data or {}
    raw = resume.raw_text or ""
    suggestions = []

    # Add missing keywords to skills
    all_keywords = set([
        "python", "leadership", "communication", "project management", "teamwork", "problem solving"
    ])
    resume_skills = set(parsed.skills) if hasattr(parsed, 'skills') else set()
    missing = all_keywords - resume_skills
    if missing:
        suggestions.append(f"Added missing keywords: {', '.join(missing)}.")
        improved_skills = list(resume_skills | missing)
    else:
        improved_skills = list(resume_skills)

    # Improve summary
    summary = parsed.summary or ""
    if summary and "results" not in summary.lower():
        improved_summary = summary + " Results-driven professional."
        suggestions.append("Clarified summary with results-driven statement.")
    else:
        improved_summary = summary

    # Formatting: ensure bullet points for experience
    experience = parsed.experience or ""
    if experience and "-" not in experience:
        improved_experience = "- " + experience.replace("\n", "\n- ")
        suggestions.append("Formatted experience section with bullet points.")
    else:
        improved_experience = experience

    # Compose improved text
    improved_text = f"Summary:\n{improved_summary}\n\nSkills:\n{', '.join(improved_skills)}\n\nExperience:\n{improved_experience}\n\n" + raw
    summary_text = " ".join(suggestions) if suggestions else "Resume is already well-optimized."

    return {
        "improved_text": improved_text,
        "summary": summary_text
    }
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
