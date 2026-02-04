"""
Resume Parser Service - NLP-based resume parsing and information extraction.

Uses spaCy for NER and custom regex patterns for structured data extraction.
"""

import re
import os
from typing import Tuple, List, Optional
import asyncio

from app.models.resume import ParsedResumeData
from app.config import settings


# Singleton instance for model caching
_resume_parser_instance: Optional["ResumeParserService"] = None


def get_resume_parser() -> "ResumeParserService":
    """Get singleton instance of ResumeParserService for model reuse."""
    global _resume_parser_instance
    if _resume_parser_instance is None:
        _resume_parser_instance = ResumeParserService()
    return _resume_parser_instance


class ResumeParserService:
    """Service for parsing resumes and extracting structured information."""
    
    def __init__(self):
        self.nlp = None
        self._initialized = False
        
        # Common skills database
        self.skills_database = {
            # Programming Languages
            "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "golang",
            "rust", "swift", "kotlin", "php", "scala", "r", "matlab", "perl", "shell", "bash",
            
            # Web Technologies
            "html", "css", "sass", "less", "react", "reactjs", "react.js", "angular", "angularjs",
            "vue", "vuejs", "vue.js", "next.js", "nextjs", "nuxt", "svelte", "jquery", "bootstrap",
            "tailwind", "tailwindcss", "material-ui", "chakra", "webpack", "vite", "babel",
            
            # Backend Frameworks
            "node.js", "nodejs", "express", "expressjs", "django", "flask", "fastapi", "spring",
            "spring boot", "springboot", ".net", "asp.net", "rails", "ruby on rails", "laravel",
            "nest.js", "nestjs", "koa", "hapi",
            
            # Databases
            "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch", "cassandra",
            "dynamodb", "firebase", "sqlite", "oracle", "sql server", "mariadb", "neo4j",
            
            # Cloud & DevOps
            "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes",
            "k8s", "jenkins", "gitlab", "github actions", "terraform", "ansible", "nginx", "apache",
            "linux", "unix", "ci/cd", "devops",
            
            # Data Science & ML
            "machine learning", "deep learning", "tensorflow", "pytorch", "keras", "scikit-learn",
            "pandas", "numpy", "scipy", "matplotlib", "seaborn", "nlp", "natural language processing",
            "computer vision", "opencv", "data analysis", "data science", "big data", "hadoop", "spark",
            
            # Mobile Development
            "android", "ios", "react native", "flutter", "swift", "objective-c", "xamarin",
            
            # Other Technologies
            "git", "github", "gitlab", "bitbucket", "jira", "confluence", "agile", "scrum",
            "rest", "restful", "graphql", "api", "microservices", "soap", "grpc",
            "unit testing", "jest", "pytest", "selenium", "cypress",
            
            # Soft Skills
            "communication", "leadership", "teamwork", "problem solving", "analytical",
            "project management", "time management", "critical thinking"
        }
        
        # Education keywords
        self.education_keywords = [
            "b.tech", "btech", "b.e.", "be", "bachelor", "b.sc", "bsc", "b.s.",
            "m.tech", "mtech", "m.e.", "me", "master", "m.sc", "msc", "m.s.",
            "ph.d", "phd", "doctorate",
            "diploma", "certification", "certificate",
            "computer science", "computer engineering", "software engineering",
            "information technology", "electrical engineering", "electronics",
            "cgpa", "gpa", "percentage", "first class", "distinction"
        ]
    
    async def _initialize(self):
        """Lazy initialization of spaCy model."""
        if not self._initialized:
            try:
                import spacy
                self.nlp = spacy.load(settings.SPACY_MODEL)
            except OSError:
                # Fallback to smaller model if large model not available
                import spacy
                try:
                    self.nlp = spacy.load("en_core_web_sm")
                except OSError:
                    # Download if not available
                    import subprocess
                    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
                    self.nlp = spacy.load("en_core_web_sm")
            
            self._initialized = True
    
    async def parse_resume(self, file_path: str) -> Tuple[ParsedResumeData, str]:
        """
        Parse a resume file and extract structured information.
        
        Args:
            file_path: Path to the resume file (PDF or DOCX)
            
        Returns:
            Tuple of (ParsedResumeData, raw_text)
        """
        await self._initialize()
        
        # Extract text from file
        raw_text = await self._extract_text(file_path)
        
        if not raw_text:
            raise ValueError("Could not extract text from resume")
        
        # Parse with NLP
        doc = self.nlp(raw_text)
        
        # Extract information
        parsed_data = ParsedResumeData(
            name=self._extract_name(doc, raw_text),
            email=self._extract_email(raw_text),
            phone=self._extract_phone(raw_text),
            skills=self._extract_skills(raw_text),
            education=self._extract_education(raw_text),
            experience=self._extract_experience(raw_text),
            linkedin=self._extract_linkedin(raw_text),
            github=self._extract_github(raw_text),
            years_of_experience=self._estimate_experience_years(raw_text)
        )
        
        return parsed_data, raw_text
    
    async def _extract_text(self, file_path: str) -> str:
        """Extract text from PDF or DOCX file."""
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".pdf":
            return await self._extract_from_pdf(file_path)
        elif ext == ".docx":
            return await self._extract_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
    
    async def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file."""
        def extract():
            try:
                import pdfplumber
                text = ""
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                return text
            except Exception:
                # Fallback to PyMuPDF
                import fitz
                text = ""
                doc = fitz.open(file_path)
                for page in doc:
                    text += page.get_text() + "\n"
                doc.close()
                return text
        
        return await asyncio.get_event_loop().run_in_executor(None, extract)
    
    async def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file."""
        def extract():
            from docx import Document
            doc = Document(file_path)
            text = ""
            for para in doc.paragraphs:
                text += para.text + "\n"
            return text
        
        return await asyncio.get_event_loop().run_in_executor(None, extract)
    
    def _extract_name(self, doc, text: str) -> str:
        """Extract candidate name using NER."""
        # Try to find PERSON entities
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                return ent.text
        
        # Fallback: First line often contains name
        lines = text.strip().split('\n')
        if lines:
            first_line = lines[0].strip()
            # Check if it looks like a name (2-4 words, no special chars)
            words = first_line.split()
            if 2 <= len(words) <= 4 and all(w.isalpha() for w in words):
                return first_line
        
        return "Unknown"
    
    def _extract_email(self, text: str) -> str:
        """Extract email address using regex."""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group(0) if match else ""
    
    def _extract_phone(self, text: str) -> str:
        """Extract phone number using regex."""
        # Various phone formats
        patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\+?\d{10,13}',
            r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        
        return ""
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text."""
        text_lower = text.lower()
        found_skills = []
        
        for skill in self.skills_database:
            # Check for exact word match
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                # Capitalize properly
                found_skills.append(skill.title() if len(skill) > 2 else skill.upper())
        
        # Remove duplicates while preserving order
        seen = set()
        unique_skills = []
        for skill in found_skills:
            skill_lower = skill.lower()
            if skill_lower not in seen:
                seen.add(skill_lower)
                unique_skills.append(skill)
        
        return unique_skills[:20]  # Limit to top 20 skills
    
    def _extract_education(self, text: str) -> str:
        """Extract education information."""
        text_lower = text.lower()
        
        # Look for education section
        education_section = ""
        
        # Common section headers
        headers = ["education", "academic", "qualification", "degree"]
        
        for header in headers:
            pattern = rf'{header}[:\s]*\n(.*?)(?=\n\n|\nexperience|\nwork|\nskills|\nprojects|$)'
            match = re.search(pattern, text_lower, re.DOTALL | re.IGNORECASE)
            if match:
                education_section = match.group(1).strip()
                break
        
        if education_section:
            # Clean up and return first 200 chars
            education_section = ' '.join(education_section.split())
            return education_section[:200]
        
        # Fallback: Look for degree keywords
        for keyword in self.education_keywords:
            pattern = rf'.*{keyword}.*'
            match = re.search(pattern, text_lower)
            if match:
                line = match.group(0).strip()
                return line[:200]
        
        return ""
    
    def _extract_experience(self, text: str) -> str:
        """Extract work experience information."""
        text_lower = text.lower()
        
        # Look for experience section
        headers = ["experience", "work history", "employment", "professional experience"]
        
        for header in headers:
            pattern = rf'{header}[:\s]*\n(.*?)(?=\n\n|\neducation|\nskills|\nprojects|$)'
            match = re.search(pattern, text_lower, re.DOTALL | re.IGNORECASE)
            if match:
                experience_section = match.group(1).strip()
                experience_section = ' '.join(experience_section.split())
                return experience_section[:300]
        
        return ""
    
    def _extract_linkedin(self, text: str) -> Optional[str]:
        """Extract LinkedIn URL."""
        pattern = r'linkedin\.com/in/[\w-]+'
        match = re.search(pattern, text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else None
    
    def _extract_github(self, text: str) -> Optional[str]:
        """Extract GitHub URL."""
        pattern = r'github\.com/[\w-]+'
        match = re.search(pattern, text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else None
    
    def _estimate_experience_years(self, text: str) -> Optional[float]:
        """Estimate years of experience from resume."""
        # Look for explicit mentions
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'experience[:\s]*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s*(?:in|of)\s*(?:software|development|programming)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1))
        
        return None

