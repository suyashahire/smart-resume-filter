"""
RAG (Retrieval-Augmented Generation) service for the AI chatbot.
Uses sentence-transformers for embeddings and ChromaDB for vector storage.
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    import chromadb
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

from app.config import settings


class RAGService:
    """
    RAG service that indexes resumes, jobs, and other recruitment data
    for context-aware chatbot responses.
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.embedding_model = None
            self.chroma_client = None
            self.resumes_collection = None
            self.jobs_collection = None
            self._initialized = True
    
    async def _initialize(self):
        """Initialize embedding model and ChromaDB."""
        if self.embedding_model is not None:
            return
        
        if not HAS_SENTENCE_TRANSFORMERS:
            print("  ⚠️ sentence-transformers not installed, RAG disabled")
            return
        
        if not HAS_CHROMADB:
            print("  ⚠️ chromadb not installed, RAG disabled")
            return
        
        # Load embedding model (reuse the one from config)
        loop = asyncio.get_event_loop()
        self.embedding_model = await loop.run_in_executor(
            None, 
            lambda: SentenceTransformer(settings.SENTENCE_TRANSFORMER_MODEL)
        )
        
        # Initialize ChromaDB (persistent local storage)
        persist_dir = os.path.join(settings.UPLOAD_DIR, "chromadb")
        os.makedirs(persist_dir, exist_ok=True)
        
        self.chroma_client = chromadb.PersistentClient(path=persist_dir)
        
        # Create collections
        self.resumes_collection = self.chroma_client.get_or_create_collection(
            name="resumes",
            metadata={"hnsw:space": "cosine"}
        )
        
        self.jobs_collection = self.chroma_client.get_or_create_collection(
            name="jobs",
            metadata={"hnsw:space": "cosine"}
        )
        
        print("  ✅ RAG service initialized (ChromaDB + embeddings)")
    
    def is_available(self) -> bool:
        """Check if RAG service is ready."""
        return self.embedding_model is not None and self.chroma_client is not None
    
    def _embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for texts."""
        if not self.embedding_model:
            return []
        embeddings = self.embedding_model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()
    
    async def index_resume(self, resume_id: str, resume_data: Dict[str, Any]):
        """Index a resume for RAG retrieval."""
        if not self.is_available():
            return
        
        # Build document text from resume data
        parsed = resume_data.get("parsed_data", {})
        parts = []
        
        if parsed.get("name"):
            parts.append(f"Candidate: {parsed['name']}")
        if parsed.get("email"):
            parts.append(f"Email: {parsed['email']}")
        if parsed.get("skills"):
            skills = parsed["skills"] if isinstance(parsed["skills"], list) else [parsed["skills"]]
            parts.append(f"Skills: {', '.join(skills)}")
        if parsed.get("experience"):
            parts.append(f"Experience: {parsed['experience']}")
        if parsed.get("education"):
            parts.append(f"Education: {parsed['education']}")
        if parsed.get("summary"):
            parts.append(f"Summary: {parsed['summary']}")
        if parsed.get("certifications"):
            parts.append(f"Certifications: {', '.join(parsed['certifications'])}")
        if parsed.get("years_of_experience"):
            parts.append(f"Years of experience: {parsed['years_of_experience']}")
        
        # Add raw text if available (truncated)
        raw_text = resume_data.get("raw_text", "")
        if raw_text:
            parts.append(f"Full text: {raw_text[:1500]}")
        
        document = "\n".join(parts)
        if not document.strip():
            return
        
        # Generate embedding and store
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(None, lambda: self._embed([document]))
        
        if embeddings:
            self.resumes_collection.upsert(
                ids=[resume_id],
                embeddings=embeddings,
                documents=[document],
                metadatas=[{
                    "name": parsed.get("name", "Unknown"),
                    "email": parsed.get("email", ""),
                    "skills": ", ".join(parsed.get("skills", [])) if isinstance(parsed.get("skills"), list) else "",
                    "type": "resume",
                    "indexed_at": datetime.utcnow().isoformat()
                }]
            )
    
    async def index_job(self, job_id: str, job_data: Dict[str, Any]):
        """Index a job description for RAG retrieval."""
        if not self.is_available():
            return
        
        parts = []
        if job_data.get("title"):
            parts.append(f"Job Title: {job_data['title']}")
        if job_data.get("company"):
            parts.append(f"Company: {job_data['company']}")
        if job_data.get("description"):
            parts.append(f"Description: {job_data['description'][:1000]}")
        if job_data.get("requirements"):
            reqs = job_data["requirements"]
            if isinstance(reqs, list):
                parts.append(f"Requirements: {', '.join(reqs)}")
            else:
                parts.append(f"Requirements: {reqs}")
        if job_data.get("skills_required"):
            skills = job_data["skills_required"]
            if isinstance(skills, list):
                parts.append(f"Required Skills: {', '.join(skills)}")
        if job_data.get("location"):
            parts.append(f"Location: {job_data['location']}")
        if job_data.get("salary_range"):
            parts.append(f"Salary: {job_data['salary_range']}")
        
        document = "\n".join(parts)
        if not document.strip():
            return
        
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(None, lambda: self._embed([document]))
        
        if embeddings:
            self.jobs_collection.upsert(
                ids=[job_id],
                embeddings=embeddings,
                documents=[document],
                metadatas=[{
                    "title": job_data.get("title", "Unknown"),
                    "company": job_data.get("company", ""),
                    "type": "job",
                    "indexed_at": datetime.utcnow().isoformat()
                }]
            )
    
    async def remove_resume(self, resume_id: str):
        """Remove a resume from the index."""
        if not self.is_available():
            return
        try:
            self.resumes_collection.delete(ids=[resume_id])
        except Exception:
            pass
    
    async def remove_job(self, job_id: str):
        """Remove a job from the index."""
        if not self.is_available():
            return
        try:
            self.jobs_collection.delete(ids=[job_id])
        except Exception:
            pass
    
    async def search(self, query: str, n_results: int = 5, search_type: str = "all") -> List[Dict[str, Any]]:
        """
        Search for relevant documents.
        
        Args:
            query: Search query
            n_results: Max results per collection
            search_type: "all", "resumes", or "jobs"
        
        Returns:
            List of relevant document chunks with metadata
        """
        if not self.is_available():
            return []
        
        results = []
        
        loop = asyncio.get_event_loop()
        query_embedding = await loop.run_in_executor(None, lambda: self._embed([query]))
        
        if not query_embedding:
            return []
        
        # Search resumes
        if search_type in ("all", "resumes"):
            try:
                resume_count = self.resumes_collection.count()
                if resume_count > 0:
                    resume_results = self.resumes_collection.query(
                        query_embeddings=query_embedding,
                        n_results=min(n_results, resume_count),
                        include=["documents", "metadatas", "distances"]
                    )
                    
                    if resume_results and resume_results["documents"]:
                        for i, doc in enumerate(resume_results["documents"][0]):
                            results.append({
                                "type": "resume",
                                "content": doc,
                                "metadata": resume_results["metadatas"][0][i] if resume_results["metadatas"] else {},
                                "relevance": 1 - (resume_results["distances"][0][i] if resume_results["distances"] else 0),
                                "id": resume_results["ids"][0][i] if resume_results["ids"] else ""
                            })
            except Exception as e:
                print(f"⚠️ Resume search error: {e}")
        
        # Search jobs
        if search_type in ("all", "jobs"):
            try:
                job_count = self.jobs_collection.count()
                if job_count > 0:
                    job_results = self.jobs_collection.query(
                        query_embeddings=query_embedding,
                        n_results=min(n_results, job_count),
                        include=["documents", "metadatas", "distances"]
                    )
                    
                    if job_results and job_results["documents"]:
                        for i, doc in enumerate(job_results["documents"][0]):
                            results.append({
                                "type": "job",
                                "content": doc,
                                "metadata": job_results["metadatas"][0][i] if job_results["metadatas"] else {},
                                "relevance": 1 - (job_results["distances"][0][i] if job_results["distances"] else 0),
                                "id": job_results["ids"][0][i] if job_results["ids"] else ""
                            })
            except Exception as e:
                print(f"⚠️ Job search error: {e}")
        
        # Sort by relevance
        results.sort(key=lambda x: x["relevance"], reverse=True)
        return results[:n_results]
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get RAG index statistics."""
        if not self.is_available():
            return {"available": False, "reason": "RAG service not initialized"}
        
        return {
            "available": True,
            "resumes_indexed": self.resumes_collection.count(),
            "jobs_indexed": self.jobs_collection.count(),
            "embedding_model": settings.SENTENCE_TRANSFORMER_MODEL
        }
    
    async def reindex_all(self):
        """Reindex all resumes and jobs from database."""
        if not self.is_available():
            return {"status": "error", "reason": "RAG service not available"}
        
        from app.models.resume import Resume
        from app.models.job import JobDescription
        
        indexed_resumes = 0
        indexed_jobs = 0
        
        # Reindex all resumes
        async for resume in Resume.find_all():
            try:
                resume_data = {
                    "parsed_data": resume.parsed_data.dict() if resume.parsed_data else {},
                    "raw_text": resume.raw_text or ""
                }
                await self.index_resume(str(resume.id), resume_data)
                indexed_resumes += 1
            except Exception as e:
                print(f"⚠️ Failed to index resume {resume.id}: {e}")
        
        # Reindex all jobs
        async for job in JobDescription.find_all():
            try:
                job_data = {
                    "title": job.title,
                    "company": getattr(job, "company", ""),
                    "description": getattr(job, "description", ""),
                    "requirements": getattr(job, "requirements", []),
                    "skills_required": getattr(job, "skills_required", []),
                    "location": getattr(job, "location", ""),
                    "salary_range": getattr(job, "salary_range", ""),
                }
                await self.index_job(str(job.id), job_data)
                indexed_jobs += 1
            except Exception as e:
                print(f"⚠️ Failed to index job {job.id}: {e}")
        
        return {
            "status": "success",
            "resumes_indexed": indexed_resumes,
            "jobs_indexed": indexed_jobs
        }


def get_rag_service() -> RAGService:
    """Get the RAG service singleton."""
    return RAGService()
