'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRealtimeUpdates, RealtimeEvent } from '@/hooks/useRealtimeUpdates';
import * as api from '@/lib/api';
import { MessagesSkeleton } from '@/components/ui/Skeleton';
import type { ChatConversation } from '@/store/useStore';
import { ConversationList, ChatWindow } from '@/components/candidate/messages';

export default function CandidateMessagesPage() {
  const {
    user,
    conversations,
    setConversations,
    currentConversationMessages,
    setCurrentConversationMessages,
    addMessage,
  } = useStore();

  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const selectedConversationRef = useRef<ChatConversation | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Keep ref in sync for WebSocket callback
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Real-time message updates via WebSocket
  useRealtimeUpdates({
    userId: user?.id,
    enabled: !!user?.id,
    onEvent: useCallback((event: RealtimeEvent) => {
      if (event.type === 'new_message') {
        const data = event.data;
        const currentConv = selectedConversationRef.current;
        if (currentConv && data.conversation_id === currentConv.id) {
          api.getConversationMessages(currentConv.id).then(res => {
            setCurrentConversationMessages(res.messages || []);
          }).catch(() => {});
        }
        // Refresh conversation list
        api.getConversations().then(res => {
          setConversations(res.conversations || []);
        }).catch(() => {});
      }

      // Typing indicator events
      if (event.type === 'typing_started' || event.type === 'typing_stopped') {
        const data = event.data;
        const currentConv = selectedConversationRef.current;
        if (currentConv && data.conversation_id === currentConv.id) {
          setShowTypingIndicator(event.type === 'typing_started');
        }
      }

      // Read receipts — update check marks in real-time
      if (event.type === 'messages_read') {
        const data = event.data;
        const currentConv = selectedConversationRef.current;
        if (currentConv && data.conversation_id === currentConv.id) {
          api.getConversationMessages(currentConv.id).then(res => {
            setCurrentConversationMessages(res.messages || []);
          }).catch(() => {});
        }
      }
    }, [setConversations, setCurrentConversationMessages]),
  });

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      try {
        const data = await api.getConversationMessages(conversationId);
        setCurrentConversationMessages(data.messages || []);
        await api.markMessagesAsRead(conversationId);
        const fresh = await api.getConversations();
        setConversations(fresh.conversations || []);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    },
    [setConversations, setCurrentConversationMessages]
  );

  const handleSelectConversation = useCallback(
    (conversation: ChatConversation) => {
      setSelectedConversation(conversation);
      fetchMessages(conversation.id);
    },
    [fetchMessages]
  );

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await api.deleteConversation(conversationId);
      setConversations(conversations.filter(c => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setCurrentConversationMessages([]);
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const receiverId = selectedConversation?.other_user?.id ?? selectedConversation?.hr_user_id;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !receiverId) return;

    try {
      setIsSending(true);
      const message = await api.sendMessage(
        receiverId,
        newMessage.trim(),
        selectedConversation.job_id
      );
      const sentPreview = newMessage.trim();
      addMessage(message);
      setNewMessage('');
      setConversations(
        conversations.map((c) =>
          c.id === selectedConversation.id
            ? {
                ...c,
                last_message_preview: sentPreview,
                last_message_at: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      (c.other_user?.name ?? c.hr_user_name ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (c.job_title ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (c.company ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (activeFilter === 'unread') {
      const unread = c.unread_count_candidate ?? c.unread_count ?? 0;
      return matchesSearch && unread > 0;
    }
    return matchesSearch;
  });

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count_candidate ?? c.unread_count ?? 0),
    0
  );

  if (isLoading) {
    return <MessagesSkeleton />;
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col">
      <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 -z-10" />
      <div
        className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.05),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.03),transparent)]"
        aria-hidden
      />

      <div className="flex-1 flex min-h-0 gap-4 p-4 max-w-6xl mx-auto w-full">
        {/* Left: Conversations sidebar ~30% */}
        <aside
          className={`w-full flex-shrink-0 flex flex-col min-h-0 ${
            selectedConversation ? 'hidden md:flex md:w-[30%] md:max-w-[360px]' : 'flex md:w-[30%] md:max-w-[360px]'
          }`}
        >
          <ConversationList
            conversations={conversations}
            filteredConversations={filteredConversations}
            selectedId={selectedConversation?.id ?? null}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={(id) => setDeleteConfirm(id)}
            formatTime={formatTime}
            isLoading={isLoading}
            totalUnread={totalUnread}
          />
        </aside>

        {/* Soft divider */}
        <div
          className="hidden md:block w-px flex-shrink-0 bg-gray-200/80 dark:bg-gray-700/80"
          aria-hidden
        />

        {/* Right: Chat panel ~70% */}
        <main className="flex-1 flex min-w-0 min-h-0">
          <AnimatePresence mode="wait">
            <ChatWindow
              key={selectedConversation?.id ?? 'empty'}
              conversation={selectedConversation}
              messages={currentConversationMessages}
              currentUserId={user?.id}
              newMessage={newMessage}
              onNewMessageChange={(val) => {
                setNewMessage(val);
                // Emit typing indicator with debounce
                if (selectedConversation) {
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
              onSendMessage={(e) => {
                // Stop typing indicator on send
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (isTypingRef.current && selectedConversation) {
                  isTypingRef.current = false;
                  api.sendTypingIndicator(selectedConversation.id, false).catch(() => {});
                }
                handleSendMessage(e);
              }}
              isSending={isSending}
              onBack={() => setSelectedConversation(null)}
              formatTime={formatTime}
              showTypingIndicator={showTypingIndicator}
              onDeleteConversation={
                selectedConversation ? () => setDeleteConfirm(selectedConversation.id) : undefined
              }
            />
          </AnimatePresence>
        </main>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Chat</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will delete the conversation only for you. The other person will still be able to see it. A new message from either side will restore the conversation.
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
