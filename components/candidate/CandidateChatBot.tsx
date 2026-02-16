'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Trash2, User, Sparkles, Brain,
  ChevronDown, Loader2, AlertCircle, Minimize2, Maximize2,
  ArrowUp, Zap, RotateCcw,
} from 'lucide-react';
import { useCandidateChat, ChatMessage } from '@/hooks/useCandidateChat';

// Simple Markdown-ish renderer for chat messages
function renderMarkdown(text: string) {
  // Split by newlines and process
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  const processInline = (line: string): JSX.Element[] => {
    const parts: JSX.Element[] = [];
    // Bold: **text**
    const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`t-${lastIndex}`}>{line.slice(lastIndex, match.index)}</span>);
      }
      if (match[1]) {
        parts.push(<strong key={`b-${match.index}`} className="font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(
          <code key={`c-${match.index}`} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-candidate-600 dark:text-candidate-400">
            {match[4]}
          </code>
        );
      } else if (match[5]) {
        parts.push(<em key={`i-${match.index}`} className="italic text-gray-500 dark:text-gray-400">{match[6]}</em>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      parts.push(<span key={`t-${lastIndex}`}>{line.slice(lastIndex)}</span>);
    }
    return parts.length > 0 ? parts : [<span key="full">{line}</span>];
  };

  const flushTable = () => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-2">
          <table className="min-w-full text-sm border-collapse">
            {tableHeaders.length > 0 && (
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="px-3 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300">
                      {h.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="border-b border-gray-100 dark:border-gray-800">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-gray-600 dark:text-gray-400">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').filter(c => c.trim() !== '');
      // Check if separator row
      if (cells.every(c => c.trim().match(/^[-:]+$/))) {
        continue; // Skip separator
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1">
          {processInline(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-base font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1">
          {processInline(line.slice(3))}
        </h3>
      );
      continue;
    }

    // Bullet points
    if (line.match(/^[-•*]\s/)) {
      elements.push(
        <div key={`li-${i}`} className="flex gap-2 ml-2 my-0.5">
          <span className="text-candidate-500 mt-0.5">•</span>
          <span className="text-gray-700 dark:text-gray-300">{processInline(line.replace(/^[-•*]\s/, ''))}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s/);
    if (numMatch) {
      elements.push(
        <div key={`ol-${i}`} className="flex gap-2 ml-2 my-0.5">
          <span className="text-candidate-500 font-semibold min-w-[1.2rem]">{numMatch[1]}.</span>
          <span className="text-gray-700 dark:text-gray-300">{processInline(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
      continue;
    }

    // Regular text
    elements.push(
      <p key={`p-${i}`} className="text-gray-700 dark:text-gray-300 my-0.5">
        {processInline(line)}
      </p>
    );
  }

  // Flush remaining table
  if (inTable) flushTable();

  return <>{elements}</>;
}

// Candidate-specific suggested questions
const SUGGESTIONS = [
  { text: "How can I improve my resume?", icon: "📄" },
  { text: "Tips for interview preparation", icon: "🎯" },
  { text: "What jobs match my skills?", icon: "💼" },
  { text: "How to stand out to recruiters?", icon: "⭐" },
];

export default function CandidateChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages, isLoading, error, sendMessage, clearChat, title, chatbotStatus } = useCandidateChat();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const modelLabel = chatbotStatus?.model?.includes('gemini') ? 'Gemini' : 'HireQ';

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-9 right-9 z-50 flex flex-col items-end gap-2"
          >
            {/* Message tooltip - only shows before first open */}
            <AnimatePresence>
              {!hasBeenOpened && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="relative mr-1"
                >
                  <div className="px-3.5 py-2 bg-gray-900/90 dark:bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 dark:border-gray-200/50">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-cyan-400 dark:text-cyan-500" />
                      <span className="text-xs font-semibold text-white dark:text-gray-900">HireQ AI</span>
                    </div>
                    <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">Career assistant</p>
                  </div>
                  {/* Arrow pointing down */}
                  <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-gray-900/90 dark:bg-white/95 rotate-45 border-r border-b border-gray-700/50 dark:border-gray-200/50" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat bubble button - Teal gradient for candidate portal */}
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsOpen(true);
                setHasBeenOpened(true);
              }}
              className="group"
            >
              <div className="relative w-16 h-16 text-white shadow-xl shadow-candidate-500/25 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-candidate-500/40">
                {/* Chat bubble shape - Teal gradient */}
                <svg viewBox="0 0 64 64" fill="none" className="absolute inset-0 w-full h-full drop-shadow-lg">
                  <defs>
                    <linearGradient id="chatBubbleGradCandidate" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0d9488" />
                      <stop offset="1" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <path d="M8 8C8 4.69 10.69 2 14 2H50C53.31 2 56 4.69 56 8V40C56 43.31 53.31 46 50 46H28L16 58V46H14C10.69 46 8 43.31 8 40V8Z" fill="url(#chatBubbleGradCandidate)" />
                </svg>
                {/* Brain logo centered in bubble */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '12px' }}>
                  <Brain className="h-7 w-7" />
                </div>
                {/* Status dot */}
                <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-900" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-50 flex flex-col overflow-hidden backdrop-blur-xl ${
              isExpanded
                ? 'bottom-4 right-4 left-4 top-4 md:left-auto md:top-4 md:w-[640px] md:h-auto rounded-3xl'
                : 'bottom-9 right-9 w-[400px] h-[580px] max-h-[85vh] rounded-3xl'
            }`}
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(148, 163, 184, 0.1)',
            }}
          >
            {/* Dark mode background */}
            <div className="absolute inset-0 dark:block hidden rounded-3xl" style={{
              background: 'linear-gradient(145deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.08)',
            }} />
            
            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-3.5 flex-shrink-0 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  {/* Chat bubble shape - Teal gradient */}
                  <svg viewBox="0 0 40 40" fill="none" className="absolute inset-0 w-full h-full">
                    <defs>
                      <linearGradient id="headerBubbleGradCandidate" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0d9488" />
                        <stop offset="1" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <path d="M5 5C5 2.79 6.79 1 9 1H31C33.21 1 35 2.79 35 5V27C35 29.21 33.21 31 31 31H18L11 38V31H9C6.79 31 5 29.21 5 27V5Z" fill="url(#headerBubbleGradCandidate)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '6px' }}>
                    <Brain className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">HireQ AI</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    {messages.length > 0 ? title : `Powered by ${modelLabel}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title={isExpanded ? 'Minimize' : 'Expand'}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => { clearChat(); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="New chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="relative flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">
              {/* Welcome Screen */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-6">
                  {/* Animated Logo - Teal gradient */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="relative mb-5"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-600 via-candidate-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-candidate-500/25">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-600"
                    />
                  </motion.div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                    How can I help?
                  </h3>
                  <p className="text-[13px] text-gray-400 dark:text-gray-500 max-w-[260px] mb-6 leading-relaxed">
                    Get career advice, resume tips, interview prep, and job search guidance.
                  </p>

                  {/* Suggestion Cards */}
                  <div className="grid grid-cols-2 gap-2 w-full max-w-[330px]">
                    {SUGGESTIONS.map((suggestion, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSuggestion(suggestion.text)}
                        className="text-left text-xs px-3.5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:border-candidate-400/40 hover:bg-candidate-50/60 dark:hover:bg-candidate-900/15 transition-all duration-200 group"
                      >
                        <span className="text-sm mb-1 block">{suggestion.icon}</span>
                        <span className="leading-snug">{suggestion.text}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-900/15 text-red-600 dark:text-red-400 rounded-2xl text-xs border border-red-100 dark:border-red-900/30"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom */}
            {messages.length > 4 && (
              <button
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute bottom-[80px] left-1/2 -translate-x-1/2 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
              >
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            )}

            {/* Input Area */}
            <div className="relative px-4 py-3 flex-shrink-0 border-t border-gray-100 dark:border-gray-800/60">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    rows={1}
                    className="w-full resize-none bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 rounded-2xl px-4 py-2.5 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/30 focus:border-candidate-400/50 max-h-[120px] transition-all"
                    disabled={isLoading}
                  />
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-1.5 w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-candidate-600 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5" />
                    )}
                  </motion.button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Zap className="h-3 w-3 text-cyan-400" />
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {modelLabel} AI — Shift+Enter for new line
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ==================== Message Bubble ====================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-teal-600 to-candidate-600 ring-2 ring-teal-100 dark:ring-teal-900/30'
          : 'bg-gradient-to-br from-emerald-500 to-teal-500 ring-2 ring-emerald-100 dark:ring-emerald-900/30'
      }`}>
        {isUser ? (
          <User className="h-3.5 w-3.5 text-white" />
        ) : (
          <Brain className="h-3.5 w-3.5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-teal-600 to-candidate-600 text-white rounded-tr-md shadow-sm shadow-teal-500/10'
            : 'bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/40 rounded-tl-md'
        }`}>
          {message.isLoading ? (
            <div className="flex items-center gap-2.5 py-0.5">
              <div className="flex gap-1">
                <motion.div
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
                />
                <motion.div
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.15 }}
                  className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
                />
                <motion.div
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
                  className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
                />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">Thinking...</span>
            </div>
          ) : isUser ? (
            <p>{message.content}</p>
          ) : (
            renderMarkdown(message.content)
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((source, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-candidate-50 dark:bg-candidate-900/15 text-candidate-600 dark:text-candidate-400 border border-candidate-100 dark:border-candidate-800/40 font-medium"
              >
                {source.type === 'resume' ? '📄' : '💼'} {source.name}
                <span className="opacity-50">{Math.round(source.relevance * 100)}%</span>
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] text-gray-300 dark:text-gray-600 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}
