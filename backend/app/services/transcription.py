"""
Transcription Service - Speech-to-Text using Local Whisper (free, no API key needed).

Uses OpenAI's open-source Whisper model running locally on the server.
"""

import os
import asyncio
from typing import Optional

from app.config import settings


# Singleton instance for model caching
_transcription_service_instance: Optional["TranscriptionService"] = None


def get_transcription_service() -> "TranscriptionService":
    """Get singleton instance of TranscriptionService for model reuse."""
    global _transcription_service_instance
    if _transcription_service_instance is None:
        _transcription_service_instance = TranscriptionService()
    return _transcription_service_instance


class TranscriptionService:
    """Service for transcribing audio/video files to text using local Whisper."""
    
    def __init__(self):
        self.model = None
        self._initialized = False
        self._model_name = getattr(settings, 'WHISPER_MODEL', 'base')
    
    async def _initialize(self):
        """Lazy initialization of Whisper model."""
        if not self._initialized:
            def load_model():
                try:
                    import whisper
                    print(f"Loading Whisper model: {self._model_name}...")
                    model = whisper.load_model(self._model_name)
                    print(f"Whisper model '{self._model_name}' loaded successfully")
                    return model
                except Exception as e:
                    print(f"Warning: Could not load Whisper model: {e}")
                    return None
            
            self.model = await asyncio.get_event_loop().run_in_executor(None, load_model)
            self._initialized = True
    
    async def transcribe(self, file_path: str) -> str:
        """
        Transcribe an audio/video file to text using local Whisper.
        
        Args:
            file_path: Path to the audio/video file
            
        Returns:
            Transcribed text
        """
        await self._initialize()
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        if self.model:
            try:
                return await self._transcribe_with_local_whisper(file_path)
            except Exception as e:
                print(f"Local Whisper transcription failed: {e}")
                raise
        else:
            raise RuntimeError("Whisper model not loaded. Please ensure 'openai-whisper' is installed.")
    
    async def _transcribe_with_local_whisper(self, file_path: str) -> str:
        """Transcribe using local Whisper model."""
        def transcribe():
            # Transcribe the audio file
            result = self.model.transcribe(
                file_path,
                language="en",  # Can be set to None for auto-detection
                fp16=False  # Use FP32 for CPU compatibility
            )
            return result["text"].strip()
        
        return await asyncio.get_event_loop().run_in_executor(None, transcribe)
    
    async def get_audio_duration(self, file_path: str) -> Optional[float]:
        """Get the duration of an audio file in seconds."""
        try:
            def get_duration():
                try:
                    from mutagen import File as MutagenFile
                    audio = MutagenFile(file_path)
                    if audio is not None:
                        return audio.info.length
                except ImportError:
                    pass
                
                # Fallback using whisper's audio loading
                try:
                    import whisper
                    audio = whisper.load_audio(file_path)
                    return len(audio) / 16000  # Whisper uses 16kHz sample rate
                except Exception:
                    pass
                
                return None
            
            return await asyncio.get_event_loop().run_in_executor(None, get_duration)
        except Exception:
            return None

