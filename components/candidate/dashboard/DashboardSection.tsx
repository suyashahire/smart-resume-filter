'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardSectionProps {
  title: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  children: ReactNode;
  className?: string;
  card?: boolean;
  divider?: boolean;
}

export default function DashboardSection({
  title,
  icon: Icon,
  actionLabel,
  actionHref,
  children,
  className = '',
  card = true,
  divider = true,
}: DashboardSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      <div
        className={
          card
            ? 'rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg shadow-sm'
            : ''
        }
      >
        <div className={card ? 'p-5 sm:p-6' : ''}>
          {/* Section header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-candidate-500/10 dark:bg-candidate-500/20 flex items-center justify-center">
                <Icon className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
              </span>
              {title}
            </h2>
            {actionLabel && actionHref && (
              <Link
                href={actionHref}
                className="text-xs font-semibold text-candidate-600 dark:text-candidate-400 hover:text-candidate-700 dark:hover:text-candidate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 rounded"
              >
                {actionLabel} →
              </Link>
            )}
          </div>
          {divider && (
            <div className="mb-4 h-px bg-gray-100 dark:bg-gray-800" aria-hidden />
          )}
          {children}
        </div>
      </div>
    </motion.section>
  );
}
