'use client';

import { MessageSquare, Search } from 'lucide-react';
import ConversationItem from './ConversationItem';
import type { ChatConversation } from '@/store/useStore';

const FILTERS = [
  { value: 'all', label: 'All Chats' },
  { value: 'unread', label: 'Unread' },
];

interface ConversationListProps {
  conversations: ChatConversation[];
  filteredConversations: ChatConversation[];
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  onFilterChange: (value: string) => void;
  onSelectConversation: (c: ChatConversation) => void;
  onDeleteConversation?: (conversationId: string) => void;
  formatTime: (date: string) => string;
  isLoading: boolean;
  totalUnread: number;
}

export default function ConversationList({
  filteredConversations,
  selectedId,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onSelectConversation,
  onDeleteConversation,
  formatTime,
  isLoading,
  totalUnread,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Messages
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-candidate-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
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
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/30 focus:border-candidate-500/40 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200/40 dark:border-gray-700/40">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                activeFilter === f.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f.label}
              {f.value === 'unread' && totalUnread > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-candidate-500/15 text-candidate-600 dark:text-candidate-400 text-[10px] font-bold rounded-full">
                  {totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-7 h-7 border-2 border-candidate-200 dark:border-candidate-800 border-t-candidate-500 rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <MessageSquare className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {activeFilter === 'unread' ? 'No unread messages' : 'No conversations yet'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {activeFilter === 'unread'
                ? "You're all caught up!"
                : 'Messages from recruiters will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredConversations.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isSelected={selectedId === c.id}
                onClick={() => onSelectConversation(c)}
                onDelete={
                  onDeleteConversation
                    ? (e) => {
                        e.stopPropagation();
                        onDeleteConversation(c.id);
                      }
                    : undefined
                }
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
