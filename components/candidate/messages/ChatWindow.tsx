'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Briefcase,
  Phone,
  Video,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import TypingIndicator from './TypingIndicator';
import type { ChatConversation, ChatMessage } from '@/store/useStore';

const PANEL_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm flex flex-col min-h-0 overflow-hidden';

function getDisplayName(c: ChatConversation): string {
  return c.other_user?.name ?? (c as any).hr_user_name ?? 'Recruiter';
}

interface ChatWindowProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  currentUserId: string | undefined;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isSending: boolean;
  onBack: () => void;
  formatTime: (date: string) => string;
  composerDisabled?: boolean;
  showTypingIndicator?: boolean;
}

export default function ChatWindow({
  conversation,
  messages,
  currentUserId,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  isSending,
  onBack,
  formatTime,
  composerDisabled = false,
  showTypingIndicator = false,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className={`flex-1 flex flex-col ${PANEL_CLASS}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-candidate-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-candidate-500/10 dark:bg-candidate-500/20 border border-candidate-500/20 dark:border-candidate-500/30 flex items-center justify-center mb-6">
            <MessageSquare className="h-10 w-10 text-candidate-500 dark:text-candidate-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No messages yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
            Select a conversation to view messages, or apply to jobs to connect with recruiters.
          </p>
          <Link href="/candidate/jobs">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white shadow-sm shadow-candidate-500/20 transition-colors"
            >
              Apply to get noticed
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Link>
          <Link href="/candidate/jobs" className="mt-3 inline-flex items-center gap-2 text-sm text-candidate-600 dark:text-candidate-400 hover:underline">
            <Sparkles className="h-4 w-4" /> Browse jobs
          </Link>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(conversation);
  const jobOrCompany = conversation.job_title
    ? `${conversation.job_title}${(conversation as any).company ? ` at ${(conversation as any).company}` : ''}`
    : (conversation as any).company;

  return (
    <div className={`flex-1 flex flex-col ${PANEL_CLASS}`}>
      {/* Sticky chat header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors flex-shrink-0"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-11 h-11 rounded-xl bg-candidate-500/15 dark:bg-candidate-500/20 border border-candidate-500/30 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-candidate-600 dark:text-candidate-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h3>
            {jobOrCompany && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                <Briefcase className="h-3 w-3 flex-shrink-0" />
                {jobOrCompany}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl text-gray-500 hover:text-candidate-500 hover:bg-candidate-500/10 dark:hover:bg-candidate-500/20 transition-colors"
            aria-label="Call"
          >
            <Phone className="h-5 w-5" />
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl text-gray-500 hover:text-candidate-500 hover:bg-candidate-500/10 dark:hover:bg-candidate-500/20 transition-colors"
            aria-label="Video"
          >
            <Video className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !showTypingIndicator ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <MessageSquare className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No messages yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Send a message to start the conversation
              </p>
            </motion.div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === currentUserId || msg.is_mine}
                  formatTime={formatTime}
                />
              ))}
              {showTypingIndicator && <TypingIndicator />}
            </>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <MessageComposer
        value={newMessage}
        onChange={onNewMessageChange}
        onSubmit={onSendMessage}
        isSending={isSending}
        disabled={composerDisabled}
      />
    </div>
  );
}
