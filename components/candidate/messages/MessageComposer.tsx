'use client';

import { motion } from 'framer-motion';
import { Send, Paperclip, Smile, Mail } from 'lucide-react';

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSending: boolean;
  disabled?: boolean;
}

export default function MessageComposer({
  value,
  onChange,
  onSubmit,
  isSending,
  disabled = false,
}: MessageComposerProps) {
  return (
    <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md flex-shrink-0">
      {disabled ? (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60">
          <Mail className="h-4 w-4 flex-shrink-0" />
          Messaging is currently unavailable
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-candidate-500 hover:bg-candidate-500/10 dark:hover:bg-candidate-500/20 transition-colors flex-shrink-0"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </motion.button>

          <div className="flex-1 min-w-0">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Type your message…"
              rows={1}
              className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500/50 resize-none transition-all backdrop-blur-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-candidate-500 hover:bg-candidate-500/10 dark:hover:bg-candidate-500/20 transition-colors flex-shrink-0"
            aria-label="Emoji"
          >
            <Smile className="h-5 w-5" />
          </motion.button>

          <motion.button
            type="submit"
            disabled={!value.trim() || isSending}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="p-3 rounded-xl bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white shadow-md shadow-candidate-500/25 hover:shadow-lg hover:shadow-candidate-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
        </form>
      )}
    </div>
  );
}
