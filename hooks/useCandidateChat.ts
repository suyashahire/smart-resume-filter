'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    type: string;
    id: string;
    name: string;
    relevance: number;
  }>;
  isLoading?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  title: string;
  isLoading: boolean;
  error: string | null;
}

export function useCandidateChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [title, setTitle] = useState('New Conversation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatbotStatus, setChatbotStatus] = useState<{ available: boolean; model: string } | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if backend chatbot is reachable on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/chat/status`, { signal: AbortSignal.timeout(3000) })
      .then(res => res.json())
      .then(data => {
        setChatbotStatus(data.chatbot);
        setBackendAvailable(true);
      })
      .catch(() => {
        setChatbotStatus({ available: false, model: 'offline' });
        setBackendAvailable(false);
      });
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add loading placeholder for assistant
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    // Always try real backend first, fall back to mock if unavailable
    if (backendAvailable) {
      await sendRealMessage(content.trim(), loadingMessage.id);
    } else {
      await sendMockMessage(content.trim(), loadingMessage.id);
    }
  }, [isLoading, backendAvailable, conversationId]);

  const sendRealMessage = async (content: string, loadingId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      const endpoint = token 
        ? `${API_BASE_URL}/chat/message`
        : `${API_BASE_URL}/chat/message/anonymous`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: content,
          conversation_id: conversationId,
          context: 'candidate', // Tell backend this is from candidate portal
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Replace loading message with actual response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        sources: data.sources || [],
      };

      setMessages(prev =>
        prev.map(msg => (msg.id === loadingId ? assistantMessage : msg))
      );

      if (data.conversation_id && data.conversation_id !== 'anonymous') {
        setConversationId(data.conversation_id);
      }
      if (data.title) {
        setTitle(data.title);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      
      console.warn('Real backend failed, falling back to mock:', err.message);
      setBackendAvailable(false);
      // Fall back to mock response instead of showing error
      await sendMockMessage(content, loadingId);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMockMessage = async (content: string, loadingId: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const response = generateCandidateMockResponse(content);

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      sources: [],
    };

    setMessages(prev =>
      prev.map(msg => (msg.id === loadingId ? assistantMessage : msg))
    );
    setIsLoading(false);

    // Generate title from first message
    if (messages.length === 0) {
      const words = content.split(' ').slice(0, 4).join(' ');
      setTitle(words + (content.split(' ').length > 4 ? '...' : ''));
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setTitle('New Conversation');
    setError(null);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      // Remove loading messages
      setMessages(prev => prev.filter(msg => !msg.isLoading));
    }
  }, []);

  return {
    messages,
    conversationId,
    title,
    isLoading,
    error,
    chatbotStatus,
    sendMessage,
    clearChat,
    cancelRequest,
  };
}

// ==================== Candidate-Specific Mock Response Generator ====================

function generateCandidateMockResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.match(/\b(hello|hi|hey|help)\b/)) {
    return (
      "👋 **Hello! I'm the HireQ Career Assistant.**\n\n" +
      "I'm here to help you succeed in your job search! I can assist with:\n\n" +
      "- 📄 **Resume tips** — Improve your resume to stand out\n" +
      "- 🎯 **Interview prep** — Practice questions and strategies\n" +
      "- 💼 **Job search** — Find opportunities that match your skills\n" +
      "- 📊 **Application tracking** — Understand your application status\n" +
      "- ⭐ **Career advice** — Growth tips and skill development\n\n" +
      "Try asking: *\"How can I improve my resume?\"* or *\"What should I prepare for interviews?\"*"
    );
  }

  if (q.match(/\b(resume|cv|improve|better|tips|format)\b/)) {
    return (
      "📄 **Resume Improvement Tips**\n\n" +
      "Here are key strategies to make your resume stand out:\n\n" +
      "**1. Strong Opening**\n" +
      "- Write a compelling professional summary (2-3 sentences)\n" +
      "- Highlight your most relevant skills immediately\n\n" +
      "**2. Quantify Your Impact**\n" +
      "- Use numbers: *\"Increased sales by 25%\"* vs *\"Improved sales\"*\n" +
      "- Show scale: *\"Managed team of 8\"* vs *\"Managed team\"*\n\n" +
      "**3. Tailor to Each Job**\n" +
      "- Match keywords from the job description\n" +
      "- Reorder skills based on job requirements\n\n" +
      "**4. Keep It Clean**\n" +
      "- Use consistent formatting\n" +
      "- Stick to 1-2 pages max\n" +
      "- Use clear section headers\n\n" +
      "**5. Action Verbs**\n" +
      "- Start bullets with: Led, Developed, Achieved, Implemented, Designed\n\n" +
      "Would you like specific tips for a particular section of your resume?"
    );
  }

  if (q.match(/\b(interview|prepare|question|practice)\b/)) {
    return (
      "🎯 **Interview Preparation Guide**\n\n" +
      "**Common Questions to Prepare:**\n\n" +
      "**Behavioral:**\n" +
      "1. *Tell me about yourself* — Keep it 2 minutes, focus on career journey\n" +
      "2. *Why do you want this job?* — Show genuine interest and alignment\n" +
      "3. *Describe a challenge you overcame* — Use STAR method\n\n" +
      "**Technical (if applicable):**\n" +
      "- Review fundamentals of your field\n" +
      "- Practice coding/problem-solving if relevant\n" +
      "- Prepare to discuss past projects in detail\n\n" +
      "**The STAR Method:**\n" +
      "| Component | What to Include |\n" +
      "|-----------|------------------|\n" +
      "| **S**ituation | Context and background |\n" +
      "| **T**ask | Your responsibility |\n" +
      "| **A**ction | Steps you took |\n" +
      "| **R**esult | Outcome with numbers |\n\n" +
      "**Pro Tips:**\n" +
      "- Research the company thoroughly\n" +
      "- Prepare 3-5 questions to ask them\n" +
      "- Practice with a friend or mirror\n" +
      "- Have stories ready for common scenarios\n\n" +
      "Would you like me to help you practice with mock questions?"
    );
  }

  if (q.match(/\b(job|jobs|match|find|search|opportunity|opportunities)\b/)) {
    return (
      "💼 **Job Search Strategies**\n\n" +
      "Here's how to find the right opportunities:\n\n" +
      "**1. Optimize Your Profile**\n" +
      "- Complete 100% of your HireQ profile\n" +
      "- Upload an updated resume\n" +
      "- Add all relevant skills\n\n" +
      "**2. Smart Searching**\n" +
      "- Use specific keywords for your role\n" +
      "- Filter by location, salary, and job type\n" +
      "- Check the \"For You\" section for AI-matched jobs\n\n" +
      "**3. Application Quality > Quantity**\n" +
      "- Tailor each application\n" +
      "- Write custom cover letters\n" +
      "- Research each company before applying\n\n" +
      "**4. Track Your Applications**\n" +
      "- Monitor status in your Dashboard\n" +
      "- Follow up appropriately\n" +
      "- Note interview dates and feedback\n\n" +
      "**Your Match Score:**\n" +
      "Jobs show a match percentage based on your skills and experience. Focus on roles with 60%+ match for best results!\n\n" +
      "Browse available jobs in the \"Jobs\" section to see what matches your profile!"
    );
  }

  if (q.match(/\b(stand out|recruiter|noticed|attention|differentiate)\b/)) {
    return (
      "⭐ **How to Stand Out to Recruiters**\n\n" +
      "**1. First Impressions Matter**\n" +
      "- Professional profile photo\n" +
      "- Compelling headline/title\n" +
      "- Error-free resume and applications\n\n" +
      "**2. Show, Don't Just Tell**\n" +
      "- Include portfolio links or project examples\n" +
      "- Add measurable achievements\n" +
      "- Highlight unique experiences\n\n" +
      "**3. Keywords Are Key**\n" +
      "- Match industry terminology\n" +
      "- Include relevant certifications\n" +
      "- List specific tools and technologies\n\n" +
      "**4. Be Proactive**\n" +
      "- Apply early to new postings\n" +
      "- Send thoughtful messages to recruiters\n" +
      "- Follow up professionally\n\n" +
      "**5. Build Your Brand**\n" +
      "- Consistent online presence\n" +
      "- Engage with industry content\n" +
      "- Get recommendations from colleagues\n\n" +
      "**What Recruiters Look For:**\n" +
      "| Factor | Weight |\n" +
      "|--------|--------|\n" +
      "| Relevant Skills | High |\n" +
      "| Experience Match | High |\n" +
      "| Culture Fit Signals | Medium |\n" +
      "| Career Progression | Medium |\n" +
      "| Communication | High |\n\n" +
      "Your HireQ profile completeness directly impacts your visibility to recruiters!"
    );
  }

  if (q.match(/\b(application|status|pending|screening|rejected|offer)\b/)) {
    return (
      "📊 **Understanding Application Status**\n\n" +
      "Here's what each status means:\n\n" +
      "| Status | Meaning |\n" +
      "|--------|----------|\n" +
      "| 🔵 **Pending** | Application received, awaiting review |\n" +
      "| 🟡 **Screening** | Resume being evaluated |\n" +
      "| 🟣 **Interview** | Selected for interview round |\n" +
      "| 🟢 **Offer** | Job offer extended! |\n" +
      "| ⚫ **Rejected** | Not moving forward |\n\n" +
      "**Timeline Expectations:**\n" +
      "- Initial review: 1-2 weeks\n" +
      "- Screening: 1-3 weeks\n" +
      "- Interview scheduling: 1-2 weeks\n" +
      "- Offer decision: 1-2 weeks after final interview\n\n" +
      "**Tips:**\n" +
      "- Be patient but proactive\n" +
      "- Follow up after 1-2 weeks if no response\n" +
      "- Keep applying to other opportunities\n" +
      "- Rejection isn't failure — it's redirection!\n\n" +
      "Check your Dashboard to see all your applications and their current status."
    );
  }

  if (q.match(/\b(skill|skills|learn|grow|development|career)\b/)) {
    return (
      "🚀 **Career Growth & Skill Development**\n\n" +
      "**In-Demand Skills for 2024:**\n" +
      "- AI/Machine Learning basics\n" +
      "- Data analysis\n" +
      "- Cloud computing (AWS, Azure, GCP)\n" +
      "- Communication & collaboration\n" +
      "- Project management\n\n" +
      "**How to Upskill:**\n" +
      "1. **Online Courses** — Coursera, Udemy, LinkedIn Learning\n" +
      "2. **Certifications** — Industry-recognized credentials\n" +
      "3. **Projects** — Build portfolio pieces\n" +
      "4. **Networking** — Learn from peers and mentors\n" +
      "5. **Reading** — Stay updated with industry trends\n\n" +
      "**Identify Skill Gaps:**\n" +
      "- Review job postings for roles you want\n" +
      "- Note requirements you're missing\n" +
      "- Prioritize skills that appear frequently\n\n" +
      "**Your Profile Tip:**\n" +
      "Add new skills to your HireQ profile as you learn them. This improves your match scores and visibility!\n\n" +
      "What specific skills or career area would you like to focus on?"
    );
  }

  if (q.match(/\b(salary|negotiate|pay|compensation|benefits)\b/)) {
    return (
      "💰 **Salary Negotiation Tips**\n\n" +
      "**Do Your Research:**\n" +
      "- Use Glassdoor, Levels.fyi, PayScale\n" +
      "- Consider location cost-of-living\n" +
      "- Factor in your experience level\n\n" +
      "**When to Negotiate:**\n" +
      "- After receiving an offer (not during interviews)\n" +
      "- When you have competing offers\n" +
      "- If the offer is below market rate\n\n" +
      "**How to Negotiate:**\n" +
      "1. Express enthusiasm first\n" +
      "2. Present your case with data\n" +
      "3. Give a specific number (not a range)\n" +
      "4. Be prepared to discuss total compensation\n\n" +
      "**Beyond Base Salary:**\n" +
      "| Benefit | Consider |\n" +
      "|---------|----------|\n" +
      "| Bonus | Annual, signing, performance |\n" +
      "| Equity | Stock options, RSUs |\n" +
      "| PTO | Vacation, sick days |\n" +
      "| Remote | Flexibility, WFH stipend |\n" +
      "| Growth | Learning budget, promotions |\n\n" +
      "**Sample Script:**\n" +
      "*\"Thank you for the offer! I'm excited about this opportunity. Based on my research and experience, I was hoping we could discuss a salary closer to [X]. Is there flexibility here?\"*"
    );
  }

  // Default response
  return (
    "🤖 **HireQ Career Assistant**\n\n" +
    "I'm here to support your job search journey! Here are some topics I can help with:\n\n" +
    "- 📄 *\"How can I improve my resume?\"*\n" +
    "- 🎯 *\"Help me prepare for interviews\"*\n" +
    "- 💼 *\"What jobs match my skills?\"*\n" +
    "- ⭐ *\"How do I stand out to recruiters?\"*\n" +
    "- 📊 *\"What does my application status mean?\"*\n" +
    "- 🚀 *\"What skills should I develop?\"*\n" +
    "- 💰 *\"Tips for salary negotiation\"*\n\n" +
    "I can provide personalized advice based on your profile, applications, and career goals. " +
    "The more complete your profile, the better I can help!"
  );
}

export default useCandidateChat;
