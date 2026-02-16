'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Users,
  Gift,
  XCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface StatusChange {
  from_status?: string;
  to_status: string;
  changed_at: string;
  note?: string;
}

interface ApplicationTimelineProps {
  currentStatus: string;
  statusHistory: StatusChange[];
}

const statusConfig: Record<string, {
  icon: typeof FileText;
  label: string;
  color: string;
  bgColor: string;
}> = {
  applied: {
    icon: FileText,
    label: 'Applied',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  screening: {
    icon: Search,
    label: 'Under Review',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  interview: {
    icon: Users,
    label: 'Interview',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  offer: {
    icon: Gift,
    label: 'Offer',
    color: 'text-candidate-600',
    bgColor: 'bg-candidate-100 dark:bg-candidate-900/30',
  },
  hired: {
    icon: CheckCircle,
    label: 'Hired',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  withdrawn: {
    icon: XCircle,
    label: 'Withdrawn',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
};

const defaultStatuses = ['applied', 'screening', 'interview', 'offer', 'hired'];

export default function ApplicationTimeline({
  currentStatus,
  statusHistory,
}: ApplicationTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIndex = (status: string) => {
    return defaultStatuses.indexOf(status);
  };

  const currentIndex = getStatusIndex(currentStatus);
  const isRejected = currentStatus === 'rejected';
  const isWithdrawn = currentStatus === 'withdrawn';

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between">
          {defaultStatuses.map((status, index) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const isPast = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={status} className="flex flex-col items-center relative z-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPast
                      ? isCurrent
                        ? 'bg-candidate-500 text-white ring-4 ring-candidate-200 dark:ring-candidate-800'
                        : 'bg-candidate-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isPast
                      ? 'text-candidate-600 dark:text-candidate-400'
                      : 'text-gray-400'
                  }`}
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentIndex / (defaultStatuses.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-candidate-500"
          />
        </div>
      </div>

      {/* Status Badge */}
      {(isRejected || isWithdrawn) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg ${
            isRejected
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
          }`}
        >
          <XCircle className="h-5 w-5" />
          <span className="font-medium">
            {isRejected ? 'Application Not Selected' : 'Application Withdrawn'}
          </span>
        </motion.div>
      )}

      {/* Status History */}
      {statusHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Status History
          </h4>
          <div className="space-y-3">
            {statusHistory.map((change, index) => {
              const config = statusConfig[change.to_status] || statusConfig.applied;
              const Icon = config.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start space-x-3 p-3 rounded-lg ${config.bgColor}`}
                >
                  <div className={`p-2 rounded-full ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(change.changed_at)}
                      </span>
                    </div>
                    {change.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {change.note}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
