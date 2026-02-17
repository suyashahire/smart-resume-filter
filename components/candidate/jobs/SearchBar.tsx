'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  resultCount?: number;
  totalCount?: number;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search jobs, skills, or keywords…',
  className = '',
  resultCount,
  totalCount,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  /* ⌘K / Ctrl+K shortcut to focus */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      <div className="relative group">
        {/* Focus glow ring */}
        <div
          className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-candidate-500/20 via-candidate-400/10 to-cyan-500/20 blur transition-opacity duration-300 pointer-events-none ${focused ? 'opacity-100' : 'opacity-0'
            }`}
          aria-hidden
        />

        <div className="relative flex items-center">
          {/* Icon */}
          <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-candidate-500/10 dark:bg-candidate-500/20">
              <Search className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
            </span>
          </span>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className="w-full pl-16 pr-28 py-4 rounded-2xl text-sm sm:text-base
              border border-gray-200/60 dark:border-gray-700/60
              bg-white/70 dark:bg-gray-900/70 backdrop-blur-md
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-candidate-500/30 focus:border-candidate-500/50
              dark:focus:border-candidate-500/50
              transition-all duration-200 shadow-sm"
          />

          {/* Right side: clear button OR keyboard hint */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  inputRef.current?.focus();
                }}
                className="flex items-center justify-center w-7 h-7 rounded-lg
                  bg-gray-100 dark:bg-gray-800
                  hover:bg-gray-200 dark:hover:bg-gray-700
                  text-gray-500 dark:text-gray-400
                  transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-md
                bg-gray-100 dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                text-[11px] font-medium text-gray-400 dark:text-gray-500 select-none"
              >
                ⌘K
              </kbd>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
