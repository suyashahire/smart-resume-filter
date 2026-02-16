'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building,
  Clock,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { ApplicationTimeline } from '@/components/candidate';
import { getApplicationDetail, withdrawApplication } from '@/lib/api';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchApplication() {
      try {
        const data = await getApplicationDetail(applicationId);
        setApplication(data);
      } catch (error: any) {
        console.error('Failed to fetch application:', error);
        setError(error.message || 'Failed to load application');
      } finally {
        setIsLoading(false);
      }
    }

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await withdrawApplication(applicationId);
      // Refresh application data
      const data = await getApplicationDetail(applicationId);
      setApplication(data);
      setShowWithdrawConfirm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw application');
    } finally {
      setIsWithdrawing(false);
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

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const canWithdraw = application && !['hired', 'withdrawn', 'rejected'].includes(application.status);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-candidate-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Application Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/candidate/applications"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-candidate-600 text-white rounded-lg hover:bg-candidate-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Applications</span>
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
          href="/candidate/applications"
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Applications</span>
        </Link>
      </motion.div>

      {/* Application Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-candidate-100 dark:bg-candidate-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building className="h-8 w-8 text-candidate-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {application.job_title || 'Unknown Position'}
            </h1>
            {application.company && (
              <p className="text-lg text-gray-600 dark:text-gray-400">{application.company}</p>
            )}
            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              Applied {formatDate(application.applied_at)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/candidate/messages"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-candidate-600 text-white rounded-lg hover:bg-candidate-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Message Recruiter</span>
          </Link>

          {canWithdraw && (
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Withdraw Application</span>
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Application Status
          </h2>
          <ApplicationTimeline
            currentStatus={application.status}
            statusHistory={application.status_history || []}
          />
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Match Score */}
          {application.score_visible && application.score !== undefined && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Match Score
              </h3>
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(application.score)}`}>
                  {Math.round(application.score)}%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Based on your resume and job requirements
                </p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {application.feedback && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recruiter Feedback
              </h3>
              <div className="bg-candidate-50 dark:bg-candidate-900/20 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {application.feedback}
                </p>
                {application.feedback_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Received {formatDate(application.feedback_at)}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Withdraw Application?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to withdraw your application for{' '}
              <strong>{application.job_title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
