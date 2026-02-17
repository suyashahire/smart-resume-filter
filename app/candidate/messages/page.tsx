'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
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
      (c.other_user?.name ?? (c as any).hr_user_name ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (c.job_title ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      ((c as any).company ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (activeFilter === 'unread') {
      const unread = c.unread_count_candidate ?? c.unread_count ?? 0;
      return matchesSearch && unread > 0;
    }
    if (activeFilter === 'interviews' || activeFilter === 'offers') {
      return matchesSearch;
    }
    return matchesSearch;
  });

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count_candidate ?? c.unread_count ?? 0),
    0
  );

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
              onNewMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              isSending={isSending}
              onBack={() => setSelectedConversation(null)}
              formatTime={formatTime}
              showTypingIndicator={showTypingIndicator}
            />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
