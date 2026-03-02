'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Award, Loader2 } from 'lucide-react';
import { getResumePercentile, PercentileData } from '@/lib/api';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

interface PercentileRankBadgeProps {
  resumeId?: string;
}

function getBadgeConfig(badge: string) {
  switch (badge) {
    case 'Top 1%':
      return {
        icon: Trophy,
        gradient: 'from-amber-400 to-yellow-500',
        bgClass: 'bg-gradient-to-br from-amber-400 to-yellow-500',
        textClass: 'text-amber-600 dark:text-amber-400',
        ringColor: '#f59e0b',
      };
    case 'Top 5%':
      return {
        icon: Award,
        gradient: 'from-purple-500 to-indigo-500',
        bgClass: 'bg-gradient-to-br from-purple-500 to-indigo-500',
        textClass: 'text-purple-600 dark:text-purple-400',
        ringColor: '#8b5cf6',
      };
    case 'Top 10%':
      return {
        icon: Award,
        gradient: 'from-candidate-500 to-cyan-500',
        bgClass: 'bg-gradient-to-br from-candidate-500 to-cyan-500',
        textClass: 'text-candidate-600 dark:text-candidate-400',
        ringColor: '#14b8a6',
      };
    case 'Top 25%':
      return {
        icon: TrendingUp,
        gradient: 'from-blue-500 to-cyan-500',
        bgClass: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        textClass: 'text-blue-600 dark:text-blue-400',
        ringColor: '#3b82f6',
      };
    case 'Above Average':
      return {
        icon: TrendingUp,
        gradient: 'from-green-500 to-emerald-500',
        bgClass: 'bg-gradient-to-br from-green-500 to-emerald-500',
        textClass: 'text-green-600 dark:text-green-400',
        ringColor: '#22c55e',
      };
    default:
      return {
        icon: Users,
        gradient: 'from-gray-400 to-gray-500',
        bgClass: 'bg-gradient-to-br from-gray-400 to-gray-500',
        textClass: 'text-gray-600 dark:text-gray-400',
        ringColor: '#9ca3af',
      };
  }
}

export default function PercentileRankBadge({ resumeId }: PercentileRankBadgeProps) {
  const [data, setData] = useState<PercentileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resumeId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    getResumePercentile(resumeId)
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load percentile data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [resumeId]);

  if (!resumeId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={CARD_CLASS}
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
            Resume Ranking
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a resume to see how you compare to other candidates.
          </p>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={CARD_CLASS}
      >
        <div className="p-5 flex items-center justify-center min-h-[180px]">
          <Loader2 className="h-8 w-8 text-candidate-500 animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (error || !data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={CARD_CLASS}
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
            Resume Ranking
          </h3>
          <p className="text-sm text-red-500 dark:text-red-400">
            {error || 'Unable to load ranking data'}
          </p>
        </div>
      </motion.div>
    );
  }

  const config = getBadgeConfig(data.badge);
  const Icon = config.icon;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (data.percentile / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className={CARD_CLASS}
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
          Resume Ranking
        </h3>

        <div className="flex items-center gap-6">
          {/* Animated Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress ring */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={config.ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                {data.percentile}%
              </motion.span>
              <span className="text-xs text-gray-500 dark:text-gray-400">percentile</span>
            </div>
          </div>

          {/* Badge and stats */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-semibold shadow-lg
                ${config.bgClass}
              `}
            >
              <Icon className="h-4 w-4" />
              {data.badge}
            </motion.div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Rank:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  #{data.rank} of {data.total_candidates.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Score:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {data.score} points
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.percentile >= 75
              ? '🎉 Great job! Your resume stands out among candidates.'
              : data.percentile >= 50
              ? "💡 You're above average. Check improvements to reach the top."
              : '📈 Review the suggestions below to improve your ranking.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
