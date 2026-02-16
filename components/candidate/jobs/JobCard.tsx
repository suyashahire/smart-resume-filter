'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  ArrowRight,
  Check,
  Loader2,
  Globe,
  Sparkles,
} from 'lucide-react';
import { applyToJob } from '@/lib/api';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm transition-all duration-200 hover:border-candidate-400/40 dark:hover:border-candidate-500/40 hover:shadow-md hover:-translate-y-0.5';

const jobTypeStyles: Record<string, string> = {
  'full-time': 'bg-green-500/10 text-green-500 border-green-500/20',
  'part-time': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  contract: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  internship: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

export interface JobItem {
  id: string;
  title: string;
  description?: string;
  company?: string;
  job_type?: string;
  location?: string;
  salary_range?: string;
  remote?: boolean;
  required_skills?: string[];
  created_at: string;
  match_score?: number;
}

interface JobCardProps {
  job: JobItem;
  hasApplied: boolean;
  onAppliedSuccess?: (jobId: string) => void;
  index?: number;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function JobCard({
  job,
  hasApplied,
  onAppliedSuccess,
  index = 0,
}: JobCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(hasApplied);
  const [error, setError] = useState<string | null>(null);
  const typeStyle = jobTypeStyles[job.job_type || 'full-time'] || jobTypeStyles['full-time'];

  const handleQuickApply = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (applied || isApplying) return;
    setIsApplying(true);
    setError(null);
    try {
      await applyToJob(job.id);
      setApplied(true);
      onAppliedSuccess?.(job.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Link href={`/candidate/jobs/${job.id}`} className="block group">
        <div className={CARD_CLASS}>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-candidate-500/15 to-cyan-500/15 dark:from-candidate-500/10 dark:to-cyan-500/10 border border-candidate-200/50 dark:border-candidate-700/30 flex items-center justify-center flex-shrink-0">
                  <Building className="h-6 w-6 text-candidate-600 dark:text-candidate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">
                    {job.title}
                  </h3>
                  {job.company && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {job.company}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${typeStyle}`}
              >
                <Briefcase className="h-3 w-3" />
                {(job.job_type || 'full-time').replace('-', ' ')}
              </span>
              {job.remote && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Globe className="h-3 w-3" />
                  Remote
                </span>
              )}
              {job.match_score !== undefined && job.match_score > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-candidate-500/10 text-candidate-500 border border-candidate-500/20">
                  <Sparkles className="h-3 w-3" />
                  {Math.round(job.match_score)}% match
                </span>
              )}
            </div>

            {job.location && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            )}

            {job.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                {job.description}
              </p>
            )}

            {job.required_skills?.length ? (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.required_skills.slice(0, 4).map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 text-xs rounded-md"
                  >
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 4 && (
                  <span className="px-2 py-1 text-gray-500 text-xs">
                    +{job.required_skills.length - 4} more
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4 flex-wrap">
                {job.salary_range && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {job.salary_range}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(job.created_at)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <motion.button
                  onClick={handleQuickApply}
                  disabled={isApplying || applied}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 ${
                    applied
                      ? 'bg-green-500 cursor-default'
                      : isApplying
                        ? 'bg-gray-400 dark:bg-gray-600 cursor-wait'
                        : 'bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 shadow-sm shadow-candidate-500/20 hover:shadow-md'
                  }`}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Applying…
                    </>
                  ) : applied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Applied
                    </>
                  ) : (
                    <>
                      Quick apply
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </motion.button>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
