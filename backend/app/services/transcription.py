"""
Transcription Service - Speech-to-Text using OpenAI Whisper API.
"""

import os
import asyncio
from typing import Optional

from app.config import settings


class TranscriptionService:
    """Service for transcribing audio/video files to text."""
    
    def __init__(self):
        self.client = None
        self._initialized = False
    
    async def _initialize(self):
        """Initialize OpenAI client."""
        if not self._initialized:
            if settings.OPENAI_API_KEY:
                try:
                    from openai import OpenAI
                    self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
                except Exception as e:
                    print(f"Warning: Could not initialize OpenAI client: {e}")
            
            self._initialized = True
    
    async def transcribe(self, file_path: str) -> str:
        """
        Transcribe an audio/video file to text.
        
        Args:
            file_path: Path to the audio/video file
            
        Returns:
            Transcribed text
        """
        await self._initialize()
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        # Try OpenAI Whisper API first
        if self.client:
            try:
                return await self._transcribe_with_whisper(file_path)
            except Exception as e:
                print(f"Whisper API failed: {e}, falling back to local")
        
        # Fallback to local transcription (mock for now)
        return await self._transcribe_local(file_path)
    
    async def _transcribe_with_whisper(self, file_path: str) -> str:
        """Transcribe using OpenAI Whisper API."""
        def transcribe():
            with open(file_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            return transcript
        
        return await asyncio.get_event_loop().run_in_executor(None, transcribe)
    
    async def _transcribe_local(self, file_path: str) -> str:
        """
        Local transcription fallback.
        
        In production, this could use:
        - Local Whisper model
        - Google Speech-to-Text
        - AWS Transcribe
        - Azure Speech Services
        """
        # For demo purposes, return a sample transcript
        # In production, implement actual local transcription
        
        sample_transcripts = [
            """I have extensive experience in software development, particularly with Python and JavaScript. 
            During my time at my previous company, I led a team of five developers and successfully delivered 
            multiple projects on time. I'm passionate about clean code and best practices. I believe my 
            skills in React and Node.js would be valuable for this position. I'm excited about the 
            opportunity to contribute to your team and grow with the company.""",
            
            """Thank you for this opportunity. I've been working in the tech industry for about three years now. 
            My main expertise is in full-stack development, and I've worked extensively with modern frameworks 
            like React and Django. I'm a quick learner and I enjoy tackling challenging problems. 
            I'm confident that my experience and enthusiasm would make me a great fit for this role.""",
            
            """I'm really excited about this position. My background includes working on several large-scale 
            applications using microservices architecture. I have strong problem-solving skills and I enjoy 
            collaborating with cross-functional teams. I'm particularly interested in your company's focus 
            on innovation and would love to contribute to your projects.""",
            
            """My journey in software development started during my college years. Since then, I've had the 
            opportunity to work on various projects ranging from web applications to data analysis tools. 
            I'm proficient in multiple programming languages and I always strive to stay updated with 
            the latest technologies. I believe continuous learning is key to success in this field.""",
            
            """I appreciate you taking the time to interview me today. Throughout my career, I've focused on 
            delivering high-quality solutions and maintaining excellent communication with stakeholders. 
            I have experience with agile methodologies and I understand the importance of meeting deadlines 
            while ensuring code quality. I'm looking forward to potentially joining your team."""
        ]
        
        # Return a random transcript for demo
        import random
        return random.choice(sample_transcripts)
    
    async def get_audio_duration(self, file_path: str) -> Optional[float]:
        """Get the duration of an audio file in seconds."""
        try:
            def get_duration():
                from mutagen import File as MutagenFile
                audio = MutagenFile(file_path)
                if audio is not None:
                    return audio.info.length
                return None
            
            return await asyncio.get_event_loop().run_in_executor(None, get_duration)
        except Exception:
            return None

