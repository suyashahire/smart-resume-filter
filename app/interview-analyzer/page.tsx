'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Video, CheckCircle, TrendingUp, MessageSquare, Cloud, HardDrive, Mic, Brain } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useStore } from '@/store/useStore';
import { transcribeInterview, analyzeInterview } from '@/lib/mockApi';
import * as api from '@/lib/api';

interface AnalysisResult {
  sentimentScore: number;
  confidenceScore: number;
  clarityScore?: number;
  enthusiasmScore?: number;
  professionalismScore?: number;
  keyTopics?: string[];
  positiveHighlights?: string[];
}

function InterviewAnalyzerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');
  
  const { resumes, filteredResumes, addInterview, setIsLoading, useRealApi, isAuthenticated } = useStore();
  const [selectedCandidate, setSelectedCandidate] = useState(candidateId || '');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'transcribe' | 'analyze' | 'complete'>('upload');
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);

  // Use filteredResumes if available, otherwise use resumes
  const candidateList = filteredResumes.length > 0 ? filteredResumes : resumes;

  useEffect(() => {
    if (candidateId) {
      setSelectedCandidate(candidateId);
    }
  }, [candidateId]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  const handleProcess = async () => {
    if (files.length === 0 || !selectedCandidate) return;

    setIsProcessing(true);
    setIsLoading(true);

    try {
      if (useRealApi && isAuthenticated) {
        // Use real backend API
        
        // Step 1: Upload interview
        setCurrentStep('transcribe');
        const uploadResponse = await api.uploadInterview(selectedCandidate, files[0]);
        setInterviewId(uploadResponse.id);
        
        // Step 2: Process (transcribe + analyze)
        setCurrentStep('analyze');
        const processResponse = await api.processInterview(uploadResponse.id);
        
        setTranscript(processResponse.transcript || '');
        setAnalysis({
          sentimentScore: processResponse.analysis.sentiment_score,
          confidenceScore: processResponse.analysis.confidence_score,
          clarityScore: processResponse.analysis.clarity_score,
          enthusiasmScore: processResponse.analysis.enthusiasm_score,
          professionalismScore: processResponse.analysis.professionalism_score,
          keyTopics: processResponse.analysis.key_topics,
          positiveHighlights: processResponse.analysis.positive_phrases,
        });

        // Save to store
        const interview = {
          id: processResponse.id,
          candidateId: selectedCandidate,
          transcript: processResponse.transcript || '',
          sentimentScore: processResponse.analysis.sentiment_score,
          confidenceScore: processResponse.analysis.confidence_score,
          file: files[0]
        };
        addInterview(interview);
        
      } else {
        // Use mock API (demo mode)
        
        // Step 1: Transcribe
        setCurrentStep('transcribe');
        const transcribedText = await transcribeInterview(files[0]);
        setTranscript(transcribedText);

        // Step 2: Analyze
        setCurrentStep('analyze');
        const analysisResult = await analyzeInterview(transcribedText);
        setAnalysis({
          sentimentScore: analysisResult.sentimentScore,
          confidenceScore: analysisResult.confidenceScore,
        });

        // Save to store
        const interview = {
          id: `interview-${Date.now()}`,
          candidateId: selectedCandidate,
          transcript: transcribedText,
          sentimentScore: analysisResult.sentimentScore,
          confidenceScore: analysisResult.confidenceScore,
          file: files[0]
        };
        addInterview(interview);
      }

      setCurrentStep('complete');

    } catch (error) {
      console.error('Error processing interview:', error);
      alert(error instanceof Error ? error.message : 'Failed to process interview');
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 45) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const selectedCandidateName = candidateList.find(r => r.id === selectedCandidate)?.name || '';

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
              <Video className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Analyzer</h1>
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
                  <span>Whisper AI</span>
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
            Upload interview recordings for AI-powered sentiment and confidence analysis
          </p>
        </motion.div>

        {/* Candidate Selection */}
        <Card className="mb-6">
          <label htmlFor="candidate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Candidate
          </label>
          <select
            id="candidate"
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={isProcessing}
          >
            <option value="">Choose a candidate...</option>
            {candidateList.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.name} - {resume.email} {resume.score > 0 ? `(${resume.score}% match)` : ''}
              </option>
            ))}
          </select>
          {candidateList.length === 0 && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              No candidates found. Please upload and screen resumes first.
            </p>
          )}
        </Card>

        {/* File Upload */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Interview Recording</h3>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            accept=".mp3,.mp4,.wav,.m4a"
            multiple={false}
            maxSize={50}
          />

          {files.length > 0 && !isProcessing && currentStep === 'upload' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-end"
            >
              <Button
                onClick={handleProcess}
                size="lg"
                disabled={!selectedCandidate}
              >
                <Mic className="h-4 w-4 mr-2" />
                Analyze Interview
              </Button>
            </motion.div>
          )}
        </Card>

        {/* Processing Steps */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Processing Interview for {selectedCandidateName}...
              </h3>
              <div className="space-y-4">
                <div className={`flex items-center ${currentStep === 'transcribe' || currentStep === 'analyze' || currentStep === 'complete' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {currentStep === 'transcribe' && isProcessing ? (
                    <div className="h-6 w-6 mr-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="h-6 w-6 mr-3" />
                  )}
                  <span className="font-medium">
                    {useRealApi ? 'Transcribing with Whisper AI...' : 'Transcribing audio to text...'}
                  </span>
                </div>
                <div className={`flex items-center ${currentStep === 'analyze' || currentStep === 'complete' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {currentStep === 'analyze' && isProcessing ? (
                    <div className="h-6 w-6 mr-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="h-6 w-6 mr-3" />
                  )}
                  <span className="font-medium">
                    {useRealApi ? 'Analyzing with Transformers...' : 'Analyzing sentiment and confidence...'}
                  </span>
                </div>
                <div className={`flex items-center ${currentStep === 'complete' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  <CheckCircle className="h-6 w-6 mr-3" />
                  <span className="font-medium">Generating report...</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {currentStep === 'complete' && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Main Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Sentiment Score</h3>
                  <div className={`text-5xl font-bold mb-2 ${getScoreColor(analysis.sentimentScore)}`}>
                    {analysis.sentimentScore}%
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.sentimentScore}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full ${getScoreBg(analysis.sentimentScore)}`}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Measures positive tone and enthusiasm
                  </p>
                </div>
              </Card>

              <Card>
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Confidence Score</h3>
                  <div className={`text-5xl font-bold mb-2 ${getScoreColor(analysis.confidenceScore)}`}>
                    {analysis.confidenceScore}%
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.confidenceScore}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full ${getScoreBg(analysis.confidenceScore)}`}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Measures clarity and assertiveness
                  </p>
                </div>
              </Card>
            </div>

            {/* Additional Metrics (if available from real API) */}
            {(analysis.clarityScore || analysis.enthusiasmScore || analysis.professionalismScore) && (
              <Card className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  <Brain className="h-5 w-5 inline mr-2" />
                  Detailed Analysis
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {analysis.clarityScore && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.clarityScore)}`}>
                        {analysis.clarityScore}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Clarity</p>
                    </div>
                  )}
                  {analysis.enthusiasmScore && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.enthusiasmScore)}`}>
                        {analysis.enthusiasmScore}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Enthusiasm</p>
                    </div>
                  )}
                  {analysis.professionalismScore && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.professionalismScore)}`}>
                        {analysis.professionalismScore}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Professionalism</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Key Topics */}
            {analysis.keyTopics && analysis.keyTopics.length > 0 && (
              <Card className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Topics Discussed</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.keyTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Transcript */}
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Interview Transcript</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{transcript}</p>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFiles([]);
                  setCurrentStep('upload');
                  setTranscript('');
                  setAnalysis(null);
                  setInterviewId(null);
                }}
              >
                Analyze Another Interview
              </Button>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/reports/${selectedCandidate}`)}
                >
                  View Full Report
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Section */}
        {currentStep === 'upload' && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What we analyze</h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Speech-to-Text:</strong>{' '}
                    {useRealApi && isAuthenticated 
                      ? 'OpenAI Whisper API for accurate transcription'
                      : 'Simulated transcription (Demo mode)'
                    }
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Sentiment Analysis:</strong>{' '}
                    {useRealApi && isAuthenticated
                      ? 'Hugging Face Transformers for emotional tone analysis'
                      : 'Keyword-based sentiment detection (Demo mode)'
                    }
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Confidence Detection:</strong> Assess clarity, assertiveness, and communication skills
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Combined Scoring:</strong> 60% resume + 20% sentiment + 20% confidence
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function InterviewAnalyzerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <InterviewAnalyzerContent />
    </Suspense>
  );
}
