'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Target,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { getJobSpecificATS, getCandidateResume, JobSpecificATS, SkillMatchEntry } from '@/lib/api';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Great match!';
  if (score >= 60) return 'Good potential';
  return 'Needs work';
}

interface JobATSPreviewProps {
  jobId: string;
}

export default function JobATSPreview({ jobId }: JobATSPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [atsData, setAtsData] = useState<JobSpecificATS | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [noResume, setNoResume] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get candidate resume first
        const resumeResult = await getCandidateResume().catch(() => null);
        const resolved = resumeResult && 'resume' in resumeResult ? resumeResult.resume : resumeResult;
        const rId = resolved?.id || resolved?._id;

        if (!rId) {
          setNoResume(true);
          setLoading(false);
          return;
        }
        setResumeId(rId);

        // Get job-specific ATS data
        const data = await getJobSpecificATS(rId, jobId);
        setAtsData(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [jobId]);

  // No resume uploaded
  if (noResume) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={CARD_CLASS}
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
            ATS Match Score
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Upload your resume to see how well you match this job.
          </p>
          <Link
            href="/candidate/resume"
            className="inline-flex items-center gap-2 text-sm font-medium text-candidate-600 dark:text-candidate-400 hover:text-candidate-700 dark:hover:text-candidate-300 transition-colors"
          >
            Upload resume
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // Loading
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={CARD_CLASS}
      >
        <div className="p-5 flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-candidate-500 animate-spin" />
        </div>
      </motion.div>
    );
  }

  // Error
  if (error || !atsData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={CARD_CLASS}
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
            ATS Match Score
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Unable to calculate match score. Try again later.
          </p>
        </div>
      </motion.div>
    );
  }

  const topMatched = atsData.required_skills.matched.slice(0, 4);
  const topMissing = atsData.required_skills.missing.slice(0, 3);
  const hasMore =
    atsData.required_skills.matched.length + atsData.required_skills.missing.length > 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={CARD_CLASS}
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-candidate-500 dark:text-candidate-400" />
          ATS Match Score
        </h3>

        {/* Score ring + label */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-gray-200 dark:text-gray-700"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke={
                  atsData.ats_score >= 80
                    ? '#22c55e'
                    : atsData.ats_score >= 60
                    ? '#f59e0b'
                    : '#ef4444'
                }
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 27}
                initial={{ strokeDashoffset: 2 * Math.PI * 27 }}
                animate={{
                  strokeDashoffset: (1 - atsData.ats_score / 100) * 2 * Math.PI * 27,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${getScoreColor(atsData.ats_score)}`}>
                {atsData.ats_score}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${getScoreColor(atsData.ats_score)}`}>
              {getScoreLabel(atsData.ats_score)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {atsData.required_skills.match_rate}% required skills matched
            </p>
          </div>
        </div>

        {/* Skill pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {topMatched.map((entry) => {
            const skill = typeof entry === 'string' ? entry : (entry as SkillMatchEntry).skill;
            return (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                <CheckCircle2 className="h-3 w-3" />
                {skill}
              </span>
            );
          })}
          {topMissing.map((entry) => {
            const skill = typeof entry === 'string' ? entry : (entry as SkillMatchEntry).skill;
            return (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              >
                <XCircle className="h-3 w-3" />
                {skill}
              </span>
            );
          })}
        </div>

        {/* Experience note */}
        {atsData.experience.note && (
          <div
            className={`flex items-start gap-2 p-2.5 rounded-lg text-xs mb-3 ${
              atsData.experience.match
                ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400'
                : 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400'
            }`}
          >
            {atsData.experience.match ? (
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            )}
            {atsData.experience.note}
          </div>
        )}

        {/* Top suggestion */}
        {atsData.suggestions.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-start gap-1.5">
            <Target className="h-3.5 w-3.5 text-candidate-500 flex-shrink-0 mt-0.5" />
            {atsData.suggestions[0]}
          </p>
        )}

        {/* Link to full analysis on resume page */}
        {resumeId && (
          <Link
            href="/candidate/resume"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-candidate-600 dark:text-candidate-400 hover:text-candidate-700 dark:hover:text-candidate-300 transition-colors"
          >
            {hasMore ? 'See full analysis' : 'View detailed breakdown'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
