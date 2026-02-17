'use client';

import { motion } from 'framer-motion';
import { Upload, RefreshCw, CheckCircle } from 'lucide-react';

const SUPPORTED = 'PDF, DOC, DOCX (Max 10MB)';

interface ResumeUploadZoneProps {
  onFileSelect: (file: File) => void;
  openFileDialog: () => void;
  isUploading: boolean;
  uploadProgress?: number;
  success?: boolean;
  hasResume: boolean;
  disabled?: boolean;
}

export default function ResumeUploadZone({
  onFileSelect,
  openFileDialog,
  isUploading,
  uploadProgress = 0,
  success = false,
  hasResume,
  disabled = false,
}: ResumeUploadZoneProps) {
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) (e.currentTarget as HTMLElement).dataset.drag = 'true';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).dataset.drag = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).dataset.drag = '';
    if (disabled || isUploading || !e.dataTransfer.files?.length) return;
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) openFileDialog();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        data-drag=""
        className={`
          group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 sm:p-12 text-center cursor-pointer transition-all duration-300
          min-h-[220px] sm:min-h-[260px]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 focus-visible:ring-offset-2
          ${disabled || isUploading
            ? 'cursor-not-allowed opacity-70 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30'
            : 'border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40 hover:border-candidate-400/60 dark:hover:border-candidate-500/60 hover:bg-candidate-500/5 dark:hover:bg-candidate-500/5'
          }
          [&[data-drag=true]]:border-candidate-500 [&[data-drag=true]]:bg-candidate-500/10 dark:[&[data-drag=true]]:bg-candidate-500/10 [&[data-drag=true]]:scale-[1.01]
        `}
      >
        {/* Soft glow on drag */}
        <div
          className="absolute -inset-px rounded-[18px] pointer-events-none opacity-0 transition-opacity duration-300 border-2 border-dashed border-candidate-500/40 bg-candidate-500/5 dark:bg-candidate-500/10 group-data-[drag=true]:opacity-100"
          aria-hidden
        />

        {success ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 dark:bg-green-500/25 border border-green-500/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Resume uploaded</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">You can replace it anytime above</p>
          </motion.div>
        ) : isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-candidate-500/20 dark:bg-candidate-500/25 border border-candidate-500/30 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-candidate-600 dark:text-candidate-400 animate-spin" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Uploading…</p>
            <div className="w-48 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-candidate-500 dark:bg-candidate-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, uploadProgress)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-candidate-500/15 dark:bg-candidate-500/20 border border-candidate-500/25 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-candidate-600 dark:text-candidate-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {hasResume ? 'Update your resume' : 'Upload your resume'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm">
              Drag and drop your file here, or click to browse. We'll use it for your applications.
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white shadow-sm shadow-candidate-500/20 transition-colors pointer-events-none">
              <Upload className="h-4 w-4" />
              {hasResume ? 'Replace resume' : 'Select file'}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">{SUPPORTED}</p>
          </>
        )}
      </div>
    </motion.div>
  );
}
