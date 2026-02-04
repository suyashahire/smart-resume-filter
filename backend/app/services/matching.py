"""
Matching Service - ML-powered candidate-job matching using semantic similarity.

Uses Sentence-BERT for semantic similarity between candidate skills and job requirements.
"""

import re
from typing import List, Dict, Any, Optional
import asyncio

from app.models.resume import Resume
from app.models.job import JobDescription
from app.models.screening import SkillMatch, ScoreBreakdown
from app.config import settings


# Singleton instance for model caching
_matching_service_instance: Optional["MatchingService"] = None


def get_matching_service() -> "MatchingService":
    """Get singleton instance of MatchingService for model reuse."""
    global _matching_service_instance
    if _matching_service_instance is None:
        _matching_service_instance = MatchingService()
    return _matching_service_instance


class MatchingService:
    """Service for matching candidates to job descriptions using ML."""
    
    def __init__(self):
        self.model = None
        self._initialized = False
    
    async def _initialize(self):
        """Lazy initialization of sentence transformer model."""
        if not self._initialized:
            def load_model():
                try:
                    from sentence_transformers import SentenceTransformer
                    return SentenceTransformer(settings.SENTENCE_TRANSFORMER_MODEL)
                except Exception as e:
                    print(f"Warning: Could not load sentence transformer: {e}")
                    return None
            
            self.model = await asyncio.get_event_loop().run_in_executor(None, load_model)
            self._initialized = True
    
    async def match_candidates(
        self, 
        resumes: List[Resume], 
        job: JobDescription
    ) -> List[Dict[str, Any]]:
        """
        Match multiple candidates against a job description.
        
        Args:
            resumes: List of Resume documents
            job: JobDescription document
            
        Returns:
            List of matching results sorted by score (descending)
        """
        await self._initialize()
        
        results = []
        
        for resume in resumes:
            result = await self._match_single_candidate(resume, job)
            results.append(result)
        
        # Sort by score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        
        return results
    
    async def _match_single_candidate(
        self, 
        resume: Resume, 
        job: JobDescription
    ) -> Dict[str, Any]:
        """Match a single candidate against a job description."""
        
        # Calculate skill match
        skill_matches, skill_score = await self._calculate_skill_match(
            resume.parsed_data.skills,
            job.required_skills
        )
        
        # Calculate experience score
        experience_score = self._calculate_experience_score(
            resume.parsed_data.experience,
            resume.parsed_data.years_of_experience,
            job.experience_required
        )
        
        # Calculate education score
        education_score = self._calculate_education_score(
            resume.parsed_data.education,
            job.education_required
        )
        
        # Calculate overall score (weighted)
        score_breakdown = ScoreBreakdown(
            skill_score=skill_score,
            experience_score=experience_score,
            education_score=education_score,
            skill_weight=0.7,
            experience_weight=0.2,
            education_weight=0.1
        )
        
        overall_score = (
            skill_score * 0.7 +
            experience_score * 0.2 +
            education_score * 0.1
        )
        
        # Determine recommendation
        if overall_score >= 75:
            recommendation = "highly_recommended"
        elif overall_score >= 60:
            recommendation = "recommended"
        elif overall_score >= 45:
            recommendation = "maybe"
        else:
            recommendation = "not_recommended"
        
        return {
            "resume_id": str(resume.id),
            "name": resume.parsed_data.name,
            "email": resume.parsed_data.email,
            "phone": resume.parsed_data.phone,
            "skills": resume.parsed_data.skills,
            "education": resume.parsed_data.education,
            "experience": resume.parsed_data.experience,
            "score": round(overall_score, 1),
            "score_breakdown": score_breakdown,
            "skill_matches": skill_matches,
            "matched_skills": [sm.skill for sm in skill_matches if sm.is_matched],
            "matched_skills_count": len([sm for sm in skill_matches if sm.is_matched]),
            "recommendation": recommendation
        }
    
    async def _calculate_skill_match(
        self, 
        candidate_skills: List[str], 
        required_skills: List[str]
    ) -> tuple[List[SkillMatch], float]:
        """
        Calculate skill match using both exact matching and semantic similarity.
        
        Returns:
            Tuple of (skill_matches, skill_score)
        """
        if not required_skills:
            return [], 100.0  # No requirements = full match
        
        skill_matches = []
        matched_count = 0
        
        # Normalize skills for comparison
        candidate_skills_lower = [s.lower() for s in candidate_skills]
        
        for req_skill in required_skills:
            req_skill_lower = req_skill.lower()
            
            # Check for exact match
            if req_skill_lower in candidate_skills_lower:
                skill_matches.append(SkillMatch(
                    skill=req_skill,
                    is_matched=True,
                    match_type="exact",
                    confidence=1.0
                ))
                matched_count += 1
                continue
            
            # Check for partial match
            partial_match = False
            for cand_skill in candidate_skills_lower:
                if req_skill_lower in cand_skill or cand_skill in req_skill_lower:
                    skill_matches.append(SkillMatch(
                        skill=req_skill,
                        is_matched=True,
                        match_type="partial",
                        confidence=0.8
                    ))
                    matched_count += 0.8
                    partial_match = True
                    break
            
            if partial_match:
                continue
            
            # Try semantic matching if model is available
            if self.model and candidate_skills:
                semantic_match = await self._semantic_skill_match(
                    req_skill, 
                    candidate_skills
                )
                
                if semantic_match:
                    skill_matches.append(SkillMatch(
                        skill=req_skill,
                        is_matched=True,
                        match_type="semantic",
                        confidence=semantic_match["confidence"]
                    ))
                    matched_count += semantic_match["confidence"]
                    continue
            
            # No match found
            skill_matches.append(SkillMatch(
                skill=req_skill,
                is_matched=False,
                match_type="none",
                confidence=0.0
            ))
        
        # Calculate score
        skill_score = (matched_count / len(required_skills)) * 100
        
        return skill_matches, min(skill_score, 100.0)
    
    async def _semantic_skill_match(
        self, 
        required_skill: str, 
        candidate_skills: List[str]
    ) -> Dict[str, Any] | None:
        """
        Use semantic similarity to find skill matches.
        
        Returns:
            Match info if found, None otherwise
        """
        def compute_similarity():
            from sentence_transformers import util
            
            # Encode required skill
            req_embedding = self.model.encode(required_skill, convert_to_tensor=True)
            
            # Encode candidate skills
            cand_embeddings = self.model.encode(candidate_skills, convert_to_tensor=True)
            
            # Calculate similarities
            similarities = util.cos_sim(req_embedding, cand_embeddings)[0]
            
            # Find best match
            best_idx = similarities.argmax().item()
            best_score = similarities[best_idx].item()
            
            if best_score >= 0.6:  # Threshold for semantic match
                return {
                    "matched_skill": candidate_skills[best_idx],
                    "confidence": best_score
                }
            
            return None
        
        try:
            return await asyncio.get_event_loop().run_in_executor(None, compute_similarity)
        except Exception:
            return None
    
    def _calculate_experience_score(
        self, 
        experience_text: str, 
        years: float | None,
        required_experience: str
    ) -> float:
        """Calculate experience match score."""
        if not required_experience:
            return 80.0  # Default score if no requirement
        
        # Extract required years
        req_years_match = re.search(r'(\d+)', required_experience)
        if not req_years_match:
            return 70.0
        
        req_years = float(req_years_match.group(1))
        
        # Use extracted years if available
        if years is not None:
            if years >= req_years:
                return 100.0
            elif years >= req_years * 0.7:
                return 80.0
            elif years >= req_years * 0.5:
                return 60.0
            else:
                return 40.0
        
        # Fallback: Check for experience keywords
        exp_lower = experience_text.lower()
        
        if any(word in exp_lower for word in ["senior", "lead", "principal", "manager"]):
            return 90.0 if req_years <= 5 else 70.0
        elif any(word in exp_lower for word in ["mid", "intermediate"]):
            return 80.0 if req_years <= 3 else 50.0
        elif any(word in exp_lower for word in ["junior", "entry", "fresher", "intern"]):
            return 70.0 if req_years <= 1 else 30.0
        
        return 50.0  # Default if can't determine
    
    def _calculate_education_score(
        self, 
        education_text: str, 
        required_education: str
    ) -> float:
        """Calculate education match score."""
        if not required_education:
            return 80.0  # Default score if no requirement
        
        edu_lower = education_text.lower()
        req_lower = required_education.lower()
        
        # Education hierarchy
        education_levels = {
            "phd": 100,
            "doctorate": 100,
            "master": 80,
            "m.tech": 80,
            "m.s.": 80,
            "bachelor": 60,
            "b.tech": 60,
            "b.e.": 60,
            "b.s.": 60,
            "diploma": 40,
            "certification": 30
        }
        
        # Find candidate's education level
        candidate_level = 0
        for edu, level in education_levels.items():
            if edu in edu_lower:
                candidate_level = max(candidate_level, level)
        
        # Find required education level
        required_level = 60  # Default to bachelor's
        for edu, level in education_levels.items():
            if edu in req_lower:
                required_level = level
                break
        
        # Calculate score
        if candidate_level >= required_level:
            return 100.0
        elif candidate_level >= required_level - 20:
            return 80.0
        elif candidate_level >= required_level - 40:
            return 60.0
        else:
            return 40.0

