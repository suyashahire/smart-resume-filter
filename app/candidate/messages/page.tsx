'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Search,
  User,
  Clock,
  CheckCheck,
  ArrowLeft,
  Briefcase,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  Filter,
  Sparkles,
  ArrowRight,
  Building,
  Mail,
  Calendar,
  Check,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

// ============================================================================
// INTERFACES
// ============================================================================

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sent_at: string;
  read_at: string | null;
}

interface Conversation {
  id: string;
  hr_user_id?: string;
  hr_user_name?: string;
  candidate_user_id?: string;
  job_id?: string;
  job_title?: string;
  company?: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count_candidate?: number;
}

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

const conversationFilters = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'interviews', label: 'Interviews' },
  { value: 'offers', label: 'Offers' },
];

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

// Conversation Item Component
interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  formatTime: (date: string) => string;
}

function ConversationItem({ conversation, isSelected, onClick, formatTime }: ConversationItemProps) {
  const hasUnread = (conversation.unread_count_candidate || 0) > 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full p-4 text-left transition-all duration-200 relative group ${
        isSelected
          ? 'bg-gradient-to-r from-candidate-500/10 to-cyan-500/10'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      {/* Active Indicator */}
      {isSelected && (
        <motion.div
          layoutId="activeConversation"
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-candidate-500 to-cyan-500 rounded-r-full"
        />
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md ${
            isSelected ? 'shadow-purple-500/25' : ''
          }`}>
            <User className="h-6 w-6 text-white" />
          </div>
          {/* Online Indicator (placeholder) */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold truncate ${
              hasUnread
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {conversation.hr_user_name || 'Unknown Recruiter'}
            </h3>
            <span className={`text-xs flex-shrink-0 ml-2 ${
              hasUnread
                ? 'text-candidate-600 dark:text-candidate-400 font-medium'
                : 'text-gray-500 dark:text-gray-500'
            }`}>
              {formatTime(conversation.last_message_at)}
            </span>
          </div>

          {/* Job/Company Info */}
          {(conversation.job_title || conversation.company) && (
            <div className="flex items-center gap-1.5 mb-1">
              <Building className="h-3 w-3 text-candidate-500" />
              <span className="text-xs text-candidate-600 dark:text-candidate-400 truncate">
                {conversation.job_title || conversation.company}
              </span>
            </div>
          )}

          {/* Last Message */}
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${
              hasUnread
                ? 'text-gray-800 dark:text-gray-200 font-medium'
                : 'text-gray-500 dark:text-gray-500'
            }`}>
              {conversation.last_message_preview || 'No messages yet'}
            </p>

            {/* Unread Badge */}
            {hasUnread && (
              <span className="w-5 h-5 bg-gradient-to-r from-candidate-500 to-cyan-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 ml-2 shadow-md shadow-candidate-500/25">
                {conversation.unread_count_candidate}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  formatTime: (date: string) => string;
}

function MessageBubble({ message, isOwn, formatTime }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`relative px-4 py-3 rounded-2xl ${
            isOwn
              ? 'bg-gradient-to-r from-candidate-500 to-cyan-500 text-white rounded-br-md shadow-lg shadow-candidate-500/20'
              : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white rounded-bl-md border border-gray-200/50 dark:border-gray-700/50'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <div className={`flex items-center gap-1.5 mt-1.5 text-xs text-gray-500 ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.sent_at)}</span>
          {isOwn && (
            <span className="flex items-center">
              {message.read_at ? (
                <CheckCheck className="h-3.5 w-3.5 text-candidate-500" />
              ) : (
                <Check className="h-3.5 w-3.5 text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Message Composer Component
interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSending: boolean;
  disabled?: boolean;
}

function MessageComposer({ value, onChange, onSubmit, isSending, disabled }: MessageComposerProps) {
  return (
    <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50">
      {disabled ? (
        <div className="flex items-center justify-center py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <Mail className="h-4 w-4 mr-2" />
          Messaging is currently unavailable
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex items-end gap-3">
          {/* Attachment Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 text-gray-500 hover:text-candidate-500 hover:bg-candidate-50 dark:hover:bg-candidate-900/20 rounded-xl transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </motion.button>

          {/* Input Field */}
          <div className="flex-1 relative">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 resize-none transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
            />
          </div>

          {/* Emoji Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 text-gray-500 hover:text-candidate-500 hover:bg-candidate-50 dark:hover:bg-candidate-900/20 rounded-xl transition-colors"
          >
            <Smile className="h-5 w-5" />
          </motion.button>

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={!value.trim() || isSending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-gradient-to-r from-candidate-500 to-cyan-500 text-white rounded-xl shadow-lg shadow-candidate-500/25 hover:shadow-xl hover:shadow-candidate-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
        </form>
      )}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  type: 'no-conversation' | 'no-messages';
}

function EmptyState({ type }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-candidate-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Icon */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-candidate-500/10 to-cyan-500/10 border border-candidate-200/50 dark:border-candidate-700/50 flex items-center justify-center mb-6 mx-auto">
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <MessageSquare className="h-12 w-12 text-candidate-500" />
          </motion.div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
          {type === 'no-conversation' ? 'Your Messages' : 'No messages yet'}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm mb-8">
          {type === 'no-conversation'
            ? 'Select a conversation to view messages, or apply to jobs to connect with recruiters.'
            : 'Start the conversation! Send a message to express your interest in the position.'}
        </p>

        {/* CTA */}
        {type === 'no-conversation' && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/candidate/jobs">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-candidate-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-candidate-500/25"
              >
                <Sparkles className="h-4 w-4" />
                Browse Jobs
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 bg-gray-400 rounded-full"
        />
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          className="w-2 h-2 bg-gray-400 rounded-full"
        />
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          className="w-2 h-2 bg-gray-400 rounded-full"
        />
      </div>
      <span className="text-xs text-gray-500">Recruiter is typing...</span>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CandidateMessagesPage() {
  const { user, conversations, setConversations, currentConversationMessages, setCurrentConversationMessages, addMessage } = useStore();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversationMessages]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const data = await api.getConversationMessages(conversationId);
      setCurrentConversationMessages(data.messages || []);

      await api.markMessagesAsRead(conversationId);

      setConversations(
        conversations.map(c =>
          c.id === conversationId
            ? { ...c, unread_count_candidate: 0 }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !selectedConversation.hr_user_id) return;

    try {
      setIsSending(true);
      const message = await api.sendMessage(
        selectedConversation.id,
        selectedConversation.hr_user_id,
        newMessage.trim()
      );

      addMessage(message);
      setNewMessage('');

      setConversations(
        conversations.map(c =>
          c.id === selectedConversation.id
            ? { ...c, last_message_preview: newMessage.trim(), last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const matchesSearch =
      c.hr_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.job_title?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'unread') {
      return matchesSearch && (c.unread_count_candidate || 0) > 0;
    }
    return matchesSearch;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count_candidate || 0), 0);

  return (
    <div className="min-h-[calc(100vh-140px)]">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-gray-50 to-candidate-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-candidate-950/20 -z-10" />

      <div className="h-[calc(100vh-140px)] flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50">
        {/* ================================================================ */}
        {/* CONVERSATIONS SIDEBAR */}
        {/* ================================================================ */}
        <div className={`w-full md:w-[340px] lg:w-[380px] border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col bg-white/50 dark:bg-gray-900/50 ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-candidate-500 to-cyan-500 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                Messages
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-candidate-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-md shadow-candidate-500/25">
                    {totalUnread}
                  </span>
                )}
              </h2>
            </div>

            {/* Search */}
            <div className="relative group mb-4">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-candidate-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-candidate-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              {conversationFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeFilter === filter.value
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-2 border-candidate-200 border-t-candidate-500 rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400 p-4">
                <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm text-center">No conversations yet</p>
                <p className="text-xs text-center mt-1 text-gray-400">Messages from recruiters will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation?.id === conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* CHAT PANEL */}
        {/* ================================================================ */}
        <div className={`flex-1 flex flex-col bg-gradient-to-br from-gray-50/50 to-candidate-50/20 dark:from-gray-900/50 dark:to-candidate-950/20 ${
          selectedConversation ? 'flex' : 'hidden md:flex'
        }`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/25">
                    <User className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.hr_user_name}
                    </h3>
                    {selectedConversation.job_title && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {selectedConversation.job_title}
                        {selectedConversation.company && ` at ${selectedConversation.company}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 text-gray-500 hover:text-candidate-500 hover:bg-candidate-50 dark:hover:bg-candidate-900/20 rounded-xl transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 text-gray-500 hover:text-candidate-500 hover:bg-candidate-50 dark:hover:bg-candidate-900/20 rounded-xl transition-colors"
                  >
                    <Video className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 text-gray-500 hover:text-candidate-500 hover:bg-candidate-50 dark:hover:bg-candidate-900/20 rounded-xl transition-colors"
                  >
                    <Info className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {currentConversationMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    currentConversationMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.sender_id === user?.id}
                        formatTime={formatTime}
                      />
                    ))
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <MessageComposer
                value={newMessage}
                onChange={setNewMessage}
                onSubmit={handleSendMessage}
                isSending={isSending}
              />
            </>
          ) : (
            <EmptyState type="no-conversation" />
          )}
        </div>
      </div>
    </div>
  );
}
