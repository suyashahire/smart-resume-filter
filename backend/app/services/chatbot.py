"""
AI Chatbot service using Google Gemini (free tier) with RAG context.
"""

import asyncio
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    from google import genai
    from google.genai import types
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

from app.config import settings
from app.services.rag import get_rag_service


# System prompt for the recruitment chatbot
SYSTEM_PROMPT = """You are HireQ AI Assistant, an intelligent recruitment assistant for the HireQ platform. 
You help HR managers and recruiters with:

1. **Resume Analysis**: Answer questions about candidates, their skills, experience, and qualifications.
2. **Job Matching**: Help find the best candidates for specific roles.
3. **Screening Insights**: Provide insights on candidate screening results.
4. **Interview Prep**: Suggest interview questions based on candidate profiles and job requirements.
5. **Recruitment Advice**: General recruitment best practices and guidance.

Guidelines:
- Be concise, professional, and helpful.
- When given context about candidates or jobs, reference specific details from the data.
- If you don't have enough information, say so clearly and suggest what data might help.
- Format responses with markdown for readability (bold, lists, etc.).
- Never fabricate candidate data - only reference what's provided in the context.
- Keep responses focused and under 500 words unless detailed analysis is requested.
- When comparing candidates, use structured formats (tables, bullet points).
"""

# Models to try in order (fallback chain)
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]


class ChatbotService:
    """
    AI Chatbot service using Google Gemini with RAG-enhanced context.
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.client = None
            self.model_name = None
            self.rag_service = get_rag_service()
            self._initialized = True
    
    async def _initialize(self):
        """Initialize Gemini client."""
        if self.client is not None:
            return
        
        if not HAS_GEMINI:
            print("  ⚠️ google-genai not installed, chatbot will use fallback mode")
            return
        
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
        if not api_key:
            print("  ⚠️ GEMINI_API_KEY not set, chatbot will use fallback mode")
            return
        
        try:
            self.client = genai.Client(api_key=api_key)
            # Test which model works
            for model_name in GEMINI_MODELS:
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents="Say hello in 3 words.",
                        config=types.GenerateContentConfig(
                            max_output_tokens=20,
                        )
                    )
                    if response.text:
                        self.model_name = model_name
                        print(f"  ✅ Gemini chatbot initialized ({model_name})")
                        return
                except Exception as e:
                    print(f"  ⚠️ Model {model_name} failed: {str(e)[:80]}")
                    continue
            
            print("  ⚠️ All Gemini models failed, chatbot will use fallback mode")
            self.client = None
        except Exception as e:
            print(f"  ⚠️ Failed to initialize Gemini: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if Gemini is configured and ready."""
        return self.client is not None and self.model_name is not None
    
    async def _get_rag_context(self, query: str) -> tuple[str, List[Dict[str, Any]]]:
        """Retrieve relevant context from RAG for the query."""
        sources = []
        context_parts = []
        
        if not self.rag_service.is_available():
            return "", sources
        
        results = await self.rag_service.search(query, n_results=5)
        
        if results:
            context_parts.append("### Relevant Data from HireQ Platform:\n")
            
            for i, result in enumerate(results, 1):
                context_parts.append(f"**Source {i}** ({result['type'].title()}, relevance: {result['relevance']:.0%}):")
                context_parts.append(result['content'])
                context_parts.append("")
                
                sources.append({
                    "type": result["type"],
                    "id": result.get("id", ""),
                    "name": result.get("metadata", {}).get("name") or result.get("metadata", {}).get("title", "Unknown"),
                    "relevance": round(result["relevance"], 2)
                })
        
        return "\n".join(context_parts), sources
    
    async def _get_platform_stats(self) -> str:
        """Get current platform statistics for context."""
        try:
            from app.models.resume import Resume
            from app.models.job import JobDescription
            from app.models.interview import Interview
            
            resume_count = await Resume.count()
            job_count = await JobDescription.count()
            interview_count = await Interview.count()
            
            return (
                f"\n### Current Platform Stats:\n"
                f"- Total Resumes: {resume_count}\n"
                f"- Active Jobs: {job_count}\n"
                f"- Interviews: {interview_count}\n"
            )
        except Exception:
            return ""
    
    def _build_chat_history(self, messages: List[Dict[str, Any]]) -> List[types.Content]:
        """Convert stored messages to Gemini chat history format."""
        history = []
        for msg in messages:
            role = msg.get("role", "user")
            # Gemini uses "user" and "model" roles
            gemini_role = "model" if role == "assistant" else "user"
            history.append(types.Content(
                role=gemini_role,
                parts=[types.Part.from_text(text=msg.get("content", ""))]
            ))
        return history
    
    async def generate_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a chatbot response with RAG context.
        """
        conversation_history = conversation_history or []
        
        # Get RAG context
        rag_context, sources = await self._get_rag_context(user_message)
        
        # Get platform stats for general queries
        stats_context = ""
        general_keywords = ["how many", "total", "count", "statistics", "stats", "overview", "dashboard"]
        if any(kw in user_message.lower() for kw in general_keywords):
            stats_context = await self._get_platform_stats()
        
        # Build augmented prompt
        augmented_message = user_message
        if rag_context or stats_context:
            augmented_message = (
                f"User Question: {user_message}\n\n"
                f"---\n"
                f"{rag_context}\n"
                f"{stats_context}\n"
                f"---\n\n"
                f"Please answer based on the above context. If the context doesn't contain "
                f"relevant information, provide general recruitment guidance."
            )
        
        # Use Gemini if available
        if self.is_available():
            try:
                # Build chat history
                history = self._build_chat_history(conversation_history[-10:])
                
                # Build contents: history + new user message
                contents = history + [
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=augmented_message)]
                    )
                ]
                
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.client.models.generate_content(
                        model=self.model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            temperature=0.7,
                            top_p=0.9,
                            max_output_tokens=1024,
                        )
                    )
                )
                
                return {
                    "response": response.text,
                    "sources": sources,
                    "model": self.model_name,
                    "rag_used": bool(rag_context),
                }
                
            except Exception as e:
                print(f"⚠️ Gemini error: {e}")
                # Fall back to smart fallback
                return await self._fallback_response(user_message, rag_context, sources)
        else:
            return await self._fallback_response(user_message, rag_context, sources)
    
    async def _fallback_response(
        self,
        user_message: str,
        rag_context: str,
        sources: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Smart fallback when Gemini is not available.
        Uses keyword matching and RAG context to provide useful responses.
        """
        message_lower = user_message.lower()
        
        # Try to provide context-based responses
        if rag_context:
            response = (
                "🤖 **AI Assistant (Offline Mode)**\n\n"
                "I found some relevant information from the platform:\n\n"
                f"{rag_context}\n\n"
                "*Note: For more detailed AI-powered analysis, please configure your Gemini API key.*"
            )
        elif any(kw in message_lower for kw in ["hello", "hi", "hey", "help"]):
            response = (
                "👋 **Hello! I'm the HireQ AI Assistant.**\n\n"
                "I can help you with:\n"
                "- 📄 **Resume questions** - Ask about candidates' skills, experience\n"
                "- 🎯 **Job matching** - Find best candidates for roles\n"
                "- 📊 **Platform stats** - Get overview of your recruitment data\n"
                "- 💡 **Interview tips** - Suggested questions for candidates\n\n"
                "To enable full AI-powered responses, add your free Gemini API key in the settings.\n"
                "Get one at: https://aistudio.google.com/apikey"
            )
        elif any(kw in message_lower for kw in ["candidate", "resume", "skill"]):
            stats = await self._get_platform_stats()
            response = (
                f"📄 **Candidate Information**\n\n"
                f"{stats if stats else 'No candidates found in the system yet.'}\n\n"
                "Upload resumes and I'll be able to answer specific questions about candidates."
            )
        elif any(kw in message_lower for kw in ["job", "role", "position"]):
            stats = await self._get_platform_stats()
            response = (
                f"💼 **Job Information**\n\n"
                f"{stats if stats else 'No jobs found in the system yet.'}\n\n"
                "Create job descriptions and I'll help match candidates to roles."
            )
        elif any(kw in message_lower for kw in ["interview", "question"]):
            response = (
                "🎤 **Interview Tips**\n\n"
                "Here are some general interview best practices:\n\n"
                "1. **Behavioral questions**: \"Tell me about a time when...\"\n"
                "2. **Technical assessment**: Relevant to the role's requirements\n"
                "3. **Culture fit**: Assess alignment with company values\n"
                "4. **Situational questions**: \"How would you handle...\"\n\n"
                "Upload a candidate's resume and job description for tailored interview questions!"
            )
        else:
            response = (
                "🤖 **HireQ AI Assistant**\n\n"
                "I'm here to help with recruitment tasks! Try asking me:\n\n"
                "- \"What skills does [candidate] have?\"\n"
                "- \"How many candidates are in the system?\"\n"
                "- \"Suggest interview questions for a Python developer\"\n"
                "- \"Compare candidates for the [job title] role\"\n\n"
                "💡 *For AI-powered responses, add your free Gemini API key.*\n"
                "*Get one at: https://aistudio.google.com/apikey*"
            )
        
        return {
            "response": response,
            "sources": sources,
            "model": "fallback",
            "rag_used": bool(rag_context),
        }
    
    async def generate_title(self, first_message: str) -> str:
        """Generate a conversation title from the first message."""
        if self.is_available():
            try:
                prompt = (
                    f"Generate a very short title (3-6 words max) for a conversation that starts with: '{first_message}'. "
                    f"Return ONLY the title, no quotes or extra text."
                )
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.client.models.generate_content(
                        model=self.model_name,
                        contents=prompt,
                    )
                )
                return response.text.strip().strip('"\'')[:60]
            except Exception:
                pass
        
        # Fallback: use first few words
        words = first_message.split()[:5]
        title = " ".join(words)
        if len(first_message.split()) > 5:
            title += "..."
        return title


def get_chatbot_service() -> ChatbotService:
    """Get the chatbot service singleton."""
    return ChatbotService()
