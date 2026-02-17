'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, Bell, User, Search, ArrowRight } from 'lucide-react';

interface JobsEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export default function JobsEmptyState({
  hasFilters,
  onClearFilters,
  className = '',
}: JobsEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative ${className}`}
    >
      <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg shadow-sm overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-candidate-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" aria-hidden />

        <div className="relative flex flex-col items-center justify-center py-16 px-6 text-center">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-candidate-400/15 to-purple-400/15 blur-lg" />
            <div className="relative w-16 h-16 rounded-2xl
              bg-gradient-to-br from-candidate-500/10 to-purple-500/10
              dark:from-candidate-500/20 dark:to-purple-500/20
              border border-candidate-200/40 dark:border-candidate-700/30
              flex items-center justify-center"
            >
              {hasFilters ? (
                <Search className="h-7 w-7 text-candidate-500 dark:text-candidate-400" />
              ) : (
                <Briefcase className="h-7 w-7 text-candidate-500 dark:text-candidate-400" />
              )}
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">
            {hasFilters ? 'No jobs match your filters' : 'No jobs yet — but you\'re all set'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-7 max-w-sm leading-relaxed">
            {hasFilters
              ? 'Try adjusting your search or filters to see more opportunities.'
              : 'New positions are added regularly. Set an alert to get notified when roles that match your profile go live.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {hasFilters && onClearFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                  border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  transition-colors"
              >
                Clear all filters
              </button>
            ) : (
              <>
                <Link
                  href="/candidate/jobs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                    bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500
                    text-white shadow-sm shadow-candidate-500/20
                    hover:shadow-md hover:shadow-candidate-500/25
                    transition-all duration-150"
                >
                  <Bell className="h-4 w-4" />
                  Set job alerts
                </Link>
                <Link
                  href="/candidate/profile"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                    border border-gray-200 dark:border-gray-700
                    text-gray-700 dark:text-gray-300
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    transition-colors"
                >
                  <User className="h-4 w-4" />
                  Update profile
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
