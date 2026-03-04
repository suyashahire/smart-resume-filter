'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, FileX } from 'lucide-react';
import { getCandidateResume, getResumeInsights } from '@/lib/api';
import {
  ResumeInsightsTabs,
  ResumeInsights,
  ATSScoreBreakdown,
  PercentileRankBadge,
  JobATSChecker,
  ImprovementSuggestions,
  OptimizeBeforeAfter,
} from '@/components/candidate/resume';
import type { InsightTab } from '@/components/candidate/resume';

export default function ResumeInsightsPage() {
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noResume, setNoResume] = useState(false);
  const [activeTab, setActiveTab] = useState<InsightTab>('overview');
  const [insightsData, setInsightsData] = useState<{
    match_score: number;
    keyword_coverage: number;
    formatting_health: number;
    matched_jobs?: { job_id: string; title: string; score: number }[];
  } | null>(null);

  useEffect(() => {
    async function loadResume() {
      setLoading(true);
      try {
        const result = await getCandidateResume();
        const resolved = result && 'resume' in result ? result.resume : result;
        const id = resolved?.id || resolved?._id;
        if (!id) {
          setNoResume(true);
          return;
        }
        setResumeId(id);

        // Pre-load main insights
        try {
          const insights = await getResumeInsights(id);
          setInsightsData(insights);
        } catch {
          // Non-critical
        }
      } catch {
        setNoResume(true);
      } finally {
        setLoading(false);
      }
    }
    loadResume();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 -z-10" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-candidate-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (noResume) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 -z-10" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Resume Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Upload a resume first to access the ATS dashboard.
            </p>
            <Link
              href="/candidate/resume"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white font-medium transition-colors"
            >
              Upload Resume
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 -z-10" />
      <div
        className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.04),transparent)]"
        aria-hidden
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/candidate/resume"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Resume ATS Panel
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Comprehensive analysis of your resume&apos;s ATS compatibility
              </p>
            </div>
          </div>

          {/* Quick scores */}
          {insightsData && (
            <div className="hidden sm:flex items-center gap-4">
              {[
                { label: 'Match', value: insightsData.match_score },
                { label: 'Keywords', value: insightsData.keyword_coverage },
                { label: 'Format', value: insightsData.formatting_health },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      item.value >= 80
                        ? 'text-green-600 dark:text-green-400'
                        : item.value >= 60
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {item.value}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <ResumeInsightsTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <ResumeInsights resumeId={resumeId || undefined} />
                <ATSScoreBreakdown resumeId={resumeId || undefined} />
              </div>
              <div className="lg:col-span-5 space-y-6">
                <PercentileRankBadge resumeId={resumeId || undefined} />
                {insightsData?.matched_jobs && insightsData.matched_jobs.length > 0 && (
                  <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm p-5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                      Top Matched Jobs
                    </h3>
                    <div className="space-y-2">
                      {insightsData.matched_jobs.map((job) => (
                        <Link
                          key={job.job_id}
                          href={`/candidate/jobs/${job.job_id}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {job.title}
                          </span>
                          <span
                            className={`text-sm font-semibold flex-shrink-0 ml-3 ${
                              job.score >= 80
                                ? 'text-green-600 dark:text-green-400'
                                : job.score >= 60
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {job.score}%
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ats' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <ATSScoreBreakdown resumeId={resumeId || undefined} />
              </div>
              <div className="lg:col-span-5">
                <PercentileRankBadge resumeId={resumeId || undefined} />
              </div>
            </div>
          )}

          {activeTab === 'job-match' && (
            <div className="max-w-3xl">
              <JobATSChecker resumeId={resumeId || undefined} />
            </div>
          )}

          {activeTab === 'improvements' && (
            <div className="max-w-3xl">
              <ImprovementSuggestions resumeId={resumeId || undefined} />
            </div>
          )}

          {activeTab === 'optimize' && (
            <div className="max-w-3xl">
              <OptimizeBeforeAfter resumeId={resumeId || undefined} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
