'use client';

import { motion } from 'framer-motion';
import { FileText, Eye, Upload, Trash2, Clock } from 'lucide-react';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm transition-all duration-200 hover:border-candidate-400/40 dark:hover:border-candidate-500/40 hover:shadow-md';

export interface ResumeFileData {
  id?: string;
  filename?: string;
  file_name?: string;
  file_size?: number;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface ResumeFileCardProps {
  resume: ResumeFileData;
  onView?: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function formatFileSize(bytes: number | undefined): string {
  if (bytes == null || Number.isNaN(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ResumeFileCard({
  resume,
  onView,
  onReplace,
  onDelete,
  isDeleting = false,
}: ResumeFileCardProps) {
  const name = resume.filename ?? resume.file_name ?? 'Resume';
  const size = formatFileSize(resume.file_size);
  const updated = formatDate(resume.updated_at ?? resume.uploaded_at ?? resume.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={CARD_CLASS}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-candidate-500/15 dark:bg-candidate-500/20 border border-candidate-500/25 flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-candidate-600 dark:text-candidate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{name}</h3>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                Active resume
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>{size}</span>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {updated}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          {onView && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onView}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 hover:bg-candidate-500/10 dark:hover:bg-candidate-500/20 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View
            </motion.button>
          )}
          {onReplace && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReplace}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 hover:bg-candidate-500/10 dark:hover:bg-candidate-500/20 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Replace
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
