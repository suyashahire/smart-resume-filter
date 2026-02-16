'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-200/80 dark:bg-gray-700/80 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-gray-500 dark:text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">{subtitle}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 focus-visible:ring-offset-2"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
