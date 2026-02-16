'use client';

import { motion } from 'framer-motion';
import { statusFilterOptions } from './statusConfig';

interface FilterTabsProps {
  value: string;
  onChange: (value: string) => void;
  counts: Record<string, number>;
  totalCount: number;
  className?: string;
}

export default function FilterTabs({
  value,
  onChange,
  counts,
  totalCount,
  className = '',
}: FilterTabsProps) {
  return (
    <div
      className={`flex items-center gap-0.5 p-1 rounded-xl bg-gray-100/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 ${className}`}
      role="tablist"
    >
      {statusFilterOptions.map((option) => {
        const count = option.value === '' ? totalCount : counts[option.value] ?? 0;
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`relative px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 focus-visible:ring-offset-1 ${
              isActive
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="applicationsFilterActive"
                className="absolute inset-0 rounded-lg bg-candidate-500 dark:bg-candidate-600 shadow-md shadow-candidate-500/25 dark:shadow-candidate-600/20"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.label}
              {count > 0 && (
                <span
                  className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
