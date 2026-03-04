'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import TypingIndicator from './TypingIndicator';
import type { ChatConversation, ChatMessage } from '@/store/useStore';

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
  onDeleteConversation?: () => void;
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
  onDeleteConversation,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-candidate-500/10 dark:bg-candidate-500/15 border border-candidate-500/20 flex items-center justify-center mb-5">
            <MessageSquare className="h-8 w-8 text-candidate-500/60" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No conversation selected</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6 leading-relaxed">
            Select a conversation to view messages, or apply to jobs to connect with recruiters.
          </p>
          <Link href="/candidate/jobs">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 hover:bg-candidate-600 text-white shadow-sm shadow-candidate-500/20 transition-colors"
            >
              Browse Jobs
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Link>
          <Link href="/candidate/jobs" className="mt-3 inline-flex items-center gap-1.5 text-xs text-candidate-600 dark:text-candidate-400 hover:underline">
            <Sparkles className="h-3.5 w-3.5" /> Discover opportunities
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
    <div className="flex-1 flex flex-col rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-candidate-500/10 dark:bg-candidate-500/15 border border-candidate-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-candidate-600 dark:text-candidate-400">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{displayName}</h3>
            {jobOrCompany && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
                {jobOrCompany}
              </p>
            )}
          </div>
        </div>
        {onDeleteConversation && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDeleteConversation}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
            title="Delete conversation"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 bg-gray-50/40 dark:bg-gray-950/20">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !showTypingIndicator ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <MessageSquare className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No messages yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Send a message to start the conversation</p>
            </motion.div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === currentUserId || !!msg.is_mine}
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
