'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Video, CheckCircle, TrendingUp, MessageSquare, Cloud, HardDrive, Mic, Brain, ArrowRight, Sparkles, User, BarChart3, FileText, Headphones } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
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
        setCurrentStep('transcribe');
        const uploadResponse = await api.uploadInterview(selectedCandidate, files[0]);
        setInterviewId(uploadResponse.id);
        
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
        setCurrentStep('transcribe');
        const transcribedText = await transcribeInterview(files[0]);
        setTranscript(transcribedText);

        setCurrentStep('analyze');
        const analysisResult = await analyzeInterview(transcribedText);
        setAnalysis({
          sentimentScore: analysisResult.sentimentScore,
          confidenceScore: analysisResult.confidenceScore,
        });

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
    if (score >= 75) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 45) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 45) return 'Fair';
    return 'Needs Improvement';
  };

  const selectedCandidateName = candidateList.find(r => r.id === selectedCandidate)?.name || '';

  const features = [
    { icon: <Headphones className="h-5 w-5" />, title: 'Transcription', desc: 'Whisper AI speech-to-text', color: 'from-blue-500 to-cyan-500' },
    { icon: <MessageSquare className="h-5 w-5" />, title: 'Sentiment', desc: 'Emotional tone analysis', color: 'from-purple-500 to-pink-500' },
    { icon: <TrendingUp className="h-5 w-5" />, title: 'Confidence', desc: 'Assertiveness scoring', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-sm font-medium mb-6"
          >
            <Video className="h-4 w-4" />
            <span>Interview Analysis</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Analyze <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Interviews</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            AI-powered sentiment and confidence analysis from interview recordings
          </p>
        </motion.div>

        {/* API Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
            useRealApi && isAuthenticated
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          }`}>
            {useRealApi && isAuthenticated ? (
              <>
                <Cloud className="h-4 w-4" />
                <span>Whisper AI + Transformers</span>
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

        {currentStep === 'upload' && !isProcessing && (
          <>
            {/* Candidate Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 flex items-center justify-center">
                  <User className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Select Candidate</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose from your screened candidates</p>
                </div>
              </div>
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
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
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    No candidates found. Please upload and screen resumes first.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Upload Recording</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">MP3, MP4, WAV, M4A up to 50MB</p>
                  </div>
                </div>

                <FileUpload
                  onFilesSelected={handleFilesSelected}
                  accept=".mp3,.mp4,.wav,.m4a"
                  multiple={false}
                  maxSize={50}
                />

                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        <Video className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{files[0].name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(files[0].size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProcess}
                      disabled={!selectedCandidate}
                      className="group px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Sparkles className="h-5 w-5" />
                      Analyze Interview
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-3`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </>
        )}

        {/* Processing */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-white animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Analyzing Interview
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Processing recording for {selectedCandidateName}
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              {[
                { step: 'transcribe', label: 'Transcribing audio...', icon: <Headphones className="h-5 w-5" /> },
                { step: 'analyze', label: 'Analyzing sentiment...', icon: <MessageSquare className="h-5 w-5" /> },
                { step: 'complete', label: 'Generating report...', icon: <BarChart3 className="h-5 w-5" /> },
              ].map((item, index) => {
                const isActive = currentStep === item.step;
                const isPast = ['transcribe', 'analyze', 'complete'].indexOf(currentStep) > ['transcribe', 'analyze', 'complete'].indexOf(item.step);
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800'
                        : isPast
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive 
                        ? 'bg-cyan-500 text-white'
                        : isPast
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {isActive ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isPast ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        item.icon
                      )}
                    </div>
                    <span className={`font-medium ${
                      isActive || isPast
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {currentStep === 'complete' && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Main Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Sentiment Score', value: analysis.sentimentScore, icon: <MessageSquare className="h-6 w-6" />, desc: 'Positive tone & enthusiasm' },
                { label: 'Confidence Score', value: analysis.confidenceScore, icon: <TrendingUp className="h-6 w-6" />, desc: 'Clarity & assertiveness' },
              ].map((score, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getScoreColor(score.value)} flex items-center justify-center text-white`}>
                      {score.icon}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getScoreColor(score.value)} text-white`}>
                      {getScoreLabel(score.value)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{score.label}</h3>
                  <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(score.value)} bg-clip-text text-transparent mb-3`}>
                    {score.value}%
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score.value}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-full bg-gradient-to-r ${getScoreColor(score.value)} rounded-full`}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{score.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Additional Metrics */}
            {(analysis.clarityScore || analysis.enthusiasmScore || analysis.professionalismScore) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Analysis</h3>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Clarity', value: analysis.clarityScore },
                    { label: 'Enthusiasm', value: analysis.enthusiasmScore },
                    { label: 'Professionalism', value: analysis.professionalismScore },
                  ].filter(m => m.value).map((metric, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(metric.value!)} bg-clip-text text-transparent mb-1`}>
                        {metric.value}%
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Key Topics */}
            {analysis.keyTopics && analysis.keyTopics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Topics Discussed</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.keyTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-700 dark:text-cyan-400 rounded-xl text-sm font-medium border border-cyan-200 dark:border-cyan-800"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Transcript */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interview Transcript</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 max-h-60 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{transcript}</p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row justify-between gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setFiles([]);
                  setCurrentStep('upload');
                  setTranscript('');
                  setAnalysis(null);
                  setInterviewId(null);
                }}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Analyze Another
              </motion.button>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/reports/${selectedCandidate}`)}
                  className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors flex items-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  Full Report
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2"
                >
                  Dashboard
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function InterviewAnalyzerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <InterviewAnalyzerContent />
    </Suspense>
  );
}
