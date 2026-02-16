'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Building,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSearch,
  Users,
  Gift,
} from 'lucide-react';

interface ApplicationCardProps {
  application: {
    id: string;
    job_title?: string;
    company?: string;
    status: string;
    applied_at: string;
    score?: number;
    score_visible?: boolean;
    feedback?: string;
  };
  index?: number;
}

const statusConfig: Record<string, {
  icon: typeof FileSearch;
  label: string;
  color: string;
  bgColor: string;
}> = {
  applied: {
    icon: Clock,
    label: 'Applied',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  screening: {
    icon: FileSearch,
    label: 'Under Review',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  interview: {
    icon: Users,
    label: 'Interview',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  offer: {
    icon: Gift,
    label: 'Offer Received',
    color: 'text-candidate-600 dark:text-candidate-400',
    bgColor: 'bg-candidate-100 dark:bg-candidate-900/30',
  },
  hired: {
    icon: CheckCircle,
    label: 'Hired',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  rejected: {
    icon: XCircle,
    label: 'Not Selected',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  withdrawn: {
    icon: AlertCircle,
    label: 'Withdrawn',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
};

export default function ApplicationCard({ application, index = 0 }: ApplicationCardProps) {
  const config = statusConfig[application.status] || statusConfig.applied;
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        href={`/candidate/applications/${application.id}`}
        className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-candidate-300 dark:hover:border-candidate-600 transition-all group"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-candidate-100 dark:bg-candidate-900/30 rounded-xl flex items-center justify-center">
              <Building className="h-6 w-6 text-candidate-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">
                {application.job_title || 'Unknown Position'}
              </h3>
              {application.company && (
                <p className="text-gray-600 dark:text-gray-400">{application.company}</p>
              )}
              <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                Applied {formatDate(application.applied_at)}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-candidate-500 group-hover:translate-x-1 transition-all" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          {/* Status Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>

          {/* Score (if visible) */}
          {application.score_visible && application.score !== undefined && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Match Score:</span>
              <span className={`text-lg font-bold ${getScoreColor(application.score)}`}>
                {Math.round(application.score)}%
              </span>
            </div>
          )}
        </div>

        {/* Feedback Preview */}
        {application.feedback && (
          <div className="mt-4 p-3 bg-candidate-50 dark:bg-candidate-900/20 rounded-lg">
            <p className="text-sm text-candidate-700 dark:text-candidate-300 line-clamp-2">
              <span className="font-medium">Feedback:</span> {application.feedback}
            </p>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
