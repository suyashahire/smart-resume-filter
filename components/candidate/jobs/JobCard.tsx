'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  ChevronRight,
  Building,
  CheckCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { applyToJob } from '@/lib/api';

export interface JobItem {
  id: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  salary_range?: string;
  job_type: string;
  required_skills: string[];
  experience_required?: string;
  created_at: string;
  remote?: boolean;
}

interface JobCardProps {
  job: JobItem;
  hasApplied: boolean;
  onAppliedSuccess: (jobId: string) => void;
  index?: number;
}

const JOB_TYPE_STYLES: Record<string, string> = {
  'full-time':
    'bg-green-50 text-green-700 ring-green-200/60 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-700/40',
  'part-time':
    'bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-700/40',
  contract:
    'bg-purple-50 text-purple-700 ring-purple-200/60 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-700/40',
  internship:
    'bg-orange-50 text-orange-700 ring-orange-200/60 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-700/40',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
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
  const [error, setError] = useState<string | null>(null);

  const typeKey = (job.job_type || 'full-time').toLowerCase();
  const typeStyle = JOB_TYPE_STYLES[typeKey] || JOB_TYPE_STYLES['full-time'];

  const handleQuickApply = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasApplied || isApplying) return;
    setIsApplying(true);
    setError(null);
    try {
      await applyToJob(job.id);
      onAppliedSuccess(job.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22 }}
    >
      <Link href={`/candidate/jobs/${job.id}`} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 rounded-2xl">
        <div
          className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50
            bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg
            hover:border-candidate-300/60 dark:hover:border-candidate-600/40
            hover:shadow-md hover:shadow-candidate-500/5
            transition-all duration-200"
        >
          <div className="p-5 sm:p-6">
            {/* ── Header row ── */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Company icon */}
                <div className="flex-shrink-0 w-11 h-11 rounded-xl
                  bg-gradient-to-br from-candidate-500/10 to-purple-500/10
                  dark:from-candidate-500/20 dark:to-purple-500/20
                  border border-candidate-200/30 dark:border-candidate-700/30
                  flex items-center justify-center"
                >
                  <Building className="h-5 w-5 text-candidate-600 dark:text-candidate-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white
                    group-hover:text-candidate-600 dark:group-hover:text-candidate-400
                    transition-colors truncate"
                  >
                    {job.title}
                  </h3>
                  {job.company && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {job.company}
                    </p>
                  )}
                </div>
              </div>

              <ChevronRight className="h-4.5 w-4.5 text-gray-300 dark:text-gray-600
                group-hover:text-candidate-500 group-hover:translate-x-0.5
                transition-all flex-shrink-0 mt-1"
              />
            </div>

            {/* ── Meta badges ── */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ring-1 ring-inset ${typeStyle}`}>
                <Briefcase className="h-3 w-3" />
                {(job.job_type || 'Full-time').replace('-', ' ')}
              </span>
              {job.location && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                  bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200/60
                  dark:bg-gray-800/60 dark:text-gray-400 dark:ring-gray-700/40"
                >
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              {job.salary_range && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                  bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200/60
                  dark:bg-gray-800/60 dark:text-gray-400 dark:ring-gray-700/40"
                >
                  <DollarSign className="h-3 w-3" />
                  {job.salary_range}
                </span>
              )}
              {job.remote && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                  bg-candidate-50 text-candidate-700 ring-1 ring-inset ring-candidate-200/60
                  dark:bg-candidate-900/20 dark:text-candidate-400 dark:ring-candidate-700/40"
                >
                  Remote
                </span>
              )}
            </div>

            {/* ── Description ── */}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
              {job.description}
            </p>

            {/* ── Skills ── */}
            {job.required_skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.required_skills.slice(0, 5).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[11px] font-medium rounded-md
                      bg-candidate-50 dark:bg-candidate-900/15
                      text-candidate-700 dark:text-candidate-300
                      border border-candidate-100 dark:border-candidate-800/40"
                  >
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 5 && (
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-md
                    bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400
                    border border-gray-100 dark:border-gray-700/40"
                  >
                    +{job.required_skills.length - 5}
                  </span>
                )}
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex items-center justify-between pt-3.5 border-t border-gray-100 dark:border-gray-800/60">
              <span className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                <Clock className="h-3 w-3 mr-1.5" />
                Posted {formatDate(job.created_at)}
              </span>

              {hasApplied ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl
                  bg-green-50 dark:bg-green-900/20
                  text-xs font-semibold text-green-600 dark:text-green-400
                  ring-1 ring-inset ring-green-200/60 dark:ring-green-700/30"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Applied
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickApply}
                  disabled={isApplying}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                    text-white
                    bg-candidate-500 hover:bg-candidate-600
                    dark:bg-candidate-600 dark:hover:bg-candidate-500
                    disabled:opacity-60 disabled:pointer-events-none
                    shadow-sm shadow-candidate-500/20
                    hover:shadow-md hover:shadow-candidate-500/25
                    transition-all duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Applying…
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      Quick Apply
                    </>
                  )}
                </button>
              )}
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
