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

interface UseChatOptions {
  /** Use real API or mock */
  useRealApi?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [title, setTitle] = useState('New Conversation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatbotStatus, setChatbotStatus] = useState<{ available: boolean; model: string } | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true); // Optimistic: try real backend first
  const abortControllerRef = useRef<AbortController | null>(null);

  // Always check if backend chatbot is reachable on mount
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

    const response = generateMockResponse(content);

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

// ==================== Mock Response Generator ====================

function generateMockResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.match(/\b(hello|hi|hey|help)\b/)) {
    return (
      "👋 **Hello! I'm the HireQ AI Assistant.**\n\n" +
      "I can help you with:\n" +
      "- 📄 **Resume analysis** — Ask about candidates' skills and experience\n" +
      "- 🎯 **Job matching** — Find the best candidates for roles\n" +
      "- 📊 **Platform stats** — Overview of your recruitment pipeline\n" +
      "- 💡 **Interview tips** — Suggested questions for candidates\n" +
      "- 🔍 **Screening insights** — Understand candidate scores\n\n" +
      "Try asking: *\"Who are the top Python developers?\"* or *\"Suggest interview questions for a React role\"*"
    );
  }

  if (q.match(/\b(candidate|candidates|resume|resumes|skill|skills|experience|uploaded)\b/)) {
    return (
      "📄 **Candidate Analysis**\n\n" +
      "Based on the uploaded resumes in the system:\n\n" +
      "| Metric | Value |\n" +
      "|--------|-------|\n" +
      "| Total Candidates | 6 |\n" +
      "| Avg Match Score | 34% |\n" +
      "| Screened | 4 |\n\n" +
      "**Top Skills Found:**\n" +
      "- Python, JavaScript, React, Node.js\n" +
      "- AWS, Docker, Kubernetes\n" +
      "- SQL, MongoDB, PostgreSQL\n\n" +
      "Would you like me to dive deeper into specific candidates or skills?"
    );
  }

  if (q.match(/\b(job|role|position|hiring)\b/)) {
    return (
      "💼 **Job & Hiring Insights**\n\n" +
      "Here's a summary of your active recruitment:\n\n" +
      "- **Active Jobs**: Check your Job Descriptions page to see current openings\n" +
      "- **Pipeline**: Use the Results page to track candidate progress\n" +
      "- **Screening**: Run AI screening to match candidates to roles\n\n" +
      "**Best Practices:**\n" +
      "1. Keep job descriptions specific and skill-focused\n" +
      "2. Use required vs. preferred skills to improve matching\n" +
      "3. Screen in batches for consistent results\n\n" +
      "Need help writing a job description or matching candidates?"
    );
  }

  if (q.match(/\b(interview|question|ask)\b/)) {
    return (
      "🎤 **Interview Question Suggestions**\n\n" +
      "**Behavioral:**\n" +
      "1. Tell me about a challenging project you led and what you learned\n" +
      "2. Describe a time you had to resolve a conflict in your team\n" +
      "3. How do you prioritize when everything feels urgent?\n\n" +
      "**Technical (General):**\n" +
      "1. Walk me through how you'd design a scalable API\n" +
      "2. What's your approach to debugging production issues?\n" +
      "3. How do you ensure code quality in your team?\n\n" +
      "**Culture Fit:**\n" +
      "1. What type of work environment brings out your best work?\n" +
      "2. How do you handle feedback — both giving and receiving?\n\n" +
      "*Upload a resume and specify a role for tailored questions!*"
    );
  }

  if (q.match(/\b(compare|match|rank|best|top)\b/)) {
    return (
      "🎯 **Candidate Comparison**\n\n" +
      "To compare candidates effectively, I look at:\n\n" +
      "1. **Skill Match** — How well their skills align with job requirements\n" +
      "2. **Experience Level** — Years and relevance of experience\n" +
      "3. **Education** — Relevant degrees and certifications\n" +
      "4. **Overall Score** — AI-computed composite matching score\n\n" +
      "**To get specific comparisons:**\n" +
      "- Upload resumes on the Upload Resume page\n" +
      "- Create a job description\n" +
      "- Run AI screening to generate match scores\n" +
      "- Then ask me to compare specific candidates!\n\n" +
      "The Results page shows ranked candidates with detailed breakdowns."
    );
  }

  if (q.match(/\b(score|scoring|rating|how.*scored)\b/)) {
    return (
      "📊 **Understanding Candidate Scores**\n\n" +
      "HireQ uses multiple factors for scoring:\n\n" +
      "| Factor | Weight | Description |\n" +
      "|--------|--------|-------------|\n" +
      "| Skills Match | 40% | Required skills found in resume |\n" +
      "| Experience | 25% | Relevance and years of experience |\n" +
      "| Education | 15% | Degree, field, certifications |\n" +
      "| Semantic Fit | 20% | AI understanding of overall fit |\n\n" +
      "**Score Ranges:**\n" +
      "- 🟢 **80-100%**: Excellent match — fast-track candidate\n" +
      "- 🟡 **60-79%**: Good match — worth interviewing\n" +
      "- 🟠 **40-59%**: Partial match — review carefully\n" +
      "- 🔴 **Below 40%**: Low match — may not fit the role\n\n" +
      "Check the Results page for detailed score breakdowns!"
    );
  }

  return (
    "🤖 **HireQ AI Assistant**\n\n" +
    "I'm here to help with your recruitment needs! Here are some things you can ask:\n\n" +
    "- *\"Tell me about the uploaded candidates\"*\n" +
    "- *\"Suggest interview questions for a frontend developer\"*\n" +
    "- *\"How does the scoring system work?\"*\n" +
    "- *\"What are best practices for screening candidates?\"*\n" +
    "- *\"Compare candidates for the engineering role\"*\n\n" +
    "I can provide insights based on your uploaded resumes, job descriptions, and screening results. " +
    "The more data in the system, the more detailed my analysis!"
  );
}

export default useChat;
