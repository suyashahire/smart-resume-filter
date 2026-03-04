"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  ArrowLeft,
  Briefcase,
  ArrowRight,
  Mail,
  Check,
  FileText,
  X,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import * as api from "@/lib/api";
import { MessagesSkeleton } from "@/components/ui/Skeleton";

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
  read_at?: string | null;
}

interface Conversation {
  id: string;
  hr_user_id?: string;
  candidate_user_id?: string;
  candidate_user_name?: string;
  candidate_email?: string;
  job_id?: string;
  job_title?: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count_hr?: number;
}

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

const conversationFilters = [
  { value: "all", label: "All Chats" },
  { value: "unread", label: "Unread" },
];

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

// Conversation Item Component
interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  formatTime: (date: string) => string;
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
  onDelete,
  formatTime,
}: ConversationItemProps) {
  const hasUnread = (conversation.unread_count_hr || 0) > 0;
  const displayName =
    conversation.candidate_user_name || "Unknown Candidate";

  return (
    <motion.div
      onClick={onClick}
      className={`group relative flex items-start gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-all duration-150 ${
        isSelected
          ? "bg-primary-50 dark:bg-primary-950/30 border border-primary-200/60 dark:border-primary-800/40"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
      }`}
    >
      {/* Letter Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
          isSelected
            ? "bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/25"
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/60"
        }`}
      >
        {displayName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${
              hasUnread
                ? "font-semibold text-gray-900 dark:text-white"
                : "font-medium text-gray-700 dark:text-gray-300"
            }`}
          >
            {displayName}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>

        {conversation.job_title && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1 mt-0.5">
            <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
            {conversation.job_title}
          </p>
        )}

        <div className="flex items-center justify-between mt-0.5">
          <p
            className={`text-xs truncate ${
              hasUnread
                ? "text-gray-700 dark:text-gray-300 font-medium"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {conversation.last_message_preview || "No messages yet"}
          </p>
          {hasUnread && (
            <span className="px-1.5 py-0.5 bg-primary-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center flex-shrink-0 ml-2">
              {conversation.unread_count_hr}
            </span>
          )}
        </div>
      </div>

      {/* Delete on hover */}
      <button
        onClick={onDelete}
        className="absolute bottom-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        title="Delete conversation"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  formatTime: (date: string) => string;
}

function MessageBubble({
  message,
  isOwn,
  formatTime,
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? "bg-primary-500 text-white rounded-br-md"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200/60 dark:border-gray-700/60 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={`flex items-center justify-end gap-1 mt-1 ${
            isOwn ? "text-white/60" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          <span className="text-[10px]">{formatTime(message.sent_at)}</span>
          {isOwn &&
            (message.read_at ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            ))}
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

function MessageComposer({
  value,
  onChange,
  onSubmit,
  isSending,
  disabled,
}: MessageComposerProps) {
  const canSend = value.trim().length > 0 && !isSending && !disabled;

  return (
    <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
      {disabled ? (
        <div className="flex items-center justify-center py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Mail className="h-4 w-4 mr-2" />
          Messaging is currently unavailable
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 transition-all max-h-32"
            style={{ minHeight: "40px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSubmit(e);
              }
            }}
          />
          <motion.button
            type="submit"
            disabled={!canSend}
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.95 } : {}}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
              canSend
                ? "bg-primary-500 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/25"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
            }`}
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </motion.button>
        </form>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-500/10 dark:bg-primary-500/15 border border-primary-500/20 flex items-center justify-center mb-5">
        <MessageSquare className="h-8 w-8 text-primary-500/60" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Candidate Messages
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6 leading-relaxed">
        Select a conversation to view messages, or start a new one from the
        Results page.
      </p>
      <Link href="/results">
        <motion.span
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/20 transition-colors"
        >
          <FileText className="h-4 w-4" />
          View Candidates
          <ArrowRight className="h-4 w-4" />
        </motion.span>
      </Link>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function HRMessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateIdParam = searchParams.get("candidateId");
  const candidateNameParam = searchParams.get("name");
  const {
    user,
    isAuthenticated,
    isHydrated,
    conversations,
    setConversations,
    currentConversationMessages,
    setCurrentConversationMessages,
    addMessage,
  } = useStore();

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [candidateHandled, setCandidateHandled] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Real-time message updates via WebSocket
  useRealtimeUpdates({
    userId: user?.id,
    enabled: isAuthenticated && isHydrated,
    onEvent: useCallback(
      (event: any) => {
        if (event.type === "new_message") {
          const data = event.data as any;
          const currentConv = selectedConversationRef.current;
          if (
            currentConv &&
            currentConv.id !== "new" &&
            data.conversation_id === currentConv.id
          ) {
            api
              .getConversationMessages(currentConv.id)
              .then((res) => {
                setCurrentConversationMessages(res.messages || []);
              })
              .catch(() => {});
          }
          api
            .getConversations()
            .then((res) => {
              const hrConversations = (res.conversations || []).map(
                (c: any) => ({
                  ...c,
                  candidate_user_id:
                    c.other_user?.id || c.candidate_user_id,
                  candidate_user_name:
                    c.other_user?.name || c.candidate_user_name,
                  candidate_email:
                    c.other_user?.email || c.candidate_email,
                  unread_count_hr:
                    c.unread_count ?? c.unread_count_hr ?? 0,
                })
              );
              setConversations(hrConversations);
            })
            .catch(() => {});
        }

        // Typing indicator events
        if (event.type === "typing_started" || event.type === "typing_stopped") {
          const data = event.data as any;
          const currentConv = selectedConversationRef.current;
          if (currentConv && data.conversation_id === currentConv.id) {
            setShowTypingIndicator(event.type === "typing_started");
          }
        }

        // Read receipts — update check marks in real-time
        if (event.type === "messages_read") {
          const data = event.data as any;
          const currentConv = selectedConversationRef.current;
          if (currentConv && data.conversation_id === currentConv.id) {
            // Re-fetch messages to get updated read_at timestamps
            api
              .getConversationMessages(currentConv.id)
              .then((res) => {
                setCurrentConversationMessages(res.messages || []);
              })
              .catch(() => {});
          }
        }
      },
      [setConversations, setCurrentConversationMessages]
    ),
  });

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role === "candidate") {
      router.push("/candidate/messages");
      return;
    }
    fetchConversations();
  }, [isAuthenticated, isHydrated, user, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversationMessages]);

  useEffect(() => {
    if (!candidateIdParam || candidateHandled || isLoading || !conversations)
      return;
    const existing = conversations.find(
      (c: any) =>
        c.candidate_user_id === candidateIdParam ||
        c.other_user?.id === candidateIdParam
    );
    if (existing) {
      handleSelectConversation(existing as Conversation);
      setCandidateHandled(true);
    } else if (conversations.length >= 0) {
      const placeholder: Conversation = {
        id: "new",
        candidate_user_id: candidateIdParam,
        candidate_user_name: candidateNameParam || "Candidate",
        last_message_at: new Date().toISOString(),
        last_message_preview: "",
        unread_count_hr: 0,
      };
      setSelectedConversation(placeholder);
      setCurrentConversationMessages([]);
      setCandidateHandled(true);
    }
  }, [candidateIdParam, candidateHandled, isLoading, conversations]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getConversations();
      const hrConversations = (data.conversations || []).map((c: any) => ({
        ...c,
        candidate_user_id: c.other_user?.id || c.candidate_user_id,
        candidate_user_name: c.other_user?.name || c.candidate_user_name,
        candidate_email: c.other_user?.email || c.candidate_email,
        unread_count_hr: c.unread_count ?? c.unread_count_hr ?? 0,
      }));
      setConversations(hrConversations);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
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
        conversations.map((c) =>
          c.id === conversationId ? { ...c, unread_count_hr: 0 } : c
        )
      );
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await api.deleteConversation(conversationId);
      setConversations(conversations.filter((c) => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setCurrentConversationMessages([]);
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !selectedConversation ||
      !selectedConversation.candidate_user_id
    )
      return;

    try {
      setIsSending(true);
      const sentText = newMessage.trim();
      const message = await api.sendMessage(
        selectedConversation.candidate_user_id,
        sentText,
        selectedConversation.job_id
      );
      addMessage(message);
      setNewMessage("");

      if (selectedConversation.id === "new") {
        const data = await api.getConversations();
        const hrConversations = (data.conversations || []).map((c: any) => ({
          ...c,
          candidate_user_id: c.other_user?.id || c.candidate_user_id,
          candidate_user_name: c.other_user?.name || c.candidate_user_name,
          candidate_email: c.other_user?.email || c.candidate_email,
          unread_count_hr: c.unread_count ?? c.unread_count_hr ?? 0,
        }));
        setConversations(hrConversations);
        const newConv = hrConversations.find(
          (c: any) =>
            c.candidate_user_id === selectedConversation.candidate_user_id
        );
        if (newConv) {
          setSelectedConversation(newConv as Conversation);
        }
      } else {
        setConversations(
          conversations.map((c) =>
            c.id === selectedConversation.id
              ? {
                  ...c,
                  last_message_preview: sentText,
                  last_message_at: new Date().toISOString(),
                }
              : c
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      const errorMsg = err?.message || "Failed to send message";
      if (errorMsg.includes("Receiver not found")) {
        setSendError(
          "This candidate does not have a portal account. Use email to reach them instead."
        );
      } else if (errorMsg.includes("only message candidates")) {
        setSendError(
          "This user is not registered as a candidate on the portal."
        );
      } else {
        setSendError(errorMsg);
      }
      setTimeout(() => setSendError(null), 6000);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.candidate_user_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      c.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidate_email?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === "unread") {
      return matchesSearch && (c.unread_count_hr || 0) > 0;
    }
    return matchesSearch;
  });

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count_hr || 0),
    0
  );

  if (!isHydrated || isLoading) {
    return <MessagesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-8">
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Messages
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Communicate with candidates about their applications
          </p>
        </motion.div>

        {/* Chat Container */}
        <div className="h-[calc(100vh-200px)] flex gap-4">
          {/* ============================================================ */}
          {/* CONVERSATIONS SIDEBAR */}
          {/* ============================================================ */}
          <div
            className={`w-full md:w-[320px] lg:w-[340px] flex-shrink-0 flex flex-col rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden ${
              selectedConversation ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Conversations
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                      {totalUnread}
                    </span>
                  )}
                </h2>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 transition-all"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200/40 dark:border-gray-700/40">
                {conversationFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      activeFilter === filter.value
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {filter.label}
                    {filter.value === "unread" && totalUnread > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-primary-500/15 text-primary-600 dark:text-primary-400 text-[10px] font-bold rounded-full">
                        {totalUnread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto py-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-7 h-7 border-2 border-primary-200 dark:border-primary-800 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <MessageSquare className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {activeFilter === "unread"
                      ? "No unread messages"
                      : "No conversations yet"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {activeFilter === "unread"
                      ? "You're all caught up!"
                      : "Start from the Results page"}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={
                        selectedConversation?.id === conversation.id
                      }
                      onClick={() =>
                        handleSelectConversation(conversation)
                      }
                      onDelete={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(conversation.id);
                      }}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* CHAT PANEL */}
          {/* ============================================================ */}
          <div
            className={`flex-1 flex flex-col rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden ${
              selectedConversation ? "flex" : "hidden md:flex"
            }`}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors flex-shrink-0"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary-500/10 dark:bg-primary-500/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                        {(
                          selectedConversation.candidate_user_name ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {selectedConversation.candidate_user_name ||
                          "Unknown Candidate"}
                      </h3>
                      {selectedConversation.job_title && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                          <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
                          {selectedConversation.job_title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link href="/results">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="View Results"
                      >
                        <FileText className="h-4 w-4" />
                      </motion.button>
                    </Link>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setDeleteConfirm(selectedConversation.id)
                      }
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 bg-gray-50/40 dark:bg-gray-950/20">
                  <AnimatePresence>
                    {currentConversationMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          No messages yet
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Send a message to start the conversation
                        </p>
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

                {/* Send Error Banner */}
                <AnimatePresence>
                  {sendError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mx-3 mb-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-3"
                    >
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {sendError}
                        </p>
                        {selectedConversation?.candidate_email && (
                          <a
                            href={`mailto:${selectedConversation.candidate_email}`}
                            className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Email{" "}
                            {selectedConversation.candidate_user_name ||
                              "candidate"}{" "}
                            instead
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => setSendError(null)}
                        className="p-1 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Typing Indicator */}
                <AnimatePresence>
                  {showTypingIndicator && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="px-4 py-2"
                    >
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span>{selectedConversation?.candidate_user_name || 'Candidate'} is typing…</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message Composer */}
                <MessageComposer
                  value={newMessage}
                  onChange={(val) => {
                    setNewMessage(val);
                    // Emit typing indicator with debounce
                    if (selectedConversation && selectedConversation.id !== 'new') {
                      if (!isTypingRef.current) {
                        isTypingRef.current = true;
                        api.sendTypingIndicator(selectedConversation.id, true).catch(() => {});
                      }
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => {
                        isTypingRef.current = false;
                        if (selectedConversation) {
                          api.sendTypingIndicator(selectedConversation.id, false).catch(() => {});
                        }
                      }, 2000);
                    }
                  }}
                  onSubmit={(e) => {
                    // Stop typing indicator on send
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    if (isTypingRef.current && selectedConversation && selectedConversation.id !== 'new') {
                      isTypingRef.current = false;
                      api.sendTypingIndicator(selectedConversation.id, false).catch(() => {});
                    }
                    handleSendMessage(e);
                  }}
                  isSending={isSending}
                />
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm mx-4 border border-gray-200/60 dark:border-gray-700/60"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Chat
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will delete the conversation only for you. The other
                person will still be able to see it. A new message from
                either side will restore the conversation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConversation(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-lg shadow-red-500/25"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HRMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      }
    >
      <HRMessagesContent />
    </Suspense>
  );
}
