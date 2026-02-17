'use client';

import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl rounded-bl-md bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
        />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
        />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">Recruiter is typing…</span>
    </motion.div>
  );
}
