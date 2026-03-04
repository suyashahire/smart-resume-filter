'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, XCircle, Clock, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import * as api from '@/lib/api';

interface PendingApplicationsBannerProps {
  jobId: string;
  onActionComplete?: () => void;
}

export default function PendingApplicationsBanner({ jobId, onActionComplete }: PendingApplicationsBannerProps) {
  const [applications, setApplications] = useState<api.PendingApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    if (!jobId) return;
    setIsLoading(true);
    try {
      const data = await api.getPendingApplications(jobId);
      setApplications(data || []);
    } catch {
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      await api.approveApplication(applicationId);
      setApplications(prev => prev.filter(a => a.application_id !== applicationId));
      onActionComplete?.();
    } catch (err) {
      console.error('Failed to approve application:', err);
      alert('Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    setProcessingId(applicationId);
    try {
      await api.rejectApplication(applicationId, reason || undefined);
      setApplications(prev => prev.filter(a => a.application_id !== applicationId));
      onActionComplete?.();
    } catch (err) {
      console.error('Failed to reject application:', err);
      alert('Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return null;
  if (applications.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-200 dark:bg-amber-800">
            <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />
          </div>
          <span className="font-semibold text-amber-800 dark:text-amber-200">
            {applications.length} Pending Application{applications.length !== 1 ? 's' : ''}
          </span>
          <span className="text-sm text-amber-600 dark:text-amber-400">
            — candidates awaiting approval
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-2">
              {applications.map((app) => (
                <div
                  key={app.application_id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-amber-100 dark:border-gray-700"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {app.candidate_name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-3">
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(app.application_id)}
                      disabled={processingId === app.application_id}
                    >
                      {processingId === app.application_id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(app.application_id)}
                      disabled={processingId === app.application_id}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
