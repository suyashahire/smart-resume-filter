"""
Job Parser Service - Extract skills and requirements from job descriptions.
"""

import re
from typing import List
import asyncio

from app.config import settings


class JobParserService:
    """Service for parsing job descriptions and extracting requirements."""
    
    def __init__(self):
        self.nlp = None
        self._initialized = False
        
        # Common technical skills
        self.technical_skills = {
            # Programming Languages
            "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go",
            "rust", "swift", "kotlin", "php", "scala", "r",
            
            # Web Technologies
            "html", "css", "react", "angular", "vue", "next.js", "node.js",
            "express", "django", "flask", "fastapi", "spring", "spring boot",
            
            # Databases
            "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
            "sql", "nosql", "database",
            
            # Cloud & DevOps
            "aws", "azure", "gcp", "docker", "kubernetes", "jenkins",
            "ci/cd", "devops", "linux", "git",
            
            # Data Science & ML
            "machine learning", "deep learning", "tensorflow", "pytorch",
            "data science", "data analysis", "nlp", "ai", "artificial intelligence",
            
            # Other
            "api", "rest", "graphql", "microservices", "agile", "scrum"
        }
        
        # Soft skills
        self.soft_skills = {
            "communication", "leadership", "teamwork", "problem solving",
            "analytical", "creative", "detail oriented", "self motivated",
            "time management", "project management", "collaboration"
        }
    
    async def _initialize(self):
        """Lazy initialization of NLP model."""
        if not self._initialized:
            try:
                import spacy
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                import subprocess
                subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
                import spacy
                self.nlp = spacy.load("en_core_web_sm")
            
            self._initialized = True
    
    async def extract_skills(self, description: str) -> List[str]:
        """
        Extract required skills from a job description.
        
        Args:
            description: Job description text
            
        Returns:
            List of extracted skills
        """
        await self._initialize()
        
        description_lower = description.lower()
        found_skills = set()
        
        # Extract technical skills
        for skill in self.technical_skills:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, description_lower):
                found_skills.add(skill.title() if len(skill) > 2 else skill.upper())
        
        # Extract soft skills
        for skill in self.soft_skills:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, description_lower):
                found_skills.add(skill.title())
        
        # Use NLP to find additional noun phrases that might be skills
        doc = self.nlp(description)
        
        for chunk in doc.noun_chunks:
            chunk_text = chunk.text.lower().strip()
            # Check if it looks like a skill (short phrase, no common words)
            if 1 <= len(chunk_text.split()) <= 3:
                if any(tech in chunk_text for tech in ["development", "programming", "engineering", "design"]):
                    found_skills.add(chunk.text.title())
        
        # Sort by relevance (technical skills first)
        result = []
        for skill in found_skills:
            if skill.lower() in self.technical_skills:
                result.insert(0, skill)
            else:
                result.append(skill)
        
        return result[:15]  # Limit to top 15 skills
    
    async def extract_experience_requirement(self, description: str) -> str:
        """Extract experience requirement from job description."""
        patterns = [
            r'(\d+)\+?\s*(?:to\s*\d+)?\s*years?\s*(?:of\s*)?experience',
            r'experience[:\s]*(\d+)\+?\s*years?',
            r'minimum\s*(\d+)\s*years?',
            r'at\s*least\s*(\d+)\s*years?'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                years = match.group(1)
                return f"{years}+ years"
        
        # Check for experience level keywords
        if re.search(r'\b(senior|lead|principal)\b', description, re.IGNORECASE):
            return "5+ years"
        elif re.search(r'\b(mid|intermediate)\b', description, re.IGNORECASE):
            return "2-4 years"
        elif re.search(r'\b(junior|entry|fresher)\b', description, re.IGNORECASE):
            return "0-2 years"
        
        return ""
    
    async def extract_education_requirement(self, description: str) -> str:
        """Extract education requirement from job description."""
        description_lower = description.lower()
        
        if re.search(r'\b(phd|doctorate|ph\.d)\b', description_lower):
            return "Ph.D. or Doctorate"
        elif re.search(r'\b(master|m\.s\.|m\.tech|mtech|m\.e\.)\b', description_lower):
            return "Master's Degree"
        elif re.search(r'\b(bachelor|b\.s\.|b\.tech|btech|b\.e\.|degree)\b', description_lower):
            return "Bachelor's Degree"
        elif re.search(r'\b(diploma|certification)\b', description_lower):
            return "Diploma or Certification"
        
        return ""
    
    async def parse_job_description(self, description: str) -> dict:
        """
        Parse a complete job description.
        
        Returns:
            Dictionary with extracted requirements
        """
        skills = await self.extract_skills(description)
        experience = await self.extract_experience_requirement(description)
        education = await self.extract_education_requirement(description)
        
        return {
            "required_skills": skills,
            "experience_required": experience,
            "education_required": education
        }

