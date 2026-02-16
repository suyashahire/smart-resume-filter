'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const CARD_CLASS =
  'relative overflow-hidden rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm transition-all duration-200 hover:border-candidate-400/40 dark:hover:border-candidate-500/40 hover:shadow-md';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accentColor: string;
  href?: string;
  progressPercent?: number;
  index?: number;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accentColor,
  href = '/candidate/applications',
  progressPercent,
  index = 0,
}: StatCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={CARD_CLASS}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{label}</p>
          {progressPercent !== undefined && (
            <div className="mt-2 h-1 w-full rounded-full bg-gray-200/80 dark:bg-gray-700/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-candidate-500/80 dark:bg-candidate-400/80 transition-all duration-500"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
          )}
        </div>
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${accentColor}`}
          aria-hidden
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
