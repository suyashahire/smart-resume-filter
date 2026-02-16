'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, Search, FileText, ArrowRight } from 'lucide-react';

interface ApplicationsEmptyStateProps {
  hasFilter: boolean;
  onClearFilter: () => void;
}

export default function ApplicationsEmptyState({
  hasFilter,
  onClearFilter,
}: ApplicationsEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Subtle gradient border / glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-candidate-500/20 via-transparent to-purple-500/20 blur-[1px] pointer-events-none" />
      <div className="relative rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-b from-candidate-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center py-14 px-6 sm:py-16 sm:px-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-candidate-500/10 dark:bg-candidate-500/20 border border-candidate-500/20 dark:border-candidate-500/30 flex items-center justify-center mb-5">
            {hasFilter ? (
              <Search className="h-8 w-8 text-candidate-500 dark:text-candidate-400" />
            ) : (
              <Briefcase className="h-8 w-8 text-candidate-500 dark:text-candidate-400" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {hasFilter ? 'No matching applications' : 'No applications yet'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            {hasFilter
              ? "We couldn't find any applications matching your filters. Try a different status or clear filters to see all."
              : 'Track the status of your job applications. Start by browsing open roles and applying to positions that match your skills.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {hasFilter ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClearFilter}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear filters
              </motion.button>
            ) : (
              <>
                <Link href="/candidate/jobs">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white shadow-sm shadow-candidate-500/20 transition-colors"
                  >
                    Find matching jobs
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
                <Link href="/candidate/resume">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Upload resume
                  </motion.span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
