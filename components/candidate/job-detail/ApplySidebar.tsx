'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle, Upload, FileText, Search, Calendar, Star, BadgeCheck, XCircle } from 'lucide-react';
import SkillPill from './SkillPill';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

const STATUS_DISPLAY: Record<string, { label: string; icon: React.ElementType; bg: string; border: string; text: string }> = {
  applied: { label: 'Applied', icon: CheckCircle, bg: 'bg-green-500/15 dark:bg-green-500/20', border: 'border-green-500/25', text: 'text-green-700 dark:text-green-300' },
  new: { label: 'Applied', icon: CheckCircle, bg: 'bg-green-500/15 dark:bg-green-500/20', border: 'border-green-500/25', text: 'text-green-700 dark:text-green-300' },
  screening: { label: 'Screening', icon: Search, bg: 'bg-blue-500/15 dark:bg-blue-500/20', border: 'border-blue-500/25', text: 'text-blue-700 dark:text-blue-300' },
  interview: { label: 'Interview', icon: Calendar, bg: 'bg-violet-500/15 dark:bg-violet-500/20', border: 'border-violet-500/25', text: 'text-violet-700 dark:text-violet-300' },
  offer: { label: 'Offer Received', icon: Star, bg: 'bg-amber-500/15 dark:bg-amber-500/20', border: 'border-amber-500/25', text: 'text-amber-700 dark:text-amber-300' },
  hired: { label: 'Hired', icon: BadgeCheck, bg: 'bg-green-500/15 dark:bg-green-500/20', border: 'border-green-500/25', text: 'text-green-700 dark:text-green-300' },
  rejected: { label: 'Not Selected', icon: XCircle, bg: 'bg-red-500/15 dark:bg-red-500/20', border: 'border-red-500/25', text: 'text-red-600 dark:text-red-300' },
};

interface ApplySidebarProps {
  jobId: string;
  jobTitle: string;
  company?: string;
  applied: boolean;
  applicationStatus?: string;
  isApplying: boolean;
  onApply: () => void;
  applyError: string | null;
  requiredSkills?: string[];
  preferredSkills?: string[];
  hasResume?: boolean;
  profileCompleteness?: number;
}

export default function ApplySidebar({
  jobId,
  jobTitle,
  company,
  applied,
  applicationStatus,
  isApplying,
  onApply,
  applyError,
  requiredSkills = [],
  preferredSkills = [],
  hasResume = false,
  profileCompleteness,
}: ApplySidebarProps) {
  return (
    <div className="space-y-6">
      {/* Apply CTA card - sticky */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:sticky lg:top-24"
      >
        <div className="rounded-xl border border-candidate-500/30 dark:border-candidate-500/30 bg-gradient-to-br from-candidate-500/10 via-candidate-500/5 to-cyan-500/10 dark:from-candidate-500/15 dark:via-candidate-500/10 dark:to-cyan-500/15 backdrop-blur-md shadow-md shadow-candidate-500/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ready to apply?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Takes less than 2 minutes. Use your saved resume or upload a new one.
          </p>
          {applied ? (
            (() => {
              const key = (applicationStatus || 'applied').toLowerCase();
              const cfg = STATUS_DISPLAY[key] || STATUS_DISPLAY.applied;
              const Icon = cfg.icon;
              return (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${cfg.bg} border ${cfg.border} ${cfg.text}`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{cfg.label}</span>
                </div>
              );
            })()
          ) : (
            <>
              <button
                type="button"
                onClick={onApply}
                disabled={isApplying}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-medium bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 shadow-lg shadow-candidate-500/25 hover:shadow-xl hover:shadow-candidate-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Applying…
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Apply now
                  </>
                )}
              </button>
              <Link
                href="/candidate/resume"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Update resume
              </Link>
            </>
          )}
          {applyError && (
            <p className="mt-3 text-sm text-red-500 dark:text-red-400">{applyError}</p>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {hasResume ? 'Resume uploaded' : 'No resume yet'}
            </span>
            {profileCompleteness != null && (
              <span>Profile {profileCompleteness}%</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Required Skills */}
      {requiredSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={CARD_CLASS}
        >
          <div className="p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Required skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((skill, i) => (
                <SkillPill key={i} label={skill} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Preferred Skills */}
      {preferredSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={CARD_CLASS}
        >
          <div className="p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Preferred skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {preferredSkills.map((skill, i) => (
                <SkillPill key={i} label={skill} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Company summary placeholder */}
      {company && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={CARD_CLASS}
        >
          <div className="p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              About {company}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Learn more about the company when you apply or visit their website.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
