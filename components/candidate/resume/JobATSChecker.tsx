'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Briefcase,
  Search
} from 'lucide-react';
import { getJobSpecificATS, JobSpecificATS, getOpenJobs } from '@/lib/api';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

interface JobOption {
  id: string;
  title: string;
  company?: string;
}

interface JobATSCheckerProps {
  resumeId?: string;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBg(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function JobATSChecker({ resumeId }: JobATSCheckerProps) {
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [atsData, setAtsData] = useState<JobSpecificATS | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingATS, setLoadingATS] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load available jobs
  useEffect(() => {
    setLoadingJobs(true);
    getOpenJobs()
      .then((result) => {
        const jobList = (result || []).map((j: any) => ({
          id: j.id,
          title: j.title,
          company: j.company,
        }));
        setJobs(jobList);
      })
      .catch(() => {
        // Silently fail - no jobs available
        setJobs([]);
      })
      .finally(() => {
        setLoadingJobs(false);
      });
  }, []);

  // Load ATS data when job is selected
  const loadATSData = useCallback(async (jobId: string) => {
    if (!resumeId) return;

    setLoadingATS(true);
    setError(null);

    try {
      const data = await getJobSpecificATS(resumeId, jobId);
      setAtsData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to check ATS compatibility');
      setAtsData(null);
    } finally {
      setLoadingATS(false);
    }
  }, [resumeId]);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setDropdownOpen(false);
    setSearchQuery('');
    loadATSData(jobId);
  };

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.company && job.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  if (!resumeId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={CARD_CLASS}
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
            Job-Specific ATS Check
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a resume to check compatibility with specific jobs.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={CARD_CLASS}
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
          Job-Specific ATS Check
        </h3>

        {/* Job Selector */}
        <div className="relative mb-4">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={loadingJobs || jobs.length === 0}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-left hover:border-candidate-400 dark:hover:border-candidate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              {loadingJobs ? (
                <span className="text-sm text-gray-500">Loading jobs...</span>
              ) : selectedJob ? (
                <span className="text-sm text-gray-900 dark:text-white">
                  {selectedJob.title}
                  {selectedJob.company && (
                    <span className="text-gray-500 dark:text-gray-400"> · {selectedJob.company}</span>
                  )}
                </span>
              ) : jobs.length === 0 ? (
                <span className="text-sm text-gray-500">No jobs available</span>
              ) : (
                <span className="text-sm text-gray-500">Select a job to compare...</span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-hidden"
              >
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search jobs..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-candidate-500"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-48">
                  {filteredJobs.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No jobs found</div>
                  ) : (
                    filteredJobs.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => handleSelectJob(job.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          job.id === selectedJobId ? 'bg-candidate-50 dark:bg-candidate-900/20' : ''
                        }`}
                      >
                        <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {job.title}
                          </div>
                          {job.company && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {job.company}
                            </div>
                          )}
                        </div>
                        {job.id === selectedJobId && (
                          <CheckCircle2 className="h-4 w-4 text-candidate-500 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading State */}
        {loadingATS && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-candidate-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loadingATS && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ATS Results */}
        {atsData && !loadingATS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Score */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke={atsData.ats_score >= 80 ? '#22c55e' : atsData.ats_score >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                    animate={{ strokeDashoffset: (1 - atsData.ats_score / 100) * 2 * Math.PI * 24 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-base font-bold ${getScoreColor(atsData.ats_score)}`}>
                    {atsData.ats_score}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  Match Score for {atsData.job_title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {atsData.ats_score >= 80
                    ? 'Great match! Your resume aligns well with this job.'
                    : atsData.ats_score >= 60
                    ? 'Good potential, but some key skills are missing.'
                    : 'Consider tailoring your resume for this role.'}
                </p>
              </div>
            </div>

            {/* Required Skills */}
            <div className="p-3 rounded-lg border border-gray-200/60 dark:border-gray-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Required Skills
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  atsData.required_skills.match_rate >= 80
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : atsData.required_skills.match_rate >= 50
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {atsData.required_skills.match_rate}% match
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {atsData.required_skills.matched.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {skill}
                  </span>
                ))}
                {atsData.required_skills.missing.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  >
                    <XCircle className="h-3 w-3" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            {(atsData.preferred_skills.matched.length > 0 || atsData.preferred_skills.missing.length > 0) && (
              <div className="p-3 rounded-lg border border-gray-200/60 dark:border-gray-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Preferred Skills
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {atsData.preferred_skills.match_rate}% match
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {atsData.preferred_skills.matched.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {skill}
                    </span>
                  ))}
                  {atsData.preferred_skills.missing.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Match */}
            {atsData.experience.note && (
              <div className={`p-3 rounded-lg border flex items-start gap-2 ${
                atsData.experience.match
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
              }`}>
                {atsData.experience.match ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${
                  atsData.experience.match
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}>
                  {atsData.experience.note}
                </span>
              </div>
            )}

            {/* Suggestions */}
            {atsData.suggestions && atsData.suggestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Tailored Suggestions
                </span>
                <ul className="space-y-1.5">
                  {atsData.suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span className="text-candidate-500 font-bold flex-shrink-0">→</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* No selection state */}
        {!selectedJobId && !loadingJobs && jobs.length > 0 && (
          <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
            Select a job above to see how your resume matches its requirements.
          </div>
        )}
      </div>
    </motion.div>
  );
}
