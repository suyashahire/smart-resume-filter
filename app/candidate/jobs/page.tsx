'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Briefcase,
  Building,
  Clock,
  DollarSign,
  ArrowRight,
  Check,
  Loader2,
  Zap,
  Globe,
} from 'lucide-react';
import { getOpenJobs, applyToJob, getCandidateApplications } from '@/lib/api';

const jobTypeColors: Record<string, string> = {
  'full-time': 'bg-green-500/10 text-green-500 border-green-500/20',
  'part-time': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  contract: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  internship: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

function JobCard({
  job,
  hasApplied,
  onAppliedSuccess,
}: {
  job: any;
  hasApplied: boolean;
  onAppliedSuccess?: (jobId: string) => void;
}) {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(hasApplied);
  const [error, setError] = useState<string | null>(null);
  const typeColors = jobTypeColors[job.job_type] || jobTypeColors['full-time'];

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link href={`/candidate/jobs/${job.id}`} className="block group">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 hover:border-candidate-300 dark:hover:border-candidate-600 transition-all">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-candidate-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Building className="h-6 w-6 text-candidate-600 dark:text-candidate-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400">
                  {job.title}
                </h3>
                {job.company && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{job.company}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${typeColors}`}>
              <Briefcase className="h-3 w-3" />
              {(job.job_type || 'full-time').replace('-', ' ')}
            </span>
            {job.location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                {job.location}
              </span>
            )}
            {job.remote && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Globe className="h-3 w-3" />
                Remote
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{job.description}</p>
          {job.required_skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.required_skills.slice(0, 4).map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-md"
                >
                  {skill}
                </span>
              ))}
              {job.required_skills.length > 4 && (
                <span className="px-2 py-1 text-gray-500 text-xs">+{job.required_skills.length - 4} more</span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              {job.salary_range && (
                <div className="flex items-center gap-1.5 text-sm">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{job.salary_range}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(job.created_at)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <motion.button
                onClick={handleQuickApply}
                disabled={isApplying || applied}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-xl ${
                  applied
                    ? 'bg-green-500 cursor-default'
                    : isApplying
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-wait'
                      : 'bg-gradient-to-r from-candidate-500 to-cyan-500 hover:shadow-lg'
                }`}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Applying...
                  </>
                ) : applied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Applied
                  </>
                ) : (
                  <>
                    Quick Apply
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </motion.button>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CandidateJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchJobsAndApplications = useCallback(async () => {
    try {
      const [jobsData, applicationsData] = await Promise.all([
        getOpenJobs(),
        getCandidateApplications(),
      ]);
      const filtered = (jobsData || []).filter(
        (j: { title?: string }) => j.title?.trim() !== 'Full Stack Developer'
      );
      setJobs(filtered);
      setFilteredJobs(filtered);
      const appliedIds = new Set(
        (applicationsData.applications || []).map((a: { job_id: string }) => a.job_id)
      );
      setAppliedJobIds(appliedIds);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchJobsAndApplications();
  }, [fetchJobsAndApplications]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchJobsAndApplications();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchJobsAndApplications]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredJobs(jobs);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredJobs(
      jobs.filter(
        (job) =>
          job.title?.toLowerCase().includes(term) ||
          job.description?.toLowerCase().includes(term) ||
          job.company?.toLowerCase().includes(term) ||
          job.required_skills?.some((s: string) => s.toLowerCase().includes(term))
      )
    );
  }, [searchTerm, jobs]);

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-gray-50 to-candidate-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-candidate-950/20 -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Browse Jobs</h1>
          <p className="text-gray-600 dark:text-gray-400">Discover opportunities that match your skills</p>
        </motion.div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search jobs, skills, or companies..."
            className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20"
          />
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 animate-pulse"
              >
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No jobs match your search' : "No jobs yet — but you're all set!"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm ? 'Try different keywords.' : 'New positions are added regularly.'}
            </p>
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-candidate-500 to-cyan-500 text-white rounded-xl font-medium"
            >
              <Zap className="h-4 w-4" /> Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                hasApplied={appliedJobIds.has(job.id)}
                onAppliedSuccess={(jobId) => setAppliedJobIds((prev) => new Set(prev).add(jobId))}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredJobs.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} available
          </p>
        )}
      </div>
    </div>
  );
}
