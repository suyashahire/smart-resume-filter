'use client';

import { motion } from 'framer-motion';
import { User, Building } from 'lucide-react';
import type { ChatConversation } from '@/store/useStore';

const CARD_CLASS =
  'w-full text-left p-4 rounded-xl border border-transparent transition-all duration-200';

interface ConversationItemProps {
  conversation: ChatConversation;
  isSelected: boolean;
  onClick: () => void;
  formatTime: (date: string) => string;
}

function getDisplayName(c: ChatConversation): string {
  return c.other_user?.name ?? (c as any).hr_user_name ?? 'Recruiter';
}

export default function ConversationItem({
  conversation,
  isSelected,
  onClick,
  formatTime,
}: ConversationItemProps) {
  const unread = (conversation.unread_count_candidate ?? conversation.unread_count ?? 0) > 0;
  const displayName = getDisplayName(conversation);
  const jobOrCompany = conversation.job_title || (conversation as any).company;
  const preview = conversation.last_message_preview || 'No messages yet';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      className={`${CARD_CLASS} relative group ${
        isSelected
          ? 'bg-candidate-500/10 dark:bg-candidate-500/15 border-candidate-500/30 dark:border-candidate-500/30 shadow-sm shadow-candidate-500/10'
          : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:border-gray-200/60 dark:hover:border-gray-700/60'
      }`}
    >
      {isSelected && (
        <motion.div
          layoutId="activeConversation"
          className="absolute left-0 top-2 bottom-2 w-1 bg-candidate-500 dark:bg-candidate-400 rounded-r-full"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
        />
      )}

      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isSelected
                ? 'bg-candidate-500/20 dark:bg-candidate-500/25 border border-candidate-500/30 shadow-sm shadow-candidate-500/15'
                : 'bg-gray-200/80 dark:bg-gray-700/80 border border-gray-200/60 dark:border-gray-600/60'
            }`}
          >
            <User className="h-5 w-5 text-candidate-600 dark:text-candidate-400" />
          </div>
          {unread && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-candidate-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
              {conversation.unread_count_candidate ?? conversation.unread_count ?? 1}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span
              className={`font-semibold truncate text-sm ${
                unread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {displayName}
            </span>
            <span
              className={`text-xs flex-shrink-0 ${
                unread ? 'text-candidate-600 dark:text-candidate-400 font-medium' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {formatTime(conversation.last_message_at)}
            </span>
          </div>
          {jobOrCompany && (
            <div className="flex items-center gap-1.5 mb-1">
              <Building className="h-3 w-3 text-candidate-500 flex-shrink-0" />
              <span className="text-xs text-candidate-600 dark:text-candidate-400 truncate">
                {jobOrCompany}
              </span>
            </div>
          )}
          <p
            className={`text-sm truncate ${
              unread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {preview}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
