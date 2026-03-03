'use client';

import { motion } from 'framer-motion';
import { Trash2, Briefcase } from 'lucide-react';
import type { ChatConversation } from '@/store/useStore';

function getDisplayName(c: ChatConversation): string {
  return c.other_user?.name ?? (c as any).hr_user_name ?? 'Recruiter';
}

interface ConversationItemProps {
  conversation: ChatConversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  formatTime: (date: string) => string;
}

export default function ConversationItem({
  conversation,
  isSelected,
  onClick,
  onDelete,
  formatTime,
}: ConversationItemProps) {
  const displayName = getDisplayName(conversation);
  const hasUnread = (conversation.unread_count ?? 0) > 0;
  const lastMsg = conversation.last_message ?? conversation.last_message_preview ?? '';
  const lastTime = conversation.last_message_time ?? conversation.updated_at;

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'bg-candidate-50 dark:bg-candidate-950/30 border border-candidate-200/60 dark:border-candidate-800/40'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
        isSelected
          ? 'bg-candidate-500/15 text-candidate-600 dark:text-candidate-400 border border-candidate-500/25'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/60'
      }`}>
        {displayName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${
            hasUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'
          }`}>
            {displayName}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {lastTime && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {formatTime(lastTime)}
              </span>
            )}
          </div>
        </div>
        {conversation.job_title && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1 mt-0.5">
            <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
            {conversation.job_title}
          </p>
        )}
        <p className={`text-xs truncate mt-0.5 ${
          hasUnread ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {lastMsg || 'No messages yet'}
        </p>
      </div>

      {/* Unread badge */}
      {hasUnread && (
        <span className="absolute top-3 right-3 px-1.5 py-0.5 bg-candidate-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
          {conversation.unread_count}
        </span>
      )}

      {/* Delete button on hover */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute bottom-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          title="Delete conversation"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}
