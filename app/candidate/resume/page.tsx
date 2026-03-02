'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Plus, FileText, X } from 'lucide-react';
import * as api from '@/lib/api';
import { ResumeVersion } from '@/lib/api';
import {
  ResumeUploadZone,
  ResumeFileCard,
  ResumeTips,
  ResumeVersionTabs,
  PercentileRankBadge,
  ATSScoreBreakdown,
  ImprovementSuggestions,
  JobATSChecker,
} from '@/components/candidate/resume';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_VERSIONS = 3;

export default function CandidateResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessInZone, setShowSuccessInZone] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVersionLabel, setNewVersionLabel] = useState('');

  // Get active resume object
  const activeResume = versions.find((v) => v.id === activeVersionId) || null;

  // Fetch all resume versions
  const fetchVersions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.getCandidateResumes();
      setVersions(data || []);

      // Set active to primary or first version
      if (data && data.length > 0) {
        const primary = data.find((v: ResumeVersion) => v.is_primary);
        setActiveVersionId(primary ? primary.id : data[0].id);
      } else {
        setActiveVersionId(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const lower = msg.toLowerCase();

      if (lower.includes('404') || lower.includes('not found')) {
        // No resumes yet
        setVersions([]);
        setActiveVersionId(null);
      } else if (lower.includes('not authenticated') || lower.includes('401') || lower.includes('unauthorized') || lower.includes('credentials')) {
        window.location.href = '/candidate/login';
      } else if (lower.includes('load failed') || lower.includes('failed to fetch') || lower.includes('networkerror')) {
        setError('Could not connect to the server. Please check your connection and try again.');
      } else {
        setError(msg || 'Failed to fetch resumes');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Handle file upload
  const handleFileSelect = useCallback(
    async (file: File, label?: string) => {
      if (!file) return;
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Please upload a PDF or Word document (PDF, DOC, DOCX).');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('File size must be less than 10MB.');
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);
        setError('');
        setSuccess(false);
        setShowSuccessInZone(false);
        setShowAddModal(false);

        const progressInterval = setInterval(() => {
          setUploadProgress((p) => Math.min(p + 12, 90));
        }, 120);

        const data = await api.uploadCandidateResumeVersion(file, label || undefined);
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Refresh versions list
        await fetchVersions();

        // Select the newly uploaded version
        if (data && data.id) {
          setActiveVersionId(data.id);
        }

        setSuccess(true);
        setShowSuccessInZone(true);
        setNewVersionLabel('');
        setTimeout(() => setShowSuccessInZone(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload resume');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [fetchVersions]
  );

  // Handle set primary
  const handleSetPrimary = async (versionId: string) => {
    try {
      await api.setResumeAsPrimary(versionId);
      // Update local state
      setVersions((prev) =>
        prev.map((v) => ({
          ...v,
          is_primary: v.id === versionId,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary resume');
    }
  };

  // Handle rename
  const handleRename = async (versionId: string, newLabel: string) => {
    try {
      await api.updateResumeLabel(versionId, newLabel);
      setVersions((prev) =>
        prev.map((v) =>
          v.id === versionId ? { ...v, version_label: newLabel } : v
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename resume');
    }
  };

  // Handle delete
  const handleDelete = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this resume version?')) return;

    try {
      await api.deleteCandidateResume(versionId);
      // Refresh versions
      await fetchVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resume');
    }
  };

  // Handle view resume
  const handleViewResume = async (resumeId: string) => {
    try {
      setError('');
      await api.viewCandidateResume(resumeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to view resume');
    }
  };

  // Handle add version button
  const handleAddVersion = () => {
    if (versions.length >= MAX_VERSIONS) {
      setError(`Maximum ${MAX_VERSIONS} resume versions allowed.`);
      return;
    }
    setShowAddModal(true);
  };

  // Handle file selection from modal
  const handleModalFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, newVersionLabel || undefined);
    }
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-candidate-200 dark:border-candidate-800 border-t-candidate-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your resumes…</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                Resume Manager
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your resumes, check ATS compatibility, and see how you compare to other candidates
              </p>
            </div>
            {versions.length > 0 && versions.length < MAX_VERSIONS && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddVersion}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 text-white shadow-md shadow-candidate-500/25 hover:bg-candidate-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Version
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
              <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert */}
        <AnimatePresence>
          {success && !showSuccessInZone && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3"
            >
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400">Resume uploaded successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Resumes - Upload Zone */}
        {versions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <ResumeUploadZone
              onFileSelect={(file) => handleFileSelect(file)}
              openFileDialog={() => fileInputRef.current?.click()}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              success={showSuccessInZone}
              hasResume={false}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
              className="sr-only"
              aria-hidden
            />
            <div className="mt-8">
              <ResumeTips />
            </div>
          </motion.div>
        ) : (
          <>
            {/* Version Tabs */}
            <ResumeVersionTabs
              versions={versions}
              activeVersionId={activeVersionId}
              onSelect={setActiveVersionId}
              onAddVersion={handleAddVersion}
              onSetPrimary={handleSetPrimary}
              onRename={handleRename}
              onDelete={handleDelete}
              maxVersions={MAX_VERSIONS}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Left Column - Resume Details & ATS */}
              <div className="lg:col-span-7 space-y-6">
                {/* Active Resume Card */}
                {activeResume && (
                  <ResumeFileCard
                    resume={{
                      id: activeResume.id,
                      file_name: activeResume.file_name,
                      file_size: activeResume.file_size,
                      created_at: activeResume.created_at,
                      updated_at: activeResume.updated_at,
                    }}
                    onView={() => {
                      if (activeResume.id) {
                        handleViewResume(activeResume.id);
                      }
                    }}
                    onReplace={() => {
                      // For now, open upload modal for new version
                      handleAddVersion();
                    }}
                  />
                )}

                {/* ATS Score Breakdown */}
                <ATSScoreBreakdown resumeId={activeVersionId || undefined} />

                {/* Job-Specific ATS Checker */}
                <JobATSChecker resumeId={activeVersionId || undefined} />

                {/* Resume Tips */}
                <ResumeTips />
              </div>

              {/* Right Column - Rankings & Improvements */}
              <div className="lg:col-span-5 space-y-6">
                {/* Percentile Ranking */}
                <PercentileRankBadge resumeId={activeVersionId || undefined} />

                {/* Improvement Suggestions */}
                <ImprovementSuggestions resumeId={activeVersionId || undefined} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileInputChange}
        className="sr-only"
        aria-hidden
      />

      {/* Add Version Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-candidate-500/15 dark:bg-candidate-500/20 border border-candidate-500/25 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-candidate-600 dark:text-candidate-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Add Resume Version
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Version {versions.length + 1} of {MAX_VERSIONS}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Version Label (optional)
                    </label>
                    <input
                      type="text"
                      value={newVersionLabel}
                      onChange={(e) => setNewVersionLabel(e.target.value)}
                      placeholder="e.g., Technical, Marketing, General"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-candidate-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleModalFileSelect}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-candidate-500 text-white shadow-md shadow-candidate-500/25 hover:bg-candidate-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Choose File
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
