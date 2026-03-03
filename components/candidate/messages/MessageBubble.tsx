'use client';

import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '@/store/useStore';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  formatTime: (date: string) => string;
}

export default function MessageBubble({ message, isOwn, formatTime }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? 'bg-candidate-500 text-white rounded-br-md'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200/60 dark:border-gray-700/60 rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${
          isOwn ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
        }`}>
          <span className="text-[10px]">
            {formatTime(message.created_at ?? message.timestamp)}
          </span>
          {isOwn && (
            message.is_read
              ? <CheckCheck className="h-3 w-3" />
              : <Check className="h-3 w-3" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
