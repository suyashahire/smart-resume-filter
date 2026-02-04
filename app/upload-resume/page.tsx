'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle, AlertCircle, Cloud, HardDrive } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useStore } from '@/store/useStore';
import { parseResume } from '@/lib/mockApi';
import * as api from '@/lib/api';

export default function UploadResumePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  const { addResume, setIsLoading, clearAllData, useRealApi, isAuthenticated } = useStore();

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    // Clear any existing data before processing new resumes
    clearAllData();

    setIsProcessing(true);
    setIsLoading(true);
    setProcessedCount(0);
    setError(null);

    try {
      if (useRealApi && isAuthenticated) {
        // Use real backend API
        setProcessingStatus('Uploading to server...');
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setProcessingStatus(`Processing ${file.name}...`);
          
          try {
            const response = await api.uploadResume(file);
            
            const resume = {
              id: response.id,
              name: response.parsed_data.name || 'Unknown',
              email: response.parsed_data.email || '',
              phone: response.parsed_data.phone || '',
              skills: response.parsed_data.skills || [],
              education: response.parsed_data.education || '',
              experience: response.parsed_data.experience || '',
              score: 0,
              file
            };

            addResume(resume);
            setProcessedCount(i + 1);
          } catch (err) {
            console.error(`Error processing ${file.name}:`, err);
            // Continue with other files
          }
        }
        
        setProcessingStatus('Processing complete!');
      } else {
        // Use mock API (demo mode)
        setProcessingStatus('Processing locally (Demo Mode)...');
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setProcessingStatus(`Parsing ${file.name}...`);
          
          const parsedData = await parseResume(file);
          
          const resume = {
            id: `resume-${Date.now()}-${i}`,
            ...parsedData,
            name: parsedData.name || 'Unknown',
            email: parsedData.email || '',
            phone: parsedData.phone || '',
            skills: parsedData.skills || [],
            education: parsedData.education || '',
            experience: parsedData.experience || '',
            score: 0,
            file
          };

          addResume(resume);
          setProcessedCount(i + 1);
        }
        
        setProcessingStatus('Processing complete!');
      }

      // Navigate to job description page after processing
      setTimeout(() => {
        router.push('/job-description');
      }, 1000);
    } catch (err) {
      console.error('Error processing resumes:', err);
      setError(err instanceof Error ? err.message : 'Failed to process resumes');
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Resumes</h1>
            </div>
            
            {/* API Mode Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
              useRealApi && isAuthenticated
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            }`}>
              {useRealApi && isAuthenticated ? (
                <>
                  <Cloud className="h-4 w-4" />
                  <span>Cloud Processing</span>
                </>
              ) : (
                <>
                  <HardDrive className="h-4 w-4" />
                  <span>Demo Mode</span>
                </>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Upload candidate resumes to begin the screening process. Supported formats: PDF, DOCX
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-400">Error processing resumes</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        <Card>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            accept=".pdf,.docx"
            multiple={true}
            maxSize={10}
          />

          {files.length > 0 && !isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-between items-center"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
              <Button onClick={handleProcess} size="lg">
                Process Resumes
              </Button>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">Processing Resumes...</span>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {processedCount} / {files.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(processedCount / files.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-primary-600 rounded-full"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  {processingStatus}
                </p>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What happens next?</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Resume Parsing (NLP)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {useRealApi && isAuthenticated 
                      ? 'Our spaCy-powered NLP engine extracts key information from each resume including skills, education, and experience.'
                      : 'Demo mode simulates NLP parsing. Connect to backend for real AI-powered extraction.'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Job Matching (ML)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {useRealApi && isAuthenticated
                      ? 'Sentence-BERT semantic matching compares candidate skills against job requirements.'
                      : 'Demo mode uses keyword matching. Connect to backend for ML-powered semantic matching.'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">AI Ranking</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Candidates are ranked based on skill match (70%), experience (20%), and education (10%).
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* API Info */}
        {!useRealApi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-400">Demo Mode Active</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    You&apos;re using simulated data. Start the backend server for real AI-powered resume parsing.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
