'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  FileText,
  Wand2,
  ChevronDown,
  Plus,
  Minus,
} from 'lucide-react';
import { optimizeResumeWithAI, OptimizeChange } from '@/lib/api';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

interface OptimizeBeforeAfterProps {
  resumeId?: string;
}

const CHANGE_TYPE_STYLES: Record<string, { bg: string; icon: React.ElementType; label: string }> = {
  added_keywords: {
    bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: Plus,
    label: 'Skills Added',
  },
  generated: {
    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Sparkles,
    label: 'Generated',
  },
  enhanced: {
    bg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    icon: Wand2,
    label: 'Enhanced',
  },
  formatting: {
    bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: FileText,
    label: 'Formatting',
  },
  suggestion: {
    bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    icon: ArrowRight,
    label: 'Suggestion',
  },
  instruction: {
    bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: Wand2,
    label: 'Custom',
  },
};

export default function OptimizeBeforeAfter({ resumeId }: OptimizeBeforeAfterProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [changes, setChanges] = useState<OptimizeChange[]>([]);
  const [skillsAdded, setSkillsAdded] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'changes' | 'before' | 'after'>('changes');
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = useCallback(async () => {
    if (!resumeId) return;
    setOptimizing(true);
    setError(null);
    try {
      const data = await optimizeResumeWithAI(resumeId, instructions || undefined);
      setOriginalText(data.original_text || null);
      setImprovedText(data.improved_text || null);
      setChanges(data.changes || []);
      setSkillsAdded(data.skills_added || []);
      setSummary(data.summary || null);
      setActiveTab('changes');
    } catch {
      setError('Failed to optimize resume. Please try again.');
    } finally {
      setOptimizing(false);
    }
  }, [resumeId, instructions]);

  const handleCopy = useCallback(async () => {
    if (!improvedText) return;
    try {
      await navigator.clipboard.writeText(improvedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [improvedText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={CARD_CLASS}
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
          AI Resume Optimizer
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Analyze your resume against market demand and get optimized content.
        </p>

        {/* Instructions toggle */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showInstructions ? 'rotate-180' : ''}`}
            />
            Custom instructions (optional)
          </button>
          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., 'Focus on backend development skills' or 'Tailor for fintech roles'"
                  rows={2}
                  className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-candidate-500 resize-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Optimize button */}
        <button
          type="button"
          onClick={handleOptimize}
          disabled={optimizing || !resumeId}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white shadow-sm shadow-candidate-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {optimizing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing & optimizing…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              {improvedText ? 'Re-optimize' : 'Optimize resume'}
            </>
          )}
        </button>

        {error && (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {/* Results */}
        <AnimatePresence>
          {improvedText && !optimizing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {/* Summary */}
                {summary && (
                  <div className="p-3 rounded-lg bg-candidate-50 dark:bg-candidate-900/20 border border-candidate-200 dark:border-candidate-800">
                    <p className="text-sm font-medium text-candidate-700 dark:text-candidate-300">
                      {summary}
                    </p>
                  </div>
                )}

                {/* Skills added */}
                {skillsAdded.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skillsAdded.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      >
                        <Plus className="h-3 w-3" />
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tab bar */}
                <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                  {(['changes', 'before', 'after'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab === 'changes'
                        ? `Changes (${changes.length})`
                        : tab === 'before'
                        ? 'Original'
                        : 'Optimized'}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
                  {activeTab === 'changes' && (
                    <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                      {changes.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No changes needed — your resume is already well-optimized.
                        </p>
                      ) : (
                        changes.map((change, i) => {
                          const style =
                            CHANGE_TYPE_STYLES[change.type] || CHANGE_TYPE_STYLES.suggestion;
                          const Icon = style.icon;
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                            >
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${style.bg} flex-shrink-0 mt-0.5`}
                              >
                                <Icon className="h-3 w-3" />
                                {change.section}
                              </span>
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {change.detail}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {activeTab === 'before' && (
                    <div className="p-3 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                        {originalText || 'Original text not available.'}
                      </pre>
                    </div>
                  )}

                  {activeTab === 'after' && (
                    <div className="p-3 max-h-64 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                          Optimized Version
                        </span>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 text-green-500" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                        {improvedText}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
