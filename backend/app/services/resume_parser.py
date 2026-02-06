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
        # Normalize the text - handle both newlines and common section breaks
        # Split on newlines and also on common patterns that indicate new sections
        lines = re.split(r'\n|(?=\b(?:experience|skills|projects|certifications|computer skills|technical skills|work history|employment)\b)', text, flags=re.IGNORECASE)
        lines = [l.strip() for l in lines if l.strip()]
        
        # Find the education section
        education_lines = []
        in_education_section = False
        
        # Section headers that start education
        start_headers = ["education", "academic background", "academic qualifications", 
                        "qualifications", "educational background", "academics"]
        
        # Section headers that end education (expanded list)
        end_headers = ["experience", "work history", "employment", "skills", "projects", 
                      "certifications", "achievements", "publications", "references",
                      "technical skills", "professional experience", "work experience",
                      "computer skills", "programming", "languages:", "tools", "frameworks",
                      "abilities", "competencies", "expertise"]
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Skip empty lines
            if not line_lower:
                continue
            
            # Check if this line is a section header that starts education
            is_edu_header = any(line_lower.startswith(header) or line_lower == header 
                               for header in start_headers)
            if is_edu_header and len(line_lower) < 50:
                in_education_section = True
                continue
            
            # Check if we're leaving education section (another section starts)
            is_end_header = any(line_lower.startswith(header) or header in line_lower[:30] 
                               for header in end_headers)
            if in_education_section and is_end_header and len(line_lower) < 50:
                break
            
            # Collect education content
            if in_education_section:
                # Skip lines that look like skill lists
                if re.match(r'^(python|java|c\+\+|javascript|html|css|sql|react|node)', line_lower):
                    break  # We've hit the skills section
                education_lines.append(line.strip())
        
        if education_lines:
            # Format nicely
            result = ' | '.join(education_lines)
            return result[:600] if len(result) > 600 else result
        
        # Fallback: Extract education info using patterns
        education_info = []
        
        # Look for university/college names with dates
        uni_pattern = r'([A-Z][a-zA-Z\s\-,]+(?:University|College|Institute|School)[^|]*?(?:19|20)\d{2})'
        uni_matches = re.findall(uni_pattern, text)
        for match in uni_matches[:2]:
            education_info.append(match.strip())
        
        # Look for degree mentions
        degree_pattern = r'((?:Bachelor|Master|Ph\.?D|B\.?S\.?|M\.?S\.?|B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?)[^|]*?(?:in\s+)?[A-Za-z\s]+(?:Science|Engineering|Technology|Arts|Commerce)?)'
        degree_matches = re.findall(degree_pattern, text, re.IGNORECASE)
        for match in degree_matches[:2]:
            cleaned = match.strip()
            if cleaned and cleaned not in education_info:
                education_info.append(cleaned)
        
        # Look for GPA
        gpa_pattern = r'(?:GPA|CGPA)[:\s]*(\d+\.?\d*(?:\s*/\s*\d+\.?\d*)?)'
        gpa_match = re.search(gpa_pattern, text, re.IGNORECASE)
        if gpa_match:
            education_info.append(f"GPA: {gpa_match.group(1)}")
        
        if education_info:
            result = ' | '.join(education_info)
            return result[:600] if len(result) > 600 else result
        
        return ""
    
    def _extract_experience(self, text: str) -> str:
        """Extract work experience information."""
        # Normalize the text - handle both newlines and common section breaks
        lines = re.split(r'\n|(?=\b(?:education|skills|projects|certifications|technical skills|academic)\b)', text, flags=re.IGNORECASE)
        lines = [l.strip() for l in lines if l.strip()]
        
        # Find the experience section
        experience_lines = []
        in_experience_section = False
        
        # Section headers that start experience
        start_headers = ["experience", "work history", "employment history", "employment",
                        "professional experience", "work experience", "career history",
                        "professional background", "relevant experience", "internship"]
        
        # Section headers that end experience
        end_headers = ["education", "skills", "projects", "certifications", "achievements",
                      "publications", "references", "technical skills", "academic",
                      "qualifications", "training", "courses", "interests", "hobbies",
                      "computer skills", "programming skills", "languages"]
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Skip empty lines
            if not line_lower:
                continue
            
            # Check if this line is a section header that starts experience
            is_exp_header = any(line_lower.startswith(header) or line_lower == header 
                               for header in start_headers)
            if is_exp_header and len(line_lower) < 60:
                in_experience_section = True
                continue
            
            # Check if we're leaving experience section
            is_end_header = any(line_lower.startswith(header) or header in line_lower[:30] 
                               for header in end_headers)
            if in_experience_section and is_end_header and len(line_lower) < 50:
                break
            
            # Collect experience content
            if in_experience_section:
                experience_lines.append(line.strip())
        
        if experience_lines:
            # Format with separators
            result = ' | '.join(experience_lines)
            return result[:1000] if len(result) > 1000 else result
        
        # Fallback: Extract experience using patterns
        experience_info = []
        
        # Look for job titles with company names
        job_pattern = r'((?:Software|Data|Web|Full[- ]?Stack|Frontend|Backend|Mobile|DevOps|Cloud|ML|AI|Machine Learning)?[\s]?(?:Developer|Engineer|Analyst|Designer|Intern|Manager|Architect|Consultant|Specialist)[^|]*)'
        job_matches = re.findall(job_pattern, text, re.IGNORECASE)
        for match in job_matches[:3]:
            cleaned = match.strip()
            if len(cleaned) > 10 and cleaned not in experience_info:
                experience_info.append(cleaned)
        
        # Look for action verbs with context (common in experience descriptions)
        action_pattern = r'((?:Developed|Designed|Implemented|Built|Created|Managed|Led|Worked|Collaborated|Utilized|Learned)[^.!?|]{20,150})'
        action_matches = re.findall(action_pattern, text, re.IGNORECASE)
        for match in action_matches[:5]:
            cleaned = match.strip()
            if cleaned and cleaned not in experience_info:
                experience_info.append(cleaned)
        
        # Look for date ranges (common in experience)
        date_pattern = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}[^|]*?(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}))'
        date_matches = re.findall(date_pattern, text, re.IGNORECASE)
        for match in date_matches[:3]:
            cleaned = match.strip()
            if cleaned and cleaned not in experience_info:
                experience_info.append(cleaned)
        
        if experience_info:
            result = ' | '.join(experience_info)
            return result[:1000] if len(result) > 1000 else result
        
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

