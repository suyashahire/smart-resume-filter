'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Search } from 'lucide-react';
import ConversationItem from './ConversationItem';
import type { ChatConversation } from '@/store/useStore';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'interviews', label: 'Interviews' },
  { value: 'offers', label: 'Offers' },
];

const PANEL_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

interface ConversationListProps {
  conversations: ChatConversation[];
  filteredConversations: ChatConversation[];
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  onFilterChange: (value: string) => void;
  onSelectConversation: (c: ChatConversation) => void;
  formatTime: (date: string) => string;
  isLoading: boolean;
  totalUnread: number;
}

export default function ConversationList({
  conversations,
  filteredConversations,
  selectedId,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onSelectConversation,
  formatTime,
  isLoading,
  totalUnread,
}: ConversationListProps) {
  return (
    <div className={`flex flex-col h-full min-h-0 ${PANEL_CLASS} overflow-hidden`}>
      <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-candidate-500/20 dark:bg-candidate-500/25 border border-candidate-500/30 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
            </span>
            Messages
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-candidate-500 text-white text-xs font-bold rounded-full">
                {totalUnread}
              </span>
            )}
          </h2>
        </div>

        <div className="relative group mb-4">
          <div className="absolute -inset-0.5 rounded-xl bg-candidate-500/0 group-focus-within:bg-candidate-500/10 blur transition-all duration-300 pointer-events-none" />
          <div className="relative flex items-center">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 group-focus-within:text-candidate-500 transition-colors">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500/50 backdrop-blur-sm transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeFilter === f.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-candidate-200 dark:border-candidate-800 border-t-candidate-500 rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <MessageSquare className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No conversations yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Messages from recruiters will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isSelected={selectedId === c.id}
                onClick={() => onSelectConversation(c)}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
