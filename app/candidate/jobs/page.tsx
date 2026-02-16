'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getOpenJobs, getCandidateApplications } from '@/lib/api';
import {
  SearchBar,
  FilterSidebar,
  JobCard,
  JobsEmptyState,
  JobCardSkeleton,
  type JobFilters,
} from '@/components/candidate/jobs';

const TITLE_FILTER = 'Full Stack Developer';

function applyFilters(
  jobs: any[],
  searchTerm: string,
  filters: JobFilters
): any[] {
  let result = [...jobs];

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(
      (job) =>
        job.title?.toLowerCase().includes(term) ||
        job.description?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.required_skills?.some((s: string) => s.toLowerCase().includes(term))
    );
  }

  if (filters.jobType) {
    result = result.filter(
      (j) => (j.job_type || '').toLowerCase() === filters.jobType.toLowerCase()
    );
  }

  if (filters.location) {
    result = result.filter(
      (j) => (j.location || '').toLowerCase() === filters.location.toLowerCase()
    );
  }

  if (filters.experience) {
    result = result.filter(
      (j) =>
        (j.experience_required || '').toLowerCase() ===
        filters.experience.toLowerCase()
    );
  }

  if (filters.workMode === 'remote') {
    result = result.filter((j) => !!j.remote);
  } else if (filters.workMode === 'onsite') {
    result = result.filter((j) => !j.remote);
  }

  if (filters.salaryRange) {
    result = result.filter(
      (j) => (j.salary_range || '').toLowerCase() === filters.salaryRange.toLowerCase()
    );
  }

  return result;
}

export default function CandidateJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<JobFilters>({
    jobType: '',
    location: '',
    experience: '',
    workMode: 'all',
    salaryRange: '',
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const fetchJobsAndApplications = useCallback(async () => {
    try {
      const [jobsData, applicationsData] = await Promise.all([
        getOpenJobs(),
        getCandidateApplications(),
      ]);
      const filtered = (jobsData || []).filter(
        (j: { title?: string }) => j.title?.trim() !== TITLE_FILTER
      );
      setJobs(filtered);
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

  const filteredJobs = useMemo(
    () => applyFilters(jobs, searchTerm, filters),
    [jobs, searchTerm, filters]
  );

  const hasActiveFilters =
    !!filters.jobType ||
    !!filters.location ||
    !!filters.experience ||
    filters.workMode !== 'all' ||
    !!filters.salaryRange;

  const clearFilters = () => {
    setFilters({
      jobType: '',
      location: '',
      experience: '',
      workMode: 'all',
      salaryRange: '',
    });
    setSearchTerm('');
  };

  const locations = useMemo(
    () => [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort() as string[],
    [jobs]
  );
  const experienceOptions = useMemo(
    () =>
      [...new Set(jobs.map((j) => j.experience_required).filter(Boolean))].sort() as string[],
    [jobs]
  );
  const salaryOptions = useMemo(
    () => [...new Set(jobs.map((j) => j.salary_range).filter(Boolean))].sort() as string[],
    [jobs]
  );

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 -z-10" />
      <div
        className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.04),transparent)]"
        aria-hidden
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
            Browse Jobs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Find your perfect opportunity from {jobs.length} open position{jobs.length !== 1 ? 's' : ''}.
          </p>
        </motion.header>

        {/* Sticky search hero + filters area */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="sticky top-20 z-20 mb-6"
        >
          <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm p-4 sm:p-5 space-y-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search jobs, skills, or keywords…"
            />
            {/* Mobile: Filters toggle */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 text-sm font-medium text-gray-900 dark:text-white"
              >
                Filters
                {hasActiveFilters && (
                  <span className="px-1.5 py-0.5 rounded-md bg-candidate-500/20 text-candidate-600 dark:text-candidate-400 text-xs">
                    Active
                  </span>
                )}
                {mobileFiltersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              <AnimatePresence>
                {mobileFiltersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <FilterSidebar
                      filters={filters}
                      onChange={setFilters}
                      locations={locations}
                      experienceOptions={experienceOptions}
                      salaryOptions={salaryOptions}
                      hasActiveFilters={hasActiveFilters}
                      onClearFilters={clearFilters}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Result count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between gap-4 mb-4"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredJobs.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-candidate-600 dark:text-candidate-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 rounded"
            >
              Clear filters
            </button>
          )}
        </motion.div>

        <div className="h-px bg-gray-200/80 dark:bg-gray-700/80 mb-6" aria-hidden />

        {/* Two-column: sidebar + results */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left: Filter sidebar (desktop only) */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-40">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                locations={locations}
                experienceOptions={experienceOptions}
                salaryOptions={salaryOptions}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            </div>
          </aside>

          {/* Right: Job results */}
          <main className="lg:col-span-8 xl:col-span-9">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              <ul className="space-y-4 list-none p-0 m-0">
                {filteredJobs.map((job, index) => (
                  <li key={job.id}>
                    <JobCard
                      job={job}
                      hasApplied={appliedJobIds.has(job.id)}
                      onAppliedSuccess={(id) =>
                        setAppliedJobIds((prev) => new Set(prev).add(id))
                      }
                      index={index}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <JobsEmptyState
                hasFilters={!!(searchTerm.trim() || hasActiveFilters)}
                onClearFilters={clearFilters}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
