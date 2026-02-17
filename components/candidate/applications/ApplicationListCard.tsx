'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  Calendar,
  Eye,
  Loader2,
  Trash2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { statusConfig } from './statusConfig';
import { withdrawApplication, deleteApplication } from '@/lib/api';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm transition-all duration-200 hover:border-candidate-400/40 dark:hover:border-candidate-500/40 hover:shadow-md';

export interface ApplicationItem {
  id: string;
  job_title?: string;
  company?: string;
  status: string;
  applied_at: string;
  score?: number;
  score_visible?: boolean;
  feedback?: string;
  location?: string;
}

interface ApplicationListCardProps {
  application: ApplicationItem;
  index?: number;
  onWithdrawn?: (id: string) => void;
}

function getScoreColor(score: number) {
  if (score >= 75) return 'text-green-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ApplicationListCard({
  application,
  index = 0,
  onWithdrawn,
}: ApplicationListCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'withdraw' | 'delete'>('withdraw');
  const [isRemoved, setIsRemoved] = useState(false);
  const config = statusConfig[application.status] || statusConfig.applied;
  const Icon = config.icon;

  const isWithdrawn = application.status === 'withdrawn';
  const canWithdraw = !['hired', 'withdrawn', 'rejected'].includes(application.status);
  const canDelete = isWithdrawn || application.status === 'rejected';

  const openConfirm = (action: 'withdraw' | 'delete', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmAction(action);
    setShowConfirm(true);
  };

  const handleConfirmAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProcessing(true);
    try {
      if (confirmAction === 'withdraw') {
        await withdrawApplication(application.id);
      } else {
        await deleteApplication(application.id);
      }
      setShowConfirm(false);
      // Animate out then callback
      setIsRemoved(true);
      setTimeout(() => {
        onWithdrawn?.(application.id);
      }, 400);
    } catch {
      // keep modal open on error
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmTitle = confirmAction === 'withdraw' ? 'Withdraw application?' : 'Delete application?';
  const confirmDescription =
    confirmAction === 'withdraw'
      ? "This will permanently withdraw and remove your application. You can reapply later if the role is still open."
      : "This will permanently delete this application from your records. This action can't be undone.";
  const confirmButtonText = confirmAction === 'withdraw' ? 'Withdraw' : 'Delete';
  const processingText = confirmAction === 'withdraw' ? 'Withdrawing...' : 'Deleting...';

  return (
    <AnimatePresence>
      {!isRemoved && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -60, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
          transition={{ delay: index * 0.04, duration: 0.25 }}
          layout
        >
          <div className={`${CARD_CLASS} p-5`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Logo + content */}
              <Link
                href={`/candidate/applications/${application.id}`}
                className="flex flex-1 min-w-0 gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-candidate-500/15 to-cyan-500/15 dark:from-candidate-500/10 dark:to-cyan-500/10 border border-candidate-200/50 dark:border-candidate-700/30 flex items-center justify-center flex-shrink-0">
                  <Building className="h-6 w-6 text-candidate-600 dark:text-candidate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-candidate-600 dark:group-hover:text-candidate-400 truncate transition-colors">
                    {application.job_title || 'Unknown role'}
                  </h3>
                  {application.company && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {application.company}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(application.applied_at)}
                    </span>
                    {application.location && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{application.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>

              {/* Status + actions */}
              <div className="flex flex-wrap items-center gap-3 flex-shrink-0 sm:flex-nowrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${config.bgColor} ${config.borderColor} ${config.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </span>
                {application.score_visible && application.score !== undefined && (
                  <span className={`text-sm font-semibold tabular-nums ${getScoreColor(application.score)}`}>
                    {Math.round(application.score)}%
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/candidate/applications/${application.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Link>
                  {canWithdraw && (
                    <button
                      type="button"
                      onClick={(e) => openConfirm('withdraw', e)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Withdraw
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => openConfirm('delete', e)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>

            {application.feedback && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-candidate-700 dark:text-candidate-300 line-clamp-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Feedback: </span>
                  {application.feedback}
                </p>
              </div>
            )}
          </div>

          {/* Confirm modal */}
          {showConfirm && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                aria-hidden
                onClick={() => !isProcessing && setShowConfirm(false)}
              />
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{confirmTitle}</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 ml-[52px]">
                  {confirmDescription}
                </p>
                {application.job_title && (
                  <div className="mb-4 ml-[52px] px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{application.job_title}</p>
                    {application.company && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{application.company}</p>
                    )}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => !isProcessing && setShowConfirm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {processingText}
                      </>
                    ) : (
                      confirmButtonText
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
