'use client';

import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col items-center justify-center py-10 px-6 text-center ${className}`}
    >
      {/* Gradient ring icon */}
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-candidate-400/20 to-purple-400/20 blur-lg" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-candidate-500/10 to-purple-500/10 dark:from-candidate-500/20 dark:to-purple-500/20 border border-candidate-200/50 dark:border-candidate-700/30 flex items-center justify-center">
          <Icon className="h-7 w-7 text-candidate-500 dark:text-candidate-400" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-[280px] leading-relaxed">
        {subtitle}
      </p>

      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500
          text-white shadow-sm shadow-candidate-500/20
          transition-all duration-200 hover:shadow-md hover:shadow-candidate-500/25
          focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 focus-visible:ring-offset-2"
      >
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>

      {secondaryLabel && secondaryHref && (
        <Link
          href={secondaryHref}
          className="mt-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 transition-colors"
        >
          {secondaryLabel}
        </Link>
      )}
    </motion.div>
  );
}
