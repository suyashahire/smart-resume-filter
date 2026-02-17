'use client';

import Link from 'next/link';
import { Building, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors: Record<string, string> = {
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    screening: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    hired: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    withdrawn: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
};

function relativeTime(dateString?: string): string {
    if (!dateString) return '';
    const diff = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

interface ApplicationListItemProps {
    id: string;
    jobTitle: string;
    company?: string;
    status: string;
    updatedAt?: string;
    index?: number;
}

export default function ApplicationListItem({
    id,
    jobTitle,
    company,
    status,
    updatedAt,
    index = 0,
}: ApplicationListItemProps) {
    const badge = statusColors[status] ?? statusColors.applied;

    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
        >
            <Link
                href={`/candidate/applications/${id}`}
                className="group flex items-center gap-3 p-3 rounded-xl
          hover:bg-gray-50/80 dark:hover:bg-gray-800/40
          hover:shadow-sm
          transition-all duration-150"
            >
                {/* Company icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-candidate-50 dark:bg-candidate-900/20 flex items-center justify-center">
                    <Building className="h-4.5 w-4.5 text-candidate-600 dark:text-candidate-400" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">
                        {jobTitle || 'Application'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {company && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{company}</span>
                        )}
                        {updatedAt && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                                {relativeTime(updatedAt)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status badge */}
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${badge}`}>
                    {status}
                </span>

                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-candidate-500 transition-colors" />
            </Link>
        </motion.div>
    );
}
