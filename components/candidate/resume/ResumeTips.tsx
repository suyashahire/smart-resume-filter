'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

const TIPS = [
  'Keep it concise — aim for 1–2 pages maximum.',
  'Use clear headings and bullet points for easy scanning.',
  'Include relevant keywords from job descriptions.',
  'Quantify achievements with numbers when possible.',
  'Use a clean, professional format (avoid excessive colors/graphics).',
];

const ADVANCED_TIPS = [
  'Tailor your resume to each role; highlight relevant experience.',
  'Lead with impact: use action verbs and results.',
  'List skills that match the job posting; consider an ATS-friendly layout.',
];

export default function ResumeTips() {
  const [expanded, setExpanded] = useState(false);
  const completed = 0;
  const total = TIPS.length + ADVANCED_TIPS.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={CARD_CLASS}
    >
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            Tips for a great resume
          </h3>
          {total > 0 && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {progress}% quality
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full bg-candidate-500 dark:bg-candidate-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
        <ul className="space-y-2">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="h-4 w-4 text-candidate-500 dark:text-candidate-400 flex-shrink-0 mt-0.5" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 text-sm font-medium text-candidate-600 dark:text-candidate-400 hover:underline"
          >
            {expanded ? 'Less tips' : 'More tips'}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 mt-3 overflow-hidden"
              >
                {ADVANCED_TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
