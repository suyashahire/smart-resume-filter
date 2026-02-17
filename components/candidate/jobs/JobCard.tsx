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
  Building2,
  CheckCircle,
  Loader2,
  Zap,
  GraduationCap,
  Users,
  Sparkles,
  BookmarkPlus,
  Bookmark,
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
  education_required?: string;
  created_at: string;
  remote?: boolean;
  candidates_screened?: number;
}

interface JobCardProps {
  job: JobItem;
  hasApplied: boolean;
  onAppliedSuccess: (jobId: string) => void;
  index?: number;
}

const JOB_TYPE_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  'full-time': {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  'part-time': {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  contract: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    text: 'text-violet-700 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  internship: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCompanyInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function JobCard({
  job,
  hasApplied,
  onAppliedSuccess,
  index = 0,
}: JobCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const typeKey = (job.job_type || 'full-time').toLowerCase();
  const typeConfig = JOB_TYPE_CONFIG[typeKey] || JOB_TYPE_CONFIG['full-time'];
  const isNew = (Date.now() - new Date(job.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000;

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

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28, ease: 'easeOut' }}
    >
      <Link
        href={`/candidate/jobs/${job.id}`}
        className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 rounded-2xl"
      >
        <div
          className="relative rounded-2xl border border-gray-200/60 dark:border-gray-700/40
            bg-white dark:bg-gray-900/70 backdrop-blur-xl
            hover:border-candidate-400/50 dark:hover:border-candidate-500/40
            hover:shadow-lg hover:shadow-candidate-500/[0.06]
            dark:hover:shadow-candidate-500/[0.08]
            transition-all duration-300 overflow-hidden"
        >
          {/* Subtle top gradient accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-candidate-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="p-5 sm:p-6">
            {/* ── Top Row: Company + Badges + Actions ── */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Company Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl
                  bg-gradient-to-br from-candidate-500/15 to-teal-500/10
                  dark:from-candidate-500/25 dark:to-teal-500/15
                  border border-candidate-200/40 dark:border-candidate-700/30
                  flex items-center justify-center
                  group-hover:scale-105 group-hover:shadow-md group-hover:shadow-candidate-500/10
                  transition-all duration-300"
                >
                  {job.company ? (
                    <span className="text-sm font-bold text-candidate-700 dark:text-candidate-300 leading-none">
                      {getCompanyInitials(job.company)}
                    </span>
                  ) : (
                    <Building2 className="h-5 w-5 text-candidate-600 dark:text-candidate-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Company Name */}
                  {job.company && (
                    <p className="text-xs font-semibold text-candidate-600 dark:text-candidate-400 uppercase tracking-wider mb-0.5 truncate">
                      {job.company}
                    </p>
                  )}
                  {/* Job Title */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white
                    group-hover:text-candidate-600 dark:group-hover:text-candidate-400
                    transition-colors truncate leading-snug"
                  >
                    {job.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* New badge */}
                {isNew && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    bg-gradient-to-r from-amber-500/15 to-orange-500/15
                    dark:from-amber-500/20 dark:to-orange-500/20
                    text-[10px] font-bold text-amber-600 dark:text-amber-400
                    uppercase tracking-wider border border-amber-300/30 dark:border-amber-600/30"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    New
                  </span>
                )}

                {/* Save button */}
                <button
                  onClick={handleSave}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                    transition-colors text-gray-400 dark:text-gray-500
                    hover:text-candidate-500 dark:hover:text-candidate-400"
                  title={isSaved ? 'Unsave job' : 'Save job'}
                >
                  {isSaved ? (
                    <Bookmark className="h-4 w-4 fill-candidate-500 text-candidate-500" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4" />
                  )}
                </button>

                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600
                  group-hover:text-candidate-500 group-hover:translate-x-0.5
                  transition-all flex-shrink-0"
                />
              </div>
            </div>

            {/* ── Meta Info Row ── */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3.5">
              {/* Job Type */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${typeConfig.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
                {(job.job_type || 'Full-time').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>

              {/* Location */}
              {job.location && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                  {job.location}
                </span>
              )}

              {/* Salary */}
              {job.salary_range && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <DollarSign className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                  {job.salary_range}
                </span>
              )}

              {/* Experience */}
              {job.experience_required && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Briefcase className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                  {job.experience_required}
                </span>
              )}

              {/* Education */}
              {job.education_required && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <GraduationCap className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                  {job.education_required}
                </span>
              )}

              {/* Remote tag */}
              {job.remote && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold
                  bg-candidate-500/10 dark:bg-candidate-500/15
                  text-candidate-700 dark:text-candidate-400
                  border border-candidate-200/30 dark:border-candidate-700/30
                  uppercase tracking-wider"
                >
                  Remote
                </span>
              )}
            </div>

            {/* ── Description ── */}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
              {job.description}
            </p>

            {/* ── Skills ── */}
            {job.required_skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.required_skills.slice(0, 6).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg
                      bg-gray-50 dark:bg-gray-800/70
                      text-gray-600 dark:text-gray-300
                      border border-gray-200/60 dark:border-gray-700/40
                      transition-colors group-hover:border-candidate-200/50 dark:group-hover:border-candidate-700/40
                      group-hover:bg-candidate-50/50 dark:group-hover:bg-candidate-900/15
                      group-hover:text-candidate-700 dark:group-hover:text-candidate-300"
                  >
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 6 && (
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg
                    bg-gray-50 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500
                    border border-gray-100 dark:border-gray-700/40"
                  >
                    +{job.required_skills.length - 6} more
                  </span>
                )}
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800/50">
              {/* Left: Meta info */}
              <div className="flex items-center gap-3.5">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <Clock className="h-3 w-3" />
                  Posted {formatDate(job.created_at)}
                </span>
                {(job.candidates_screened !== undefined && job.candidates_screened > 0) && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <Users className="h-3 w-3" />
                    {job.candidates_screened} applicant{job.candidates_screened !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Right: Action */}
              {hasApplied ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                  bg-emerald-50 dark:bg-emerald-900/20
                  text-xs font-bold text-emerald-600 dark:text-emerald-400
                  border border-emerald-200/50 dark:border-emerald-700/30"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Applied
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickApply}
                  disabled={isApplying}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold
                    text-white
                    bg-gradient-to-r from-candidate-500 to-teal-500
                    hover:from-candidate-600 hover:to-teal-600
                    disabled:opacity-60 disabled:pointer-events-none
                    shadow-md shadow-candidate-500/20
                    hover:shadow-lg hover:shadow-candidate-500/30
                    active:scale-[0.97]
                    transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 focus-visible:ring-offset-2
                    dark:focus-visible:ring-offset-gray-900"
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
