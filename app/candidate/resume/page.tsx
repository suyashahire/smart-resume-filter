'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

interface ResumeData {
  id: string;
  filename: string;
  uploaded_at: string;
  file_size: number;
  parsed_data?: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience_years?: number;
    education?: string[];
    summary?: string;
  };
}

export default function CandidateResumePage() {
  const { user } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.getCandidateResume();
      setResume(data);
    } catch (err) {
      // No resume found is not an error
      if (err instanceof Error && err.message.includes('404')) {
        setResume(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch resume');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      setSuccess('');
      
      const data = await api.uploadCandidateResume(file);
      setResume(data);
      setSuccess('Resume uploaded successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-candidate-200 border-t-candidate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Resume
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload and manage your resume for job applications
        </p>
      </motion.div>

      {/* Alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
            &times;
          </button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3"
        >
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 dark:text-green-400">{success}</p>
        </motion.div>
      )}

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`mb-8 p-8 border-2 border-dashed rounded-2xl text-center transition-all ${
          dragActive
            ? 'border-candidate-500 bg-candidate-50 dark:bg-candidate-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-candidate-400 dark:hover:border-candidate-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="w-16 h-16 bg-candidate-100 dark:bg-candidate-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          {isUploading ? (
            <RefreshCw className="h-8 w-8 text-candidate-600 dark:text-candidate-400 animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-candidate-600 dark:text-candidate-400" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isUploading ? 'Uploading...' : resume ? 'Update your resume' : 'Upload your resume'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Drag and drop your file here, or click to browse
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-candidate-500 to-cyan-500 text-white rounded-xl font-medium hover:from-candidate-600 hover:to-cyan-600 transition-all disabled:opacity-50"
        >
          <Upload className="h-5 w-5" />
          {resume ? 'Replace Resume' : 'Select File'}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Supported formats: PDF, DOC, DOCX (Max 10MB)
        </p>
      </motion.div>

      {/* Current Resume */}
      {resume && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          {/* Resume Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-candidate-100 dark:bg-candidate-900/30 rounded-xl flex items-center justify-center">
                  <FileText className="h-7 w-7 text-candidate-600 dark:text-candidate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {resume.filename}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>{formatFileSize(resume.file_size)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(resume.uploaded_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Preview"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Information */}
          {resume.parsed_data && (
            <div className="p-6">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Extracted Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact</h5>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {resume.parsed_data.name && (
                      <p><span className="font-medium">Name:</span> {resume.parsed_data.name}</p>
                    )}
                    {resume.parsed_data.email && (
                      <p><span className="font-medium">Email:</span> {resume.parsed_data.email}</p>
                    )}
                    {resume.parsed_data.phone && (
                      <p><span className="font-medium">Phone:</span> {resume.parsed_data.phone}</p>
                    )}
                  </div>
                </div>

                {/* Experience */}
                {resume.parsed_data.experience_years !== undefined && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {resume.parsed_data.experience_years} years of experience
                    </p>
                  </div>
                )}

                {/* Skills */}
                {resume.parsed_data.skills && resume.parsed_data.skills.length > 0 && (
                  <div className="md:col-span-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {resume.parsed_data.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-candidate-100 dark:bg-candidate-900/30 text-candidate-700 dark:text-candidate-300 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resume.parsed_data.education && resume.parsed_data.education.length > 0 && (
                  <div className="md:col-span-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Education</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {resume.parsed_data.education.map((edu, index) => (
                        <li key={index}>{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Summary */}
                {resume.parsed_data.summary && (
                  <div className="md:col-span-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {resume.parsed_data.summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-6 bg-candidate-50 dark:bg-candidate-900/20 rounded-2xl border border-candidate-200 dark:border-candidate-800"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Tips for a Great Resume
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-candidate-600 dark:text-candidate-400 flex-shrink-0 mt-0.5" />
            <span>Keep it concise - aim for 1-2 pages maximum</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-candidate-600 dark:text-candidate-400 flex-shrink-0 mt-0.5" />
            <span>Use clear headings and bullet points for easy scanning</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-candidate-600 dark:text-candidate-400 flex-shrink-0 mt-0.5" />
            <span>Include relevant keywords from job descriptions</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-candidate-600 dark:text-candidate-400 flex-shrink-0 mt-0.5" />
            <span>Quantify achievements with numbers when possible</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-candidate-600 dark:text-candidate-400 flex-shrink-0 mt-0.5" />
            <span>Use a clean, professional format (avoid excessive colors/graphics)</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
