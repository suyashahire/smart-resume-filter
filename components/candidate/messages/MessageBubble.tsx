'use client';

import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '@/store/useStore';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  formatTime: (date: string) => string;
}

const BUBBLE_OWN =
  'bg-candidate-500 dark:bg-candidate-600 text-white rounded-2xl rounded-br-md shadow-sm shadow-candidate-500/20';
const BUBBLE_OTHER =
  'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white border border-gray-200/60 dark:border-gray-700/60 rounded-2xl rounded-bl-md';

export default function MessageBubble({ message, isOwn, formatTime }: MessageBubbleProps) {
  const read = !!message.read_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[78%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div className={`px-4 py-3 ${isOwn ? BUBBLE_OWN : BUBBLE_OTHER}`}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <div
          className={`flex items-center gap-1.5 mt-1.5 text-xs ${
            isOwn ? 'justify-end text-candidate-600/80 dark:text-candidate-400/80' : 'justify-start text-gray-500 dark:text-gray-400'
          }`}
        >
          <span>{formatTime(message.sent_at)}</span>
          {isOwn && (
            <span className="flex items-center" title={read ? 'Read' : 'Sent'}>
              {read ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
