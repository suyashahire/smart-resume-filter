"""
Screening Result model for storing candidate-job matching results.
"""

from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SkillMatch(BaseModel):
    """Individual skill matching result."""
    skill: str
    is_matched: bool
    match_type: str = "exact"  # exact, semantic, partial
    confidence: float = 1.0


class ScoreBreakdown(BaseModel):
    """Detailed score breakdown."""
    skill_score: float = 0.0  # 0-100
    experience_score: float = 0.0  # 0-100
    education_score: float = 0.0  # 0-100
    
    # Weights used
    skill_weight: float = 0.7
    experience_weight: float = 0.2
    education_weight: float = 0.1


class ScreeningResult(Document):
    """Screening Result document model for MongoDB."""
    
    user_id: str = Field(...)  # Reference to User who performed screening
    job_id: str = Field(...)  # Reference to JobDescription
    resume_id: str = Field(...)  # Reference to Resume
    
    # Overall score
    overall_score: float = Field(default=0.0)  # 0-100
    
    # Detailed breakdown
    score_breakdown: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    
    # Skill matching details
    skill_matches: List[SkillMatch] = []
    matched_skills_count: int = 0
    total_required_skills: int = 0
    
    # Recommendation
    recommendation: str = "not_recommended"  # highly_recommended, recommended, maybe, not_recommended
    
    # Interview data (if available)
    interview_id: Optional[str] = None
    interview_sentiment_score: Optional[float] = None
    interview_confidence_score: Optional[float] = None
    
    # Final combined score (with interview)
    final_score: Optional[float] = None
    
    # Candidate feedback (visible to candidates)
    candidate_feedback: Optional[str] = None
    feedback_sent_at: Optional[datetime] = None
    score_visible_to_candidate: bool = True  # HR can hide score from candidate
    
    # Internal HR notes (not visible to candidates)
    internal_notes: Optional[str] = None
    
    # Application status tracking
    application_status: str = "screening"  # applied, screening, interview, offer, rejected, hired, withdrawn
    status_updated_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "screening_results"
        indexes = [
            "user_id",
            "job_id",
            "resume_id",
            "overall_score",
            "created_at",
            "application_status",
        ]


# Pydantic schemas for API requests/responses

class ScreeningResultResponse(BaseModel):
    """Response for a single screening result."""
    id: str
    job_id: str
    resume_id: str
    
    # Candidate info (from resume)
    candidate_name: str
    candidate_email: str
    candidate_phone: str
    candidate_skills: List[str]
    candidate_education: str
    candidate_experience: str
    
    # Scores
    overall_score: float
    score_breakdown: ScoreBreakdown
    skill_matches: List[SkillMatch]
    recommendation: str
    
    # Interview data
    interview_id: Optional[str]
    interview_sentiment_score: Optional[float]
    interview_confidence_score: Optional[float]
    final_score: Optional[float]
    
    created_at: datetime
    
    class Config:
        from_attributes = True


class ScreeningResultsList(BaseModel):
    """Response for listing screening results."""
    job_id: str
    job_title: str
    total_candidates: int
    results: List[ScreeningResultResponse]
    
    # Summary statistics
    excellent_matches: int  # score >= 75
    good_matches: int  # score >= 60
    fair_matches: int  # score >= 45
    low_matches: int  # score < 45
    average_score: float

