'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Zap,
  FileText,
  Briefcase,
  Wrench,
  GraduationCap,
  Link2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { getResumeImprovements, ResumeImprovements, ImprovementSection } from '@/lib/api';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

interface ImprovementSuggestionsProps {
  resumeId?: string;
}

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Professional Summary': FileText,
  'Work Experience': Briefcase,
  'Skills': Wrench,
  'Education': GraduationCap,
  'Contact & Links': Link2,
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBgColor(score: number) {
  if (score >= 80) return 'bg-green-500/10 border-green-500/20';
  if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function getBarColor(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ImprovementSuggestions({ resumeId }: ImprovementSuggestionsProps) {
  const [data, setData] = useState<ResumeImprovements | null>(null);
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

    getResumeImprovements(resumeId)
      .then((result) => {
        setData(result);
        // Auto-expand sections with low scores
        const lowScoreSections = result.sections
          .filter((s) => s.score < 70)
          .map((s) => s.name);
        setExpandedSections(new Set(lowScoreSections.slice(0, 2)));
      })
      .catch((err) => {
        setError(err.message || 'Failed to load improvement suggestions');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [resumeId]);

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
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
            <Lightbulb className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
            Improvement Suggestions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a resume to get personalized improvement suggestions.
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
            <Lightbulb className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
            Improvement Suggestions
          </h3>
          <p className="text-sm text-red-500 dark:text-red-400">
            {error || 'Unable to load suggestions'}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={CARD_CLASS}
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
          Improvement Suggestions
        </h3>

        {/* Overall Score */}
        <div className="mb-5 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Resume Score
            </span>
            <span className={`text-lg font-bold ${getScoreColor(data.overall_score)}`}>
              {data.overall_score}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getBarColor(data.overall_score)}`}
              initial={{ width: 0 }}
              animate={{ width: `${data.overall_score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Quick Wins */}
        {data.quick_wins && data.quick_wins.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Top Priorities
              </span>
            </div>
            <div className="space-y-2">
              {data.quick_wins.map((win, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                      {win.section}
                    </span>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {win.suggestion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section-by-Section */}
        <div className="space-y-2">
          {data.sections.map((section) => {
            const Icon = sectionIcons[section.name] || FileText;
            const isExpanded = expandedSections.has(section.name);
            const hasSuggestions = section.suggestions && section.suggestions.length > 0;

            return (
              <div
                key={section.name}
                className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.name)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${getScoreBgColor(
                      section.score
                    )}`}
                  >
                    <Icon className={`h-4 w-4 ${getScoreColor(section.score)}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {section.name}
                      </span>
                      <span
                        className={`text-sm font-semibold ${getScoreColor(section.score)}`}
                      >
                        {section.score}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getBarColor(section.score)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${section.score}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      {section.score >= 85 && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  {hasSuggestions && (
                    isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && hasSuggestions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ul className="px-3 pb-3 space-y-2 pl-14">
                        {section.suggestions.map((suggestion, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                          >
                            <span className="text-candidate-500 font-bold flex-shrink-0">→</span>
                            {suggestion}
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
