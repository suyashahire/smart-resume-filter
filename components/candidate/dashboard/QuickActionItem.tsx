'use client';

import Link from 'next/link';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickActionItemProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
  iconBgClass?: string;
}

export default function QuickActionItem({
  title,
  subtitle,
  icon: Icon,
  href,
  iconBgClass = 'bg-candidate-500/10 dark:bg-candidate-500/20 text-candidate-600 dark:text-candidate-400',
}: QuickActionItemProps) {
  return (
    <Link href={href} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 rounded-xl">
      <motion.div
        whileHover={{ y: -1 }}
        className="flex items-center gap-3 p-3 rounded-xl
          border border-gray-100 dark:border-gray-800
          hover:border-gray-200 dark:hover:border-gray-700
          hover:bg-gray-50/60 dark:hover:bg-gray-800/40
          hover:shadow-sm
          transition-all duration-150"
      >
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconBgClass}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">
            {title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-candidate-500 transition-colors" />
      </motion.div>
    </Link>
  );
}
