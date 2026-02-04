"""
Sentiment Analysis Service - Analyze interview transcripts for sentiment and confidence.

Uses Hugging Face Transformers for sentiment analysis.
"""

import re
from typing import List, Optional
import asyncio

from app.models.interview import SentimentAnalysis
from app.config import settings


# Singleton instance for model caching
_sentiment_service_instance: Optional["SentimentAnalysisService"] = None


def get_sentiment_service() -> "SentimentAnalysisService":
    """Get singleton instance of SentimentAnalysisService for model reuse."""
    global _sentiment_service_instance
    if _sentiment_service_instance is None:
        _sentiment_service_instance = SentimentAnalysisService()
    return _sentiment_service_instance


class SentimentAnalysisService:
    """Service for analyzing interview transcripts."""
    
    def __init__(self):
        self.sentiment_analyzer = None
        self._initialized = False
        
        # Positive indicators
        self.positive_words = {
            "excellent", "great", "amazing", "fantastic", "wonderful", "outstanding",
            "passionate", "excited", "enthusiastic", "confident", "strong", "successful",
            "achieved", "accomplished", "led", "improved", "increased", "delivered",
            "innovative", "creative", "motivated", "dedicated", "committed", "experienced",
            "expertise", "proficient", "skilled", "capable", "effective", "efficient"
        }
        
        # Negative indicators
        self.negative_words = {
            "difficult", "challenging", "struggled", "failed", "problem", "issue",
            "weakness", "concern", "worried", "nervous", "unsure", "unclear",
            "confused", "frustrated", "disappointed", "unfortunately", "however",
            "but", "although", "despite", "lack", "limited", "basic"
        }
        
        # Confidence indicators
        self.confidence_indicators = {
            "high": ["i am confident", "i believe", "i'm certain", "definitely",
                    "absolutely", "i'm sure", "without doubt", "i know", "clearly"],
            "medium": ["i think", "probably", "likely", "should be", "could be",
                      "i would say", "in my opinion", "i feel"],
            "low": ["maybe", "perhaps", "i'm not sure", "i don't know", "possibly",
                   "i guess", "sort of", "kind of", "might be"]
        }
    
    async def _initialize(self):
        """Lazy initialization of sentiment analyzer."""
        if not self._initialized:
            def load_model():
                try:
                    from transformers import pipeline
                    return pipeline(
                        "sentiment-analysis",
                        model=settings.SENTIMENT_MODEL
                    )
                except Exception as e:
                    print(f"Warning: Could not load sentiment model: {e}")
                    return None
            
            self.sentiment_analyzer = await asyncio.get_event_loop().run_in_executor(
                None, load_model
            )
            self._initialized = True
    
    async def analyze(self, transcript: str) -> SentimentAnalysis:
        """
        Analyze an interview transcript for sentiment and confidence.
        
        Args:
            transcript: Interview transcript text
            
        Returns:
            SentimentAnalysis with scores and details
        """
        await self._initialize()
        
        # Split transcript into sentences for analysis
        sentences = self._split_into_sentences(transcript)
        
        # Calculate sentiment score
        sentiment_score, overall_sentiment, positive_phrases, negative_phrases = \
            await self._analyze_sentiment(sentences)
        
        # Calculate confidence score
        confidence_score = self._analyze_confidence(transcript)
        
        # Extract key topics
        key_topics = self._extract_key_topics(transcript)
        
        # Calculate communication metrics
        clarity_score = self._calculate_clarity(transcript)
        enthusiasm_score = self._calculate_enthusiasm(transcript)
        professionalism_score = self._calculate_professionalism(transcript)
        
        return SentimentAnalysis(
            overall_sentiment=overall_sentiment,
            sentiment_score=round(sentiment_score, 1),
            confidence_score=round(confidence_score, 1),
            positive_phrases=positive_phrases[:5],  # Top 5
            negative_phrases=negative_phrases[:5],  # Top 5
            key_topics=key_topics[:10],  # Top 10
            clarity_score=round(clarity_score, 1),
            enthusiasm_score=round(enthusiasm_score, 1),
            professionalism_score=round(professionalism_score, 1)
        )
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    async def _analyze_sentiment(self, sentences: List[str]) -> tuple:
        """Analyze sentiment of sentences."""
        positive_phrases = []
        negative_phrases = []
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            
            # Use transformer model if available
            if self.sentiment_analyzer:
                try:
                    result = await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda s=sentence: self.sentiment_analyzer(s[:512])[0]
                    )
                    
                    if result["label"] == "POSITIVE":
                        positive_count += 1
                        if result["score"] > 0.8:
                            positive_phrases.append(sentence[:100])
                    else:
                        negative_count += 1
                        if result["score"] > 0.8:
                            negative_phrases.append(sentence[:100])
                    
                    continue
                except Exception:
                    pass
            
            # Fallback to keyword-based analysis
            pos_words = sum(1 for word in self.positive_words if word in sentence_lower)
            neg_words = sum(1 for word in self.negative_words if word in sentence_lower)
            
            if pos_words > neg_words:
                positive_count += 1
                if pos_words >= 2:
                    positive_phrases.append(sentence[:100])
            elif neg_words > pos_words:
                negative_count += 1
                if neg_words >= 2:
                    negative_phrases.append(sentence[:100])
            else:
                neutral_count += 1
        
        total = positive_count + negative_count + neutral_count
        if total == 0:
            return 50.0, "neutral", [], []
        
        # Calculate sentiment score (0-100)
        sentiment_score = ((positive_count * 100) + (neutral_count * 50)) / total
        
        # Determine overall sentiment
        if positive_count > negative_count * 2:
            overall_sentiment = "positive"
        elif negative_count > positive_count * 2:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"
        
        return sentiment_score, overall_sentiment, positive_phrases, negative_phrases
    
    def _analyze_confidence(self, transcript: str) -> float:
        """Analyze confidence level from transcript."""
        transcript_lower = transcript.lower()
        
        high_count = sum(1 for phrase in self.confidence_indicators["high"] 
                        if phrase in transcript_lower)
        medium_count = sum(1 for phrase in self.confidence_indicators["medium"] 
                         if phrase in transcript_lower)
        low_count = sum(1 for phrase in self.confidence_indicators["low"] 
                       if phrase in transcript_lower)
        
        total = high_count + medium_count + low_count
        if total == 0:
            return 60.0  # Default neutral confidence
        
        # Calculate weighted confidence score
        confidence_score = (
            (high_count * 100) + 
            (medium_count * 60) + 
            (low_count * 30)
        ) / total
        
        # Adjust based on sentence structure
        # Longer, complete sentences indicate higher confidence
        sentences = self._split_into_sentences(transcript)
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        
        if avg_sentence_length > 15:
            confidence_score = min(100, confidence_score + 10)
        elif avg_sentence_length < 8:
            confidence_score = max(0, confidence_score - 10)
        
        return min(100, max(0, confidence_score))
    
    def _extract_key_topics(self, transcript: str) -> List[str]:
        """Extract key topics/keywords from transcript."""
        # Common technical and professional keywords
        topic_keywords = {
            "experience", "project", "team", "development", "software", "programming",
            "leadership", "management", "skills", "technology", "solution", "problem",
            "communication", "collaboration", "innovation", "learning", "growth",
            "achievement", "success", "challenge", "opportunity", "responsibility"
        }
        
        words = transcript.lower().split()
        found_topics = []
        
        for word in words:
            # Clean word
            clean_word = re.sub(r'[^a-z]', '', word)
            if clean_word in topic_keywords and clean_word not in found_topics:
                found_topics.append(clean_word.title())
        
        return found_topics
    
    def _calculate_clarity(self, transcript: str) -> float:
        """Calculate clarity score based on sentence structure."""
        sentences = self._split_into_sentences(transcript)
        
        if not sentences:
            return 50.0
        
        # Factors for clarity:
        # 1. Average sentence length (not too short, not too long)
        # 2. Use of filler words
        # 3. Coherence
        
        avg_length = sum(len(s.split()) for s in sentences) / len(sentences)
        
        # Optimal sentence length is 10-20 words
        if 10 <= avg_length <= 20:
            length_score = 100
        elif 8 <= avg_length < 10 or 20 < avg_length <= 25:
            length_score = 80
        else:
            length_score = 60
        
        # Check for filler words
        filler_words = ["um", "uh", "like", "you know", "basically", "actually", "literally"]
        transcript_lower = transcript.lower()
        filler_count = sum(transcript_lower.count(f) for f in filler_words)
        
        filler_penalty = min(30, filler_count * 5)
        
        return max(0, length_score - filler_penalty)
    
    def _calculate_enthusiasm(self, transcript: str) -> float:
        """Calculate enthusiasm score."""
        transcript_lower = transcript.lower()
        
        enthusiasm_words = {
            "excited", "passionate", "love", "enjoy", "thrilled", "eager",
            "enthusiastic", "motivated", "inspired", "fascinating", "amazing",
            "wonderful", "great opportunity", "looking forward"
        }
        
        count = sum(1 for word in enthusiasm_words if word in transcript_lower)
        
        # Base score + bonus for enthusiasm words
        base_score = 50
        bonus = min(50, count * 10)
        
        return base_score + bonus
    
    def _calculate_professionalism(self, transcript: str) -> float:
        """Calculate professionalism score."""
        transcript_lower = transcript.lower()
        
        # Professional language indicators
        professional_phrases = [
            "in my experience", "i have worked", "i was responsible",
            "i led", "i managed", "i collaborated", "i developed",
            "my expertise", "my skills", "professional development",
            "team collaboration", "project management", "stakeholders"
        ]
        
        # Unprofessional indicators
        unprofessional = ["hate", "stupid", "boring", "whatever", "don't care"]
        
        prof_count = sum(1 for phrase in professional_phrases if phrase in transcript_lower)
        unprof_count = sum(1 for word in unprofessional if word in transcript_lower)
        
        score = 60 + (prof_count * 5) - (unprof_count * 15)
        
        return min(100, max(0, score))

