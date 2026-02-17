'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import * as api from '@/lib/api';
import {
  ResumeUploadZone,
  ResumeFileCard,
  ResumeTips,
  ResumeInsights,
} from '@/components/candidate/resume';

interface ResumeData {
  id?: string;
  filename?: string;
  file_name?: string;
  file_size?: number;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
  parsed_data?: Record<string, unknown>;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 10 * 1024 * 1024;

export default function CandidateResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessInZone, setShowSuccessInZone] = useState(false);

  const fetchResume = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.getCandidateResume();
      const resolved = (data as { resume?: ResumeData }).resume ?? (data as ResumeData);
      setResume(resolved && typeof resolved === 'object' && (resolved.id || resolved.filename) ? resolved : null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const lower = msg.toLowerCase();

      if (lower.includes('404') || lower.includes('not found')) {
        // No resume uploaded yet — not an error
        setResume(null);
      } else if (lower.includes('not authenticated') || lower.includes('401') || lower.includes('unauthorized')) {
        // Auth token expired / invalid — redirect to login
        window.location.href = '/candidate/login';
      } else if (lower.includes('load failed') || lower.includes('failed to fetch') || lower.includes('networkerror')) {
        setError('Could not connect to the server. Please check your connection and try again.');
      } else {
        setError(msg || 'Failed to fetch resume');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const handleFileSelect = useCallback(
    async (file: File) => {
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

        const progressInterval = setInterval(() => {
          setUploadProgress((p) => Math.min(p + 12, 90));
        }, 120);

        const data = await api.uploadCandidateResume(file);
        clearInterval(progressInterval);
        setUploadProgress(100);

        const resolved = (data as { resume?: ResumeData }).resume ?? (data as ResumeData);
        setResume(resolved && typeof resolved === 'object' ? resolved : { filename: file.name, file_size: file.size, updated_at: new Date().toISOString() });
        setSuccess(true);
        setShowSuccessInZone(true);
        setTimeout(() => setShowSuccessInZone(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload resume');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    []
  );

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-candidate-200 dark:border-candidate-800 border-t-candidate-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your resume…</p>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
            My Resume
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload and manage your resume for job applications
          </p>
        </motion.header>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
            <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700" aria-label="Dismiss">
              &times;
            </button>
          </motion.div>
        )}

        {success && !showSuccessInZone && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3"
          >
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">Resume uploaded successfully.</p>
          </motion.div>
        )}

        <ResumeUploadZone
          onFileSelect={handleFileSelect}
          openFileDialog={() => fileInputRef.current?.click()}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          success={showSuccessInZone}
          hasResume={!!resume}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
          }}
          className="sr-only"
          aria-hidden
        />

        <div className="h-px bg-gray-200/80 dark:bg-gray-700/80 my-8" aria-hidden />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-7 space-y-6">
            {resume && (
              <ResumeFileCard
                resume={resume}
                onView={() => { }}
                onReplace={handleReplace}
              />
            )}
            <ResumeTips />
          </div>
          <div className="lg:col-span-5">
            <ResumeInsights />
          </div>
        </div>
      </div>
    </div>
  );
}
