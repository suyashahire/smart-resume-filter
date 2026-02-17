'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, FileCheck, CheckCircle2 } from 'lucide-react';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

export default function ResumeInsights() {
  const [score] = useState<number | null>(null);
  const [keywordCoverage] = useState<number | null>(null);
  const [formattingHealth] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={CARD_CLASS}
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
          AI Resume Insights
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Upload a resume to see match score, keyword coverage, and formatting tips.
        </p>

        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Target className="h-4 w-4 text-candidate-500" />
              Match score
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {score != null ? `${score}%` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-candidate-500" />
              Keyword coverage
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {keywordCoverage != null ? `${keywordCoverage}%` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-candidate-500" />
              Formatting health
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formattingHealth != null ? `${formattingHealth}%` : '—'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white shadow-sm shadow-candidate-500/20 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Optimize resume with AI
          </button>
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Check ATS compatibility
          </button>
        </div>
      </div>
    </motion.div>
  );
}
