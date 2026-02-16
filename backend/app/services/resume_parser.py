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
        """Extract candidate name using multiple strategies."""
        lines = text.strip().split('\n')
        
        # Strategy 1: Look for PERSON entities in the first few lines (most reliable)
        # Resumes typically have the name at the very top
        first_lines_text = '\n'.join(lines[:5]) if lines else ""
        first_lines_doc = self.nlp(first_lines_text)
        
        person_entities = []
        for ent in first_lines_doc.ents:
            if ent.label_ == "PERSON":
                name = ent.text.strip()
                # Filter out common false positives
                if self._is_valid_name(name):
                    person_entities.append(name)
        
        if person_entities:
            return person_entities[0]
        
        # Strategy 2: Check if first non-empty line looks like a name
        for line in lines[:3]:
            line = line.strip()
            if not line:
                continue
            # Skip lines that are clearly not names
            if self._is_section_header(line) or '@' in line or any(c.isdigit() for c in line):
                continue
            words = line.split()
            if 2 <= len(words) <= 4 and all(self._is_name_word(w) for w in words):
                return line
        
        # Strategy 3: Try to extract name from email address
        email = self._extract_email(text)
        if email:
            name_from_email = self._extract_name_from_email(email)
            if name_from_email:
                return name_from_email
        
        # Strategy 4: Look for PERSON entities in the full document
        # but only if they appear early and are valid
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                name = ent.text.strip()
                # Only accept if it appears in the first 500 characters
                if ent.start_char < 500 and self._is_valid_name(name):
                    return name
        
        return "Unknown"
    
    def _is_valid_name(self, name: str) -> bool:
        """Check if a string is likely a valid person name."""
        if not name or len(name) < 2:
            return False
        
        words = name.split()
        if not (1 <= len(words) <= 5):
            return False
        
        # Common false positives to filter out
        false_positives = {
            "resume", "cv", "curriculum vitae", "profile", "summary",
            "objective", "experience", "education", "skills", "contact",
            "references", "phone", "email", "address", "linkedin", "github",
            "university", "college", "school", "institute", "inc", "llc", "ltd",
            "company", "corporation", "technologies", "solutions", "services",
            "january", "february", "march", "april", "may", "june", "july",
            "august", "september", "october", "november", "december",
            "project", "manager", "developer", "engineer", "analyst", "intern"
        }
        
        name_lower = name.lower()
        # Check if the entire name matches a false positive
        if name_lower in false_positives:
            return False
        
        # Check if any word is a false positive (for multi-word names)
        for word in words:
            if word.lower() in false_positives:
                return False
        
        # Check if all words look like name components
        for word in words:
            # Allow names with hyphens, apostrophes (O'Brien, Mary-Jane)
            clean_word = word.replace("-", "").replace("'", "").replace(".", "")
            if not clean_word.isalpha():
                return False
        
        return True
    
    def _is_name_word(self, word: str) -> bool:
        """Check if a word could be part of a name."""
        # Allow letters, hyphens, apostrophes, and periods (for initials like J.)
        clean = word.replace("-", "").replace("'", "").replace(".", "")
        return clean.isalpha() and len(clean) >= 1
    
    def _is_section_header(self, line: str) -> bool:
        """Check if a line is a section header."""
        headers = {
            "resume", "cv", "curriculum vitae", "profile", "summary", "objective",
            "experience", "work experience", "professional experience", "employment",
            "education", "academic", "qualifications", "skills", "technical skills",
            "projects", "certifications", "achievements", "contact", "references"
        }
        return line.lower().strip().rstrip(':') in headers
    
    def _extract_name_from_email(self, email: str) -> str:
        """Try to extract a name from an email address."""
        if not email or '@' not in email:
            return ""
        
        local_part = email.split('@')[0]
        
        # Common patterns: firstname.lastname, firstname_lastname, firstnamelastname
        # Remove numbers
        local_part = re.sub(r'\d+', '', local_part)
        
        # Split by common separators
        parts = re.split(r'[._-]', local_part)
        parts = [p for p in parts if len(p) >= 2 and p.isalpha()]
        
        if len(parts) >= 2:
            # Capitalize each part
            return ' '.join(p.capitalize() for p in parts[:2])
        elif len(parts) == 1 and len(parts[0]) >= 3:
            # Single part - might be just firstname
            return parts[0].capitalize()
        
        return ""
    
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
        found_experience_header = False
        
        # Section headers that start experience
        start_headers = ["experience", "work history", "employment history", "employment",
                        "professional experience", "work experience", "career history",
                        "professional background", "relevant experience", "internship",
                        "internships"]
        
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
                found_experience_header = True
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
            # Validate that extracted content looks like actual work experience
            validated_lines = self._validate_experience_content(experience_lines)
            if validated_lines:
                result = ' | '.join(validated_lines)
                return result[:1000] if len(result) > 1000 else result
        
        # If we found an experience header but no valid content, candidate has no experience
        if found_experience_header:
            return "No professional experience"
        
        # No experience section found - try to detect if this is an entry-level resume
        if self._is_entry_level_resume(text):
            return "No professional experience"
        
        # Fallback: Only look for very strong indicators of actual work experience
        experience_info = self._extract_experience_fallback(text)
        
        if experience_info:
            result = ' | '.join(experience_info)
            return result[:1000] if len(result) > 1000 else result
        
        return "No professional experience"
    
    def _validate_experience_content(self, lines: List[str]) -> List[str]:
        """Validate that extracted lines are actual work experience, not projects/education."""
        validated = []
        
        # Patterns that indicate actual work experience
        work_indicators = [
            r'\b(?:at|@)\s+[A-Z]',  # "at Google", "@ Microsoft"
            r'\b(?:Inc|LLC|Ltd|Corp|Company|Co\.|Technologies|Solutions|Services)\b',  # Company suffixes
            r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}\s*[-–—to]+\s*(?:Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)',  # Date ranges
            r'\b(?:Intern|Internship|Full[- ]?time|Part[- ]?time|Contract|Remote)\b',  # Employment terms
            r'\b(?:hired|employed|joined|worked at|position at|role at)\b',  # Employment verbs
        ]
        
        # Patterns that indicate NOT work experience (projects, coursework, etc.)
        non_work_indicators = [
            r'\b(?:course|coursework|class|assignment|homework|lab|laboratory)\b',
            r'\b(?:personal project|side project|hobby project|academic project)\b',
            r'\b(?:university|college|school)\s+project\b',
            r'\b(?:capstone|thesis|dissertation|research paper)\b',
            r'^(?:built|created|developed|designed)\s+(?:a|an|the)\s+\w+\s+(?:for|as)\s+(?:fun|learning|practice)',
        ]
        
        for line in lines:
            line_lower = line.lower()
            
            # Skip very short lines
            if len(line.strip()) < 10:
                continue
            
            # Check for non-work indicators
            is_non_work = any(re.search(pattern, line_lower, re.IGNORECASE) for pattern in non_work_indicators)
            if is_non_work:
                continue
            
            # Check for work indicators
            has_work_indicator = any(re.search(pattern, line, re.IGNORECASE) for pattern in work_indicators)
            
            # Accept if it has work indicators, or if it's substantial content
            if has_work_indicator or len(line) > 30:
                validated.append(line)
        
        return validated
    
    def _is_entry_level_resume(self, text: str) -> bool:
        """Detect if this is likely an entry-level/student resume with no work experience."""
        text_lower = text.lower()
        
        # Strong indicators of entry-level/student
        student_indicators = [
            r'\b(?:freshman|sophomore|junior|senior)\s+(?:student|year)\b',
            r'\b(?:pursuing|currently pursuing|expected graduation)\b',
            r'\b(?:recent graduate|fresh graduate|new graduate)\b',
            r'\bstudent\s+at\b',
            r'\b(?:gpa|cgpa)[:\s]*[3-4]\.\d',  # GPA mentions (usually students)
            r'\bno\s+(?:prior\s+)?(?:work\s+)?experience\b',
            r'\b(?:seeking|looking for)\s+(?:internship|entry[- ]level|first)\b',
            r'\b(?:eager to learn|willing to learn|quick learner)\b',
        ]
        
        student_score = sum(1 for pattern in student_indicators if re.search(pattern, text_lower))
        
        # Check for absence of work-related terms
        work_terms = [
            r'\b(?:employed|hired|worked at|position at)\b',
            r'\b(?:Inc|LLC|Ltd|Corp)\b',
            r'\b(?:salary|compensation|promoted)\b',
            r'\byears?\s+(?:of\s+)?experience\b',
        ]
        
        has_work_terms = any(re.search(pattern, text_lower) for pattern in work_terms)
        
        # If strong student indicators and no work terms, it's entry-level
        return student_score >= 2 and not has_work_terms
    
    def _extract_experience_fallback(self, text: str) -> List[str]:
        """
        Fallback extraction - only finds very strong work experience indicators.
        This is deliberately conservative to avoid extracting projects/coursework.
        """
        experience_info = []
        
        # Only look for job titles that are clearly in an employment context
        # Must have company name or employment indicator nearby
        employment_pattern = r'((?:Software|Data|Web|Full[- ]?Stack|Frontend|Backend|Mobile|DevOps|Cloud|ML|AI)?[\s]?(?:Developer|Engineer|Analyst|Designer|Manager|Architect|Consultant|Specialist)[\s,]+(?:at|@|[-–—])\s*[A-Z][A-Za-z\s&,]+(?:Inc|LLC|Ltd|Corp|Company|Co\.|Technologies|Solutions|Services)?)'
        employment_matches = re.findall(employment_pattern, text)
        for match in employment_matches[:3]:
            cleaned = match.strip()
            if len(cleaned) > 15 and cleaned not in experience_info:
                experience_info.append(cleaned)
        
        # Look for internship mentions specifically (common for entry-level)
        intern_pattern = r'((?:Software|Data|Web|Engineering|Development)?[\s]?Intern(?:ship)?[\s,]+(?:at|@|[-–—])\s*[A-Z][A-Za-z\s&,]+)'
        intern_matches = re.findall(intern_pattern, text)
        for match in intern_matches[:2]:
            cleaned = match.strip()
            if len(cleaned) > 10 and cleaned not in experience_info:
                experience_info.append(cleaned)
        
        return experience_info
    
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
        # Check if this is an entry-level resume first
        if self._is_entry_level_resume(text):
            return 0.0
        
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
        
        # Check for "no experience" indicators
        no_exp_patterns = [
            r'\bno\s+(?:prior\s+)?(?:work\s+)?experience\b',
            r'\bfresher\b',
            r'\bfresh graduate\b',
            r'\bentry[- ]level\b',
        ]
        
        for pattern in no_exp_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return 0.0
        
        return None

