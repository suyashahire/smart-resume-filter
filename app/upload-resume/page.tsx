'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, CheckCircle, AlertCircle, Cloud, HardDrive, Upload, Sparkles, ArrowRight, Zap, Brain, Target, Briefcase, Plus, X, FolderPlus, Users, Play, Edit3 } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import { useStore, Job } from '@/store/useStore';
import { parseResume } from '@/lib/mockApi';
import * as api from '@/lib/api';

export default function UploadResumePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  // Post-processing modal state
  const [showJobAssignmentModal, setShowJobAssignmentModal] = useState(false);
  const [processedResumeIds, setProcessedResumeIds] = useState<string[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  
  const { 
    addResume, 
    setIsLoading, 
    useRealApi, 
    isAuthenticated,
    jobs,
    assignCandidateToJob,
    resumes,
    filteredResumes,
    setFilteredResumes,
    setResumes
  } = useStore();
  
  // Get open/draft jobs
  const openJobs = useMemo(() => jobs.filter(j => j.status === 'open' || j.status === 'draft'), [jobs]);
  
  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    // Don't clear existing data - allow adding more resumes to existing screened results
    // clearAllData();
    setIsProcessing(true);
    setIsLoading(true);
    setProcessedCount(0);
    setError(null);
    const newResumeIds: string[] = [];

    try {
      if (useRealApi && isAuthenticated) {
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
            newResumeIds.push(resume.id);
            setProcessedCount(i + 1);
          } catch (err) {
            console.error(`Error processing ${file.name}:`, err);
          }
        }
        
        setProcessingStatus('Processing complete!');
      } else {
        setProcessingStatus('Processing locally...');
        
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
          newResumeIds.push(resume.id);
          setProcessedCount(i + 1);
        }
        
        setProcessingStatus('Processing complete!');
      }

      // Store processed resume IDs and show the job assignment modal
      setProcessedResumeIds(newResumeIds);
      
      // Small delay before showing modal
      setTimeout(() => {
        setShowJobAssignmentModal(true);
        setIsProcessing(false);
        setIsLoading(false);
      }, 800);
      
    } catch (err) {
      console.error('Error processing resumes:', err);
      setError(err instanceof Error ? err.message : 'Failed to process resumes');
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  // Handle assigning to existing jobs
  const handleAssignToExistingJobs = async () => {
    if (selectedJobIds.size === 0) {
      setShowJobAssignmentModal(false);
      router.push('/results');
      return;
    }

    // When using real API, call the backend screening endpoint
    if (useRealApi && isAuthenticated) {
      setIsProcessing(true);
      setProcessingStatus('Screening candidates against selected jobs...');
      
      try {
        const jobIdArray = Array.from(selectedJobIds);
        
        for (const jobId of jobIdArray) {
          setProcessingStatus(`Screening against ${jobs.find(j => j.id === jobId)?.title || 'job'}...`);
          
          // Call the backend screening API
          const screeningResults = await api.screenCandidates(jobId, processedResumeIds);
          
          // Update local store with screening results
          const job = jobs.find(j => j.id === jobId);
          const newCandidates = screeningResults.map((result: any) => ({
            id: result.id,
            name: result.name || 'Unknown',
            email: result.email || '',
            phone: result.phone || '',
            skills: result.skills || [],
            education: result.education || '',
            experience: result.experience || '',
            score: result.score || 0,
            skillMatches: result.skill_matches || [],
            jobId: jobId,
            jobTitle: job?.title || ''
          }));
          
          // Add new candidates to the store (deduplicate by ID)
          const existingIds = new Set(filteredResumes.map((r: any) => r.id));
          const uniqueNewCandidates = newCandidates.filter((c: any) => !existingIds.has(c.id));
          if (uniqueNewCandidates.length > 0) {
            const updatedResumes = [...filteredResumes, ...uniqueNewCandidates];
            setFilteredResumes(updatedResumes);
            setResumes(updatedResumes);
          }
          
          // Also update job assignments
          screeningResults.forEach((result: any) => {
            assignCandidateToJob(result.id, jobId, result.score || 0);
          });
        }
        
        setProcessingStatus('Screening complete!');
        
        // Small delay before navigating
        setTimeout(() => {
          setIsProcessing(false);
          setShowJobAssignmentModal(false);
          const firstJobId = jobIdArray[0];
          router.push(`/results?jobId=${firstJobId}&t=${Date.now()}`);
        }, 500);
        
      } catch (error) {
        console.error('Error screening candidates:', error);
        setError(error instanceof Error ? error.message : 'Failed to screen candidates');
        setIsProcessing(false);
        setProcessingStatus('');
      }
    } else {
      // Local mode - just update the store
      processedResumeIds.forEach(resumeId => {
        selectedJobIds.forEach(jobId => {
          assignCandidateToJob(resumeId, jobId);
        });
      });
      
      setShowJobAssignmentModal(false);
      const firstJobId = Array.from(selectedJobIds)[0];
      if (firstJobId) {
        router.push(`/results?jobId=${firstJobId}`);
      } else {
        router.push('/results');
      }
    }
  };

  // Handle creating a new job
  const handleCreateNewJob = () => {
    setShowJobAssignmentModal(false);
    router.push('/job-description');
  };

  const steps = [
    { icon: <Brain className="h-5 w-5" />, title: 'NLP Parsing', desc: 'Extract skills, education & experience', color: 'from-blue-500 to-cyan-500' },
    { icon: <Target className="h-5 w-5" />, title: 'Smart Matching', desc: 'Semantic similarity analysis', color: 'from-purple-500 to-pink-500' },
    { icon: <Zap className="h-5 w-5" />, title: 'AI Ranking', desc: 'Score & rank candidates', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-primary-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6"
          >
            <Upload className="h-4 w-4" />
            <span>Step 1: Upload Resumes</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Upload <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Resumes</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Drop candidate resumes and let our AI extract key information instantly
          </p>
        </motion.div>

        {/* API Status Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            useRealApi && isAuthenticated
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            {useRealApi && isAuthenticated ? (
              <>
                <Cloud className="h-4 w-4" />
                <span>Cloud AI Processing</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </>
            ) : (
              <>
                <HardDrive className="h-4 w-4" />
                <span>Local Processing Mode</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-400">Error processing resumes</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <div className="p-8">
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
                className="mt-8"
              >
                {/* Files Ready Section */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {files.length} file{files.length > 1 ? 's' : ''} ready
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Click to start processing</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProcess}
                    className="group px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 flex items-center gap-2"
                  >
                    Process Resumes
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8"
              >
                <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center animate-pulse">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Processing...</span>
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                      {processedCount} / {files.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(processedCount / files.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary-500 to-purple-600 rounded-full"
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    {processingStatus}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.3 + index * 0.05, 0.6) }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all duration-300 hover:shadow-lg group"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${step.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                {step.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Info Banner */}
        {!useRealApi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-300">Backend Offline</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Start the backend server for full AI-powered resume parsing with spaCy NLP and Sentence-BERT matching.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Job Assignment Modal - Shows AFTER processing completes */}
      <AnimatePresence>
        {showJobAssignmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => {}} // Don't close on backdrop click - user must choose
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-auto border border-white/50 dark:border-gray-800/50"
            >
              {/* Success Header */}
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-b border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <CheckCircle className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isProcessing ? 'Screening Candidates...' : 'Processing Complete!'}
                    </h2>
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {isProcessing ? processingStatus : `${processedResumeIds.length} candidate${processedResumeIds.length > 1 ? 's' : ''} ready`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Screening Loading Overlay */}
              {isProcessing && (
                <div className="p-8 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-center">
                    {processingStatus}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    This may take a moment depending on the number of candidates and jobs...
                  </p>
                </div>
              )}

              {/* Options - hidden during screening processing */}
              {!isProcessing && (
              <div className="p-6 space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  What would you like to do with these candidates?
                </p>

                {/* Option 1: Assign to Existing Job */}
                {openJobs.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-500" />
                      Assign to Existing Job
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {openJobs.map((job) => (
                        <motion.button
                          key={job.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => toggleJobSelection(job.id)}
                          className={`w-full p-4 rounded-xl border transition-all flex items-center gap-3 ${
                            selectedJobIds.has(job.id)
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/30'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedJobIds.has(job.id)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                          }`}>
                            {selectedJobIds.has(job.id) ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Plus className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-900 dark:text-white">{job.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              {job.status === 'open' ? (
                                <><Play className="h-3 w-3 text-emerald-500" /> Open</>
                              ) : (
                                <><Edit3 className="h-3 w-3 text-amber-500" /> Draft</>
                              )}
                              <span>•</span>
                              <Users className="h-3 w-3" />
                              {job.candidateCount} candidates
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    
                    {selectedJobIds.size > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAssignToExistingJobs}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                      >
                        <Briefcase className="h-5 w-5" />
                        Assign to {selectedJobIds.size} Job{selectedJobIds.size > 1 ? 's' : ''} & View Results
                        <ArrowRight className="h-5 w-5" />
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Divider */}
                {openJobs.length > 0 && (
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-white dark:bg-gray-900 text-sm text-gray-500">or</span>
                    </div>
                  </div>
                )}

                {/* Option 2: Create New Job */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateNewJob}
                  className="w-full p-5 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-dashed border-emerald-400 dark:border-emerald-600 rounded-2xl hover:border-emerald-500 transition-all group"
                >
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                      <FolderPlus className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">Create New Job</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Define job requirements and match candidates
                      </p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-emerald-500 group-hover:translate-x-2 transition-transform" />
                  </div>
                </motion.button>

                {/* No jobs message */}
                {openJobs.length === 0 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    No existing jobs found. Create a new job to get started!
                  </p>
                )}
              </div>
              )}

              {/* Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  You can always assign candidates to jobs later from the Results page
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
