'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Globe,
  Sparkles,
} from 'lucide-react';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

export interface JobHeaderData {
  title: string;
  company?: string;
  location?: string;
  salary_range?: string;
  job_type?: string;
  remote?: boolean;
  created_at: string;
  match_score?: number;
}

interface JobHeaderProps {
  job: JobHeaderData;
  formatDate: (date: string) => string;
}

export default function JobHeader({ job, formatDate }: JobHeaderProps) {
  const typeLabel = (job.job_type || 'full-time').replace('-', ' ');

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={CARD_CLASS}
    >
      <div className="p-6">
        <Link
          href="/candidate/jobs"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-candidate-500/15 to-cyan-500/15 dark:from-candidate-500/10 dark:to-cyan-500/10 border border-candidate-500/25 flex items-center justify-center flex-shrink-0">
              <Building className="h-7 w-7 text-candidate-600 dark:text-candidate-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {job.title}
              </h1>
              {job.company && (
                <p className="text-base text-gray-600 dark:text-gray-400 mb-3">{job.company}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-candidate-500" />
                  {typeLabel}
                </span>
                {job.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-candidate-500" />
                    {job.location}
                  </span>
                )}
                {job.remote && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Globe className="h-3.5 w-3.5" />
                    Remote
                  </span>
                )}
                {job.salary_range && (
                  <span className="inline-flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    {job.salary_range}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Posted {formatDate(job.created_at)}
                </span>
              </div>
              {job.match_score != null && job.match_score > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-candidate-500/10 dark:bg-candidate-500/20 border border-candidate-500/25 text-candidate-600 dark:text-candidate-400 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  {Math.round(job.match_score)}% match
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
