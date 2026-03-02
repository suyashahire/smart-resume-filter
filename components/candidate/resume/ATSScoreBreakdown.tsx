'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Wrench,
  GraduationCap,
  FileType,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Loader2
} from 'lucide-react';
import { getATSDetailedBreakdown, ATSDetailedBreakdown } from '@/lib/api';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

interface ATSScoreBreakdownProps {
  resumeId?: string;
}

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  contact: User,
  experience: Briefcase,
  skills: Wrench,
  education: GraduationCap,
  formatting: FileType,
};

const sectionLabels: Record<string, string> = {
  contact: 'Contact Info',
  experience: 'Experience',
  skills: 'Skills',
  education: 'Education',
  formatting: 'Formatting',
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getBarColor(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ATSScoreBreakdown({ resumeId }: ATSScoreBreakdownProps) {
  const [data, setData] = useState<ATSDetailedBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!resumeId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    getATSDetailedBreakdown(resumeId)
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load ATS analysis');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [resumeId]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  if (!resumeId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={CARD_CLASS}
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
            ATS Compatibility
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a resume to check ATS compatibility score.
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
        <div className="p-5 flex items-center justify-center min-h-[200px]">
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
            <ShieldCheck className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
            ATS Compatibility
          </h3>
          <p className="text-sm text-red-500 dark:text-red-400">
            {error || 'Unable to load ATS analysis'}
          </p>
        </div>
      </motion.div>
    );
  }

  const sectionKeys = ['contact', 'experience', 'skills', 'education', 'formatting'] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={CARD_CLASS}
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
          ATS Compatibility
        </h3>

        {/* Total Score */}
        <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-gray-200 dark:text-gray-700"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={data.total_score >= 80 ? '#22c55e' : data.total_score >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                animate={{ strokeDashoffset: (1 - data.total_score / 100) * 2 * Math.PI * 28 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${getScoreColor(data.total_score)}`}>
                {data.total_score}
              </span>
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Overall ATS Score</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.total_score >= 80
                ? 'Excellent! Your resume is ATS-ready.'
                : data.total_score >= 60
                ? 'Good, but some improvements needed.'
                : 'Needs work to pass ATS filters.'}
            </p>
          </div>
        </div>

        {/* Quick Wins */}
        {data.quick_wins && data.quick_wins.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Quick Wins</span>
            </div>
            <ul className="space-y-1.5">
              {data.quick_wins.map((win, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  {win}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section Breakdown */}
        <div className="space-y-2">
          {sectionKeys.map((key) => {
            const section = data.sections[key];
            if (!section) return null;
            const Icon = sectionIcons[key] || FileType;
            const isExpanded = expandedSections.has(key);
            const hasIssues = section.issues && section.issues.length > 0;

            return (
              <div
                key={key}
                className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-candidate-500/10 dark:bg-candidate-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {sectionLabels[key]}
                      </span>
                      {hasIssues ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getBarColor(section.score)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${section.score}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${getScoreColor(section.score)}`}>
                        {section.score}%
                      </span>
                    </div>
                  </div>
                  {hasIssues && (
                    isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && hasIssues && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ul className="px-3 pb-3 space-y-1.5">
                        {section.issues.map((issue, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 pl-11"
                          >
                            <span className="text-amber-500 flex-shrink-0">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
