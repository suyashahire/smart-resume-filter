'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getJobDetail, applyToJob, getCandidateApplications, getCandidateResume, getCandidateProfile } from '@/lib/api';
import {
  JobHeader,
  JobDescription,
  ApplySidebar,
  JobDetailSkeleton,
} from '@/components/candidate/job-detail';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState<number | undefined>(undefined);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!jobId) return;
      try {
        setIsLoading(true);
        setError('');
        const [jobData, applicationsData, resumeData, profileData] = await Promise.all([
          getJobDetail(jobId),
          getCandidateApplications(),
          getCandidateResume().catch(() => null),
          getCandidateProfile().catch(() => null),
        ]);
        setJob(jobData);
        const alreadyApplied = (applicationsData.applications || []).some(
          (a: { job_id: string }) => a.job_id === jobId
        );
        setApplied(alreadyApplied);
        const resolvedResume = (resumeData as any)?.resume ?? resumeData;
        setHasResume(!!(resolvedResume && (resolvedResume.id || resolvedResume.filename)));
        const profile = (profileData as any) ?? {};
        const checks = [
          profile?.name,
          profile?.email ?? (profileData as any)?.email,
          profile?.phone,
          profile?.resume_url ?? resolvedResume,
        ].filter(Boolean).length;
        setProfileCompleteness(checks ? Math.round((checks / 4) * 100) : undefined);
      } catch (err: any) {
        console.error('Failed to fetch job:', err);
        setError(err?.message || 'Failed to load job details');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [jobId]);

  const handleApply = async () => {
    setIsApplying(true);
    setApplyError(null);
    try {
      await applyToJob(jobId);
      setApplied(true);
    } catch (err: any) {
      setApplyError(err?.message || 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 -z-10" />
        <JobDetailSkeleton />
      </div>
    );
  }

  if ((error && !job) || !jobId) {
    return (
      <div className="min-h-screen">
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 -z-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Job not found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This job may have been removed.'}</p>
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white font-medium transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to jobs
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
        <JobHeader
          job={{
            title: job.title,
            company: job.company,
            location: job.location,
            salary_range: job.salary_range,
            job_type: job.job_type,
            remote: job.remote,
            created_at: job.created_at,
            match_score: job.match_score,
          }}
          formatDate={formatDate}
        />

        <div className="h-px bg-gray-200/80 dark:bg-gray-700/80 my-8" aria-hidden />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <main className="lg:col-span-8">
            <JobDescription
              description={job.description || ''}
              experience_required={job.experience_required}
              education_required={job.education_required}
            />
          </main>
          <aside className="lg:col-span-4">
            <ApplySidebar
              jobId={jobId}
              jobTitle={job.title}
              company={job.company}
              applied={applied}
              isApplying={isApplying}
              onApply={handleApply}
              applyError={applyError}
              requiredSkills={job.required_skills}
              preferredSkills={job.preferred_skills}
              hasResume={hasResume}
              profileCompleteness={profileCompleteness}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
