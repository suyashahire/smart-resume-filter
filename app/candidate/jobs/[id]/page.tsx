'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  CheckCircle,
  Send,
  Loader2,
} from 'lucide-react';
import { getJobDetail, applyToJob, getCandidateApplications } from '@/lib/api';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchJobAndAppliedStatus() {
      try {
        const [jobData, applicationsData] = await Promise.all([
          getJobDetail(jobId),
          getCandidateApplications(),
        ]);
        setJob(jobData);
        const alreadyApplied = (applicationsData.applications || []).some(
          (a: { job_id: string }) => a.job_id === jobId
        );
        if (alreadyApplied) setApplied(true);
      } catch (error: any) {
        console.error('Failed to fetch job:', error);
        setError(error.message || 'Failed to load job details');
      } finally {
        setIsLoading(false);
      }
    }

    if (jobId) {
      fetchJobAndAppliedStatus();
    }
  }, [jobId]);

  const handleApply = async () => {
    setIsApplying(true);
    setError('');

    try {
      await applyToJob(jobId);
      setApplied(true);
    } catch (err: any) {
      setError(err.message || 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-candidate-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Job Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/candidate/jobs"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-candidate-600 text-white rounded-lg hover:bg-candidate-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Jobs</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          href="/candidate/jobs"
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Jobs</span>
        </Link>
      </motion.div>

      {/* Job Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-candidate-100 dark:bg-candidate-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building className="h-8 w-8 text-candidate-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {job.title}
              </h1>
              {job.company && (
                <p className="text-lg text-gray-600 dark:text-gray-400">{job.company}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Briefcase className="h-4 w-4 mr-1" />
                  {job.job_type.replace('-', ' ')}
                </span>
                {job.location && (
                  <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </span>
                )}
                {job.salary_range && (
                  <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {job.salary_range}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            {applied ? (
              <div className="flex items-center space-x-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Applied</span>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="flex items-center space-x-2 px-6 py-3 bg-candidate-600 text-white rounded-xl hover:bg-candidate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Apply Now</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 inline mr-1" />
            Posted {formatDate(job.created_at)}
          </span>
        </div>
      </motion.div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Job Description
            </h2>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Requirements
            </h2>
            
            {job.experience_required && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{job.experience_required}</p>
              </div>
            )}

            {job.education_required && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Education
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{job.education_required}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Required Skills */}
          {job.required_skills?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-candidate-100 dark:bg-candidate-900/30 text-candidate-700 dark:text-candidate-300 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {job.preferred_skills?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preferred Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.preferred_skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply Card */}
          <div className="bg-gradient-to-br from-candidate-500 to-cyan-500 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Ready to apply?</h3>
            <p className="text-white/80 text-sm mb-4">
              Make sure your resume is up to date before applying.
            </p>
            <Link
              href="/candidate/resume"
              className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Update Resume
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
