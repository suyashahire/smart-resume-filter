'use client';

import { Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSending: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageComposer({
  value,
  onChange,
  onSubmit,
  isSending,
  disabled = false,
  placeholder = 'Type a message...',
}: MessageComposerProps) {
  const canSend = value.trim().length > 0 && !isSending && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3"
    >
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/30 focus:border-candidate-500/40 disabled:opacity-50 transition-all max-h-32"
          style={{ minHeight: '40px' }}
        />
        <motion.button
          type="submit"
          disabled={!canSend}
          whileHover={canSend ? { scale: 1.05 } : {}}
          whileTap={canSend ? { scale: 0.95 } : {}}
          className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
            canSend
              ? 'bg-candidate-500 hover:bg-candidate-600 text-white shadow-sm shadow-candidate-500/25'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <Send className="h-4 w-4" />
        </motion.button>
      </div>
    </form>
  );
}
