"""
Resume Insights API endpoints for match score, keyword coverage, and formatting health.
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Dict, List, Optional
from app.models.user import User
from app.models.resume import Resume
from app.models.job import JobDescription
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


@router.get("/insights/{resume_id}/percentile")
async def get_resume_percentile(resume_id: str, current_user: User = Depends(get_current_user)) -> Dict:
    """
    Calculate global percentile ranking for a resume compared to all candidates.
    Returns percentile (0-100), total candidates count, and a badge (Top 1%, Top 5%, etc).
    """
    resume = await Resume.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this resume")
    
    # Get all parsed resumes
    all_resumes = await Resume.find({"is_parsed": True}).to_list()
    total_candidates = len(all_resumes)
    
    if total_candidates <= 1:
        return {
            "percentile": 100,
            "total_candidates": total_candidates,
            "badge": "Top 1%",
            "rank": 1
        }
    
    # Calculate score for each resume using a composite scoring model
    def calculate_resume_score(r: Resume) -> float:
        score = 0.0
        pd = r.parsed_data
        
        # Skills score (0-40 points) - based on number and variety of skills
        skill_count = len(pd.skills) if pd and pd.skills else 0
        score += min(skill_count * 3, 40)
        
        # Experience score (0-30 points)
        years = pd.years_of_experience if pd and pd.years_of_experience else 0
        score += min(years * 5, 30)
        
        # Education score (0-15 points)
        if pd and pd.education:
            edu_lower = pd.education.lower()
            if "phd" in edu_lower or "doctorate" in edu_lower:
                score += 15
            elif "master" in edu_lower or "mba" in edu_lower:
                score += 12
            elif "bachelor" in edu_lower or "b.tech" in edu_lower or "b.e" in edu_lower:
                score += 9
            elif "diploma" in edu_lower or "associate" in edu_lower:
                score += 6
            else:
                score += 3
        
        # Profile completeness score (0-15 points)
        if pd:
            if pd.email:
                score += 3
            if pd.phone:
                score += 3
            if pd.linkedin:
                score += 4
            if pd.github:
                score += 3
            if pd.summary:
                score += 2
        
        return score
    
    # Calculate scores for all resumes
    resume_scores = [(r, calculate_resume_score(r)) for r in all_resumes]
    resume_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Find rank of current resume
    current_score = calculate_resume_score(resume)
    rank = 1
    for r, s in resume_scores:
        if str(r.id) == resume_id:
            break
        rank += 1
    
    # Calculate percentile (higher is better)
    percentile = round(((total_candidates - rank) / total_candidates) * 100)
    percentile = max(0, min(100, percentile))
    
    # Determine badge
    if percentile >= 99:
        badge = "Top 1%"
    elif percentile >= 95:
        badge = "Top 5%"
    elif percentile >= 90:
        badge = "Top 10%"
    elif percentile >= 75:
        badge = "Top 25%"
    elif percentile >= 50:
        badge = "Above Average"
    else:
        badge = "Below Average"
    
    return {
        "percentile": percentile,
        "total_candidates": total_candidates,
        "badge": badge,
        "rank": rank,
        "score": round(current_score, 1)
    }


@router.get("/insights/{resume_id}/ats-detailed")
async def get_ats_detailed_breakdown(resume_id: str, current_user: User = Depends(get_current_user)) -> Dict:
    """
    Get detailed ATS compatibility breakdown with section-by-section scores.
    """
    resume = await Resume.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this resume")
    
    text = resume.raw_text or ""
    text_lower = text.lower()
    pd = resume.parsed_data
    
    sections = {}
    issues = []
    
    # 1. Contact Information (0-100)
    contact_score = 0
    contact_issues = []
    if pd and pd.email:
        contact_score += 35
    else:
        contact_issues.append("Add email address")
    if pd and pd.phone:
        contact_score += 35
    else:
        contact_issues.append("Add phone number")
    if pd and pd.linkedin:
        contact_score += 20
    else:
        contact_issues.append("Consider adding LinkedIn profile")
    if pd and pd.name:
        contact_score += 10
    else:
        contact_issues.append("Name not detected")
    sections["contact"] = {"score": contact_score, "issues": contact_issues}
    issues.extend(contact_issues)
    
    # 2. Experience Section (0-100)
    experience_score = 0
    experience_issues = []
    if "experience" in text_lower or "employment" in text_lower or "work history" in text_lower:
        experience_score += 40
    else:
        experience_issues.append("Missing Experience section header")
    
    # Check for action verbs
    action_verbs = ["managed", "developed", "led", "created", "implemented", "designed", "achieved", "improved", "built", "launched"]
    action_verb_count = sum(1 for v in action_verbs if v in text_lower)
    experience_score += min(action_verb_count * 6, 30)
    if action_verb_count < 3:
        experience_issues.append("Use more action verbs (managed, developed, led, etc.)")
    
    # Check for quantifiable results
    import re
    numbers = re.findall(r'\d+%|\$\d+|\d+ years|\d+ team|\d+ projects', text_lower)
    experience_score += min(len(numbers) * 10, 30)
    if len(numbers) < 2:
        experience_issues.append("Add quantifiable achievements (%, $, numbers)")
    
    sections["experience"] = {"score": experience_score, "issues": experience_issues}
    issues.extend(experience_issues)
    
    # 3. Skills Section (0-100)
    skills_score = 0
    skills_issues = []
    if "skills" in text_lower or "technical skills" in text_lower or "core competencies" in text_lower:
        skills_score += 30
    else:
        skills_issues.append("Missing Skills section header")
    
    skill_count = len(pd.skills) if pd and pd.skills else 0
    skills_score += min(skill_count * 7, 70)
    if skill_count < 5:
        skills_issues.append("Add more relevant skills (aim for 8-15)")
    
    sections["skills"] = {"score": skills_score, "issues": skills_issues}
    issues.extend(skills_issues)
    
    # 4. Education Section (0-100)
    education_score = 0
    education_issues = []
    if "education" in text_lower or "academic" in text_lower or "qualification" in text_lower:
        education_score += 50
    else:
        education_issues.append("Missing Education section header")
    
    if pd and pd.education:
        education_score += 50
    else:
        education_issues.append("Education details not detected")
    
    sections["education"] = {"score": education_score, "issues": education_issues}
    issues.extend(education_issues)
    
    # 5. Formatting (0-100)
    formatting_score = 100
    formatting_issues = []
    
    # Check file type
    if not (resume.file_type.endswith("pdf") or resume.file_type.endswith("docx") or resume.file_type.endswith("msword")):
        formatting_score -= 25
        formatting_issues.append("Use PDF or DOCX format")
    
    # Check for tables/graphics (problematic for ATS)
    if "table" in text_lower or "|" in text:
        formatting_score -= 15
        formatting_issues.append("Avoid tables - they may not parse correctly")
    
    # Check file size (too large may indicate embedded images)
    if resume.file_size > 2 * 1024 * 1024:  # > 2MB
        formatting_score -= 15
        formatting_issues.append("File size too large - remove unnecessary images/graphics")
    
    # Check resume length (heuristic based on text length)
    word_count = len(text.split())
    if word_count < 150:
        formatting_score -= 20
        formatting_issues.append("Resume appears too short - add more detail")
    elif word_count > 1500:
        formatting_score -= 10
        formatting_issues.append("Resume may be too long - consider being more concise")
    
    sections["formatting"] = {"score": max(0, formatting_score), "issues": formatting_issues}
    issues.extend(formatting_issues)
    
    # Calculate total score (weighted average)
    total_score = round(
        (sections["contact"]["score"] * 0.15 +
         sections["experience"]["score"] * 0.30 +
         sections["skills"]["score"] * 0.25 +
         sections["education"]["score"] * 0.15 +
         sections["formatting"]["score"] * 0.15)
    )
    
    # Generate quick wins (top 3 highest-impact improvements)
    all_issues_with_impact = [
        (issue, 3) for issue in sections["experience"]["issues"]
    ] + [
        (issue, 2) for issue in sections["skills"]["issues"]
    ] + [
        (issue, 1.5) for issue in sections["contact"]["issues"]
    ] + [
        (issue, 1) for issue in sections["education"]["issues"] + sections["formatting"]["issues"]
    ]
    all_issues_with_impact.sort(key=lambda x: x[1], reverse=True)
    quick_wins = [i[0] for i in all_issues_with_impact[:3]]
    
    return {
        "total_score": total_score,
        "sections": sections,
        "issues": issues[:10],  # Top 10 issues
        "quick_wins": quick_wins
    }


@router.get("/insights/{resume_id}/ats-job/{job_id}")
async def get_job_specific_ats(
    resume_id: str,
    job_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Check ATS compatibility against a specific job's requirements.
    Returns keyword matches, missing skills, and tailored suggestions.
    """
    resume = await Resume.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this resume")
    
    job = await JobDescription.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    pd = resume.parsed_data
    resume_skills = set(s.lower() for s in (pd.skills if pd and pd.skills else []))
    resume_text = (resume.raw_text or "").lower()
    
    # Required skills matching
    required_skills = job.required_skills or []
    matched_required = []
    missing_required = []
    for skill in required_skills:
        skill_lower = skill.lower()
        if skill_lower in resume_skills or skill_lower in resume_text:
            matched_required.append(skill)
        else:
            missing_required.append(skill)
    
    # Preferred skills matching
    preferred_skills = job.preferred_skills or []
    matched_preferred = []
    missing_preferred = []
    for skill in preferred_skills:
        skill_lower = skill.lower()
        if skill_lower in resume_skills or skill_lower in resume_text:
            matched_preferred.append(skill)
        else:
            missing_preferred.append(skill)
    
    # Experience matching
    experience_match = True
    experience_note = ""
    if job.experience_required:
        exp_lower = job.experience_required.lower()
        years_required = 0
        import re
        years_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', exp_lower)
        if years_match:
            years_required = int(years_match.group(1))
        
        candidate_years = pd.years_of_experience if pd and pd.years_of_experience else 0
        if candidate_years < years_required:
            experience_match = False
            experience_note = f"Job requires {years_required}+ years, you have ~{candidate_years:.0f} years"
        else:
            experience_note = f"Experience requirement met ({candidate_years:.0f} years)"
    
    # Calculate job-specific ATS score
    required_score = (len(matched_required) / max(len(required_skills), 1)) * 60
    preferred_score = (len(matched_preferred) / max(len(preferred_skills), 1)) * 25
    exp_score = 15 if experience_match else 5
    total_score = round(required_score + preferred_score + exp_score)
    
    # Generate tailored suggestions
    suggestions = []
    if missing_required:
        suggestions.append(f"Add these required skills to your resume: {', '.join(missing_required[:5])}")
    if missing_preferred:
        suggestions.append(f"Consider adding these preferred skills: {', '.join(missing_preferred[:3])}")
    if not experience_match:
        suggestions.append("Highlight relevant projects or coursework to compensate for experience gap")
    if not pd or not pd.summary:
        suggestions.append(f"Add a professional summary mentioning your interest in {job.title}")
    
    return {
        "job_id": job_id,
        "job_title": job.title,
        "ats_score": total_score,
        "required_skills": {
            "matched": matched_required,
            "missing": missing_required,
            "match_rate": round((len(matched_required) / max(len(required_skills), 1)) * 100)
        },
        "preferred_skills": {
            "matched": matched_preferred,
            "missing": missing_preferred,
            "match_rate": round((len(matched_preferred) / max(len(preferred_skills), 1)) * 100)
        },
        "experience": {
            "match": experience_match,
            "note": experience_note
        },
        "suggestions": suggestions
    }


@router.get("/insights/{resume_id}/improvements")
async def get_resume_improvements(resume_id: str, current_user: User = Depends(get_current_user)) -> Dict:
    """
    Get section-by-section improvement suggestions for the resume.
    """
    resume = await Resume.get(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this resume")
    
    pd = resume.parsed_data
    text = resume.raw_text or ""
    text_lower = text.lower()
    
    sections = []
    
    # Summary/Objective Section
    summary_suggestions = []
    summary_score = 50
    if pd and pd.summary:
        summary_score = 70
        if len(pd.summary) < 50:
            summary_suggestions.append("Expand your summary to 2-3 sentences highlighting key achievements")
        if "results" not in pd.summary.lower() and "achieved" not in pd.summary.lower():
            summary_suggestions.append("Include quantifiable achievements in your summary")
        if len(pd.summary) > 30:
            summary_score = 85
    else:
        summary_suggestions.append("Add a professional summary at the top of your resume")
        summary_suggestions.append("Include your years of experience, key skills, and career goals")
    
    sections.append({
        "name": "Professional Summary",
        "score": summary_score,
        "suggestions": summary_suggestions
    })
    
    # Experience Section
    experience_suggestions = []
    experience_score = 50
    if pd and pd.experience:
        experience_score = 65
        exp_lower = pd.experience.lower()
        
        # Check for action verbs
        action_verbs = ["managed", "developed", "led", "created", "implemented", "designed", "achieved", "improved", "built", "launched", "delivered", "increased", "reduced"]
        used_verbs = [v for v in action_verbs if v in exp_lower]
        if len(used_verbs) < 3:
            experience_suggestions.append(f"Use more action verbs like: {', '.join(action_verbs[:5])}")
        else:
            experience_score += 15
        
        # Check for metrics
        import re
        metrics = re.findall(r'\d+%|\$[\d,]+|\d+ (users|customers|team|projects|clients)', exp_lower)
        if len(metrics) < 2:
            experience_suggestions.append("Add quantifiable metrics (e.g., 'increased sales by 25%', 'managed team of 8')")
        else:
            experience_score += 20
        
        # Check for bullet points
        if "-" not in pd.experience and "•" not in pd.experience:
            experience_suggestions.append("Format experience with bullet points for better readability")
    else:
        experience_suggestions.append("Add detailed work experience with job titles, companies, and dates")
        experience_suggestions.append("Include 3-5 bullet points per role highlighting achievements")
    
    sections.append({
        "name": "Work Experience",
        "score": min(experience_score, 100),
        "suggestions": experience_suggestions
    })
    
    # Skills Section
    skills_suggestions = []
    skills_score = 50
    skill_count = len(pd.skills) if pd and pd.skills else 0
    
    if skill_count >= 10:
        skills_score = 90
    elif skill_count >= 6:
        skills_score = 75
        skills_suggestions.append("Add a few more relevant skills (aim for 10-15 total)")
    elif skill_count >= 3:
        skills_score = 60
        skills_suggestions.append("Expand your skills section with more technical and soft skills")
    else:
        skills_suggestions.append("Add more skills - include technical skills, tools, and soft skills")
        skills_suggestions.append("Review job descriptions for commonly requested skills in your field")
    
    # Check for skill categories
    if skill_count > 0:
        skills_suggestions.append("Consider organizing skills by category (Technical, Tools, Soft Skills)")
    
    sections.append({
        "name": "Skills",
        "score": skills_score,
        "suggestions": skills_suggestions
    })
    
    # Education Section
    education_suggestions = []
    education_score = 50
    if pd and pd.education:
        education_score = 75
        if "gpa" not in pd.education.lower() and "cgpa" not in pd.education.lower():
            education_suggestions.append("Include GPA if it's 3.0+ or equivalent")
        if "honors" not in pd.education.lower() and "dean" not in pd.education.lower():
            education_suggestions.append("Add academic honors, awards, or relevant coursework if applicable")
        education_score = 85
    else:
        education_suggestions.append("Add education details including degree, institution, and graduation year")
    
    sections.append({
        "name": "Education",
        "score": education_score,
        "suggestions": education_suggestions
    })
    
    # Contact & Links
    contact_suggestions = []
    contact_score = 50
    if pd:
        if pd.email and pd.phone:
            contact_score = 70
        if pd.linkedin:
            contact_score += 15
        else:
            contact_suggestions.append("Add your LinkedIn profile URL")
        if pd.github:
            contact_score += 15
        else:
            contact_suggestions.append("Add your GitHub profile (especially for technical roles)")
    else:
        contact_suggestions.append("Ensure your contact information is clearly visible at the top")
    
    sections.append({
        "name": "Contact & Links",
        "score": min(contact_score, 100),
        "suggestions": contact_suggestions
    })
    
    # Calculate overall score
    overall_score = round(sum(s["score"] for s in sections) / len(sections))
    
    # Get top 3 quick wins across all sections
    all_suggestions = []
    for section in sections:
        for suggestion in section["suggestions"]:
            all_suggestions.append({
                "section": section["name"],
                "suggestion": suggestion,
                "impact": 100 - section["score"]  # Higher impact for lower-scoring sections
            })
    all_suggestions.sort(key=lambda x: x["impact"], reverse=True)
    quick_wins = all_suggestions[:3]
    
    return {
        "overall_score": overall_score,
        "sections": sections,
        "quick_wins": quick_wins
    }