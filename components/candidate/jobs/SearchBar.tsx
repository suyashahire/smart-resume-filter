'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search jobs, skills, or keywords…',
  className = '',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      <div className="relative group">
        {/* Soft glow on focus - ring appears when input is focused */}
        <div
          className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-candidate-500/0 via-candidate-500/10 to-cyan-500/0 opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300 pointer-events-none"
          aria-hidden
        />
        <div className="relative flex items-center">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-xl bg-candidate-500/10 dark:bg-candidate-500/20 text-candidate-600 dark:text-candidate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-14 pr-5 py-4 rounded-2xl text-sm sm:text-base border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/30 focus:border-candidate-500/50 dark:focus:border-candidate-500/50 transition-all duration-200 shadow-sm"
          />
        </div>
      </div>
    </motion.div>
  );
}
