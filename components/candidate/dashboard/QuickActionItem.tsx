'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
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
        whileHover={{ x: 2 }}
        className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-gray-200/80 dark:hover:border-gray-700/80 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">
            {title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 group-hover:text-candidate-500 transition-colors" />
      </motion.div>
    </Link>
  );
}
