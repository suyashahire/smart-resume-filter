'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const SECTION_CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm transition-all duration-200';

interface DashboardSectionProps {
  title: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  children: ReactNode;
  className?: string;
  /** Wrap content in a card with consistent padding */
  card?: boolean;
  /** Optional divider below header */
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      <div className={card ? SECTION_CARD_CLASS : ''}>
        <div className={card ? 'p-5' : ''}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-candidate-500/10 dark:bg-candidate-500/20 flex items-center justify-center">
                <Icon className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
              </span>
              {title}
            </h2>
            {actionLabel && actionHref && (
              <Link
                href={actionHref}
                className="text-sm font-medium text-candidate-600 dark:text-candidate-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 rounded"
              >
                {actionLabel} →
              </Link>
            )}
          </div>
          {divider && (
            <div
              className="mb-4 h-px bg-gray-200/80 dark:bg-gray-700/80"
              aria-hidden
            />
          )}
          {children}
        </div>
      </div>
    </motion.section>
  );
}
