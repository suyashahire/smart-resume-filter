'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, CheckCircle, AlertCircle, Cloud, HardDrive, Upload, Sparkles, ArrowRight, Zap, Brain, Target, Briefcase, Plus, X, FolderPlus, Users, Play, Edit3 } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import { useStore, Job, Resume } from '@/store/useStore';
import { parseResume } from '@/lib/mockApi'; // offline-mode fallback
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
        
        // Use batch upload when multiple files (max 20 per backend limit)
        if (files.length > 1 && files.length <= 20) {
          setProcessingStatus(`Batch uploading ${files.length} files...`);
          try {
            const responses = await api.uploadMultipleResumes(files);
            
            for (let i = 0; i < responses.length; i++) {
              const response = responses[i];
              const resume = {
                id: response.id,
                name: response.parsed_data.name || 'Unknown',
                email: response.parsed_data.email || '',
                phone: response.parsed_data.phone || '',
                skills: response.parsed_data.skills || [],
                education: response.parsed_data.education || '',
                experience: response.parsed_data.experience || '',
                score: 0,
                file: files[i]
              };
              addResume(resume);
              newResumeIds.push(resume.id);
              setProcessedCount(i + 1);
            }
          } catch (batchErr) {
            console.warn('Batch upload failed, falling back to serial:', batchErr);
            // Fallback to serial upload
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
          }
        } else {
          // Single file or >20 — use serial upload
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
      router.push(`/results?t=${Date.now()}`);
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
          const newCandidates = screeningResults.map((result: api.ResumeWithScore) => ({
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
          const existingIds = new Set(filteredResumes.map((r: Resume) => r.id));
          const uniqueNewCandidates = newCandidates.filter((c: Resume) => !existingIds.has(c.id));
          if (uniqueNewCandidates.length > 0) {
            const updatedResumes = [...filteredResumes, ...uniqueNewCandidates];
            setFilteredResumes(updatedResumes);
            setResumes(updatedResumes);
          }
          
          // Also update job assignments
          screeningResults.forEach((result: api.ResumeWithScore) => {
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
        router.push(`/results?jobId=${firstJobId}&t=${Date.now()}`);
      } else {
        router.push(`/results?t=${Date.now()}`);
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(12px)' }}
            onClick={() => {}} // Don't close on backdrop click - user must choose
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="w-full max-h-[90vh] overflow-auto"
              style={{
                maxWidth: '720px',
                backgroundColor: '#0D1117',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
              }}
            >
              {/* Success Header */}
              <div style={{ padding: '32px 32px 24px 32px' }}>
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(52, 211, 153, 0.12)',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                    }}
                  >
                    <CheckCircle className="h-5 w-5" style={{ color: '#34D399' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 600,
                        color: '#F0F6FC',
                        lineHeight: '1.3',
                        letterSpacing: '-0.02em',
                        margin: 0,
                      }}
                    >
                      {isProcessing ? 'Screening Candidates…' : 'Processing Complete'}
                    </h2>
                    <div className="flex items-center gap-3" style={{ marginTop: '8px' }}>
                      {!isProcessing && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#34D399',
                            background: 'rgba(52, 211, 153, 0.1)',
                            border: '1px solid rgba(52, 211, 153, 0.15)',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399' }} />
                          {processedResumeIds.length} candidate{processedResumeIds.length > 1 ? 's' : ''} ready
                        </span>
                      )}
                      {isProcessing && (
                        <span style={{ fontSize: '14px', color: '#8B949E' }}>{processingStatus}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Screening Loading Overlay */}
              {isProcessing && (
                <div style={{ padding: '24px 32px 40px 32px' }} className="flex flex-col items-center justify-center">
                  <div
                    className="animate-spin"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(255,255,255,0.08)',
                      borderTopColor: '#58A6FF',
                      borderRadius: '50%',
                      marginBottom: '16px',
                    }}
                  />
                  <p style={{ color: '#C9D1D9', fontWeight: 500, fontSize: '14px', textAlign: 'center' }}>
                    {processingStatus}
                  </p>
                  <p style={{ color: '#484F58', fontSize: '13px', textAlign: 'center', marginTop: '8px' }}>
                    This may take a moment depending on the number of candidates…
                  </p>
                </div>
              )}

              {/* Options - hidden during screening processing */}
              {!isProcessing && (
              <div style={{ padding: '0 32px 24px 32px' }}>
                {/* Separator line */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '24px' }} />

                <p style={{ fontSize: '14px', color: '#8B949E', fontWeight: 400, marginBottom: '20px' }}>
                  Choose how to proceed with your candidates
                </p>

                {/* Option 1: Assign to Existing Job */}
                {openJobs.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3
                      className="flex items-center gap-2"
                      style={{ fontSize: '13px', fontWeight: 500, color: '#8B949E', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '12px' }}
                    >
                      <Briefcase className="h-3.5 w-3.5" style={{ color: '#58A6FF' }} />
                      Assign to Existing Job
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto" style={{ paddingRight: '4px' }}>
                      {openJobs.map((job) => (
                        <motion.button
                          key={job.id}
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => toggleJobSelection(job.id)}
                          className="w-full flex items-center gap-3 transition-all"
                          style={{
                            padding: '14px 16px',
                            borderRadius: '10px',
                            border: selectedJobIds.has(job.id)
                              ? '1px solid rgba(88, 166, 255, 0.4)'
                              : '1px solid rgba(255,255,255,0.06)',
                            background: selectedJobIds.has(job.id)
                              ? 'rgba(88, 166, 255, 0.08)'
                              : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: selectedJobIds.has(job.id) ? '#58A6FF' : 'rgba(255,255,255,0.06)',
                            }}
                          >
                            {selectedJobIds.has(job.id) ? (
                              <CheckCircle className="h-4 w-4" style={{ color: '#fff' }} />
                            ) : (
                              <Plus className="h-4 w-4" style={{ color: '#484F58' }} />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p style={{ fontWeight: 500, fontSize: '14px', color: '#F0F6FC' }}>{job.title}</p>
                            <p className="flex items-center gap-2" style={{ fontSize: '12px', color: '#484F58', marginTop: '2px' }}>
                              {job.status === 'open' ? (
                                <><Play className="h-3 w-3" style={{ color: '#34D399' }} /> Open</>
                              ) : (
                                <><Edit3 className="h-3 w-3" style={{ color: '#D29922' }} /> Draft</>
                              )}
                              <span>·</span>
                              <Users className="h-3 w-3" />
                              {job.candidateCount} candidates
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    
                    {selectedJobIds.size > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleAssignToExistingJobs}
                        className="w-full flex items-center justify-center gap-2"
                        style={{
                          marginTop: '12px',
                          padding: '12px 20px',
                          borderRadius: '10px',
                          background: '#58A6FF',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Briefcase className="h-4 w-4" />
                        Assign to {selectedJobIds.size} Job{selectedJobIds.size > 1 ? 's' : ''} & View Results
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Divider */}
                {openJobs.length > 0 && (
                  <div className="relative" style={{ padding: '12px 0' }}>
                    <div className="absolute inset-0 flex items-center">
                      <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                    <div className="relative flex justify-center">
                      <span style={{ padding: '0 12px', background: '#0D1117', fontSize: '12px', color: '#484F58', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>or</span>
                    </div>
                  </div>
                )}

                {/* Primary Action: Create Job & Match Candidates */}
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCreateNewJob}
                  className="w-full group transition-all"
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px solid rgba(52, 211, 153, 0.15)',
                      }}
                    >
                      <FolderPlus className="h-5 w-5" style={{ color: '#34D399' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p style={{ fontWeight: 600, fontSize: '15px', color: '#F0F6FC', marginBottom: '2px' }}>
                        Create Job & Match Candidates
                      </p>
                      <p style={{ fontSize: '13px', color: '#8B949E', fontWeight: 400 }}>
                        Define role requirements and auto-match uploaded resumes
                      </p>
                    </div>
                    <ArrowRight
                      className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200"
                      style={{ color: '#484F58' }}
                    />
                  </div>
                </motion.button>

                {/* Secondary Action: View Candidates */}
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setShowJobAssignmentModal(false);
                    router.push(`/results?t=${Date.now()}`);
                  }}
                  className="w-full group transition-all"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'transparent',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <Users className="h-5 w-5" style={{ color: '#8B949E' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p style={{ fontWeight: 500, fontSize: '14px', color: '#C9D1D9' }}>
                        View Candidates
                      </p>
                      <p style={{ fontSize: '13px', color: '#484F58', fontWeight: 400 }}>
                        Browse all uploaded candidates without job matching
                      </p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200"
                      style={{ color: '#30363D' }}
                    />
                  </div>
                </motion.button>

                {/* No jobs message */}
                {openJobs.length === 0 && (
                  <p style={{ textAlign: 'center', fontSize: '13px', color: '#484F58', marginTop: '16px' }}>
                    No existing jobs yet — create one to start matching.
                  </p>
                )}
              </div>
              )}

              {/* Footer */}
              <div
                style={{
                  padding: '16px 32px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.015)',
                }}
              >
                <p style={{ fontSize: '12px', color: '#484F58', textAlign: 'center', fontWeight: 400 }}>
                  Candidates can be assigned to jobs anytime from the Results page.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
