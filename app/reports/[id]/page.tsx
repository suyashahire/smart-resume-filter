'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Mail, Phone, GraduationCap, Briefcase, 
  TrendingUp, MessageSquare, Award, Download, 
  AlertCircle, ArrowLeft, CheckCircle, XCircle,
  Cloud, HardDrive, Loader2
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

export default function CandidateReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { filteredResumes, interviews, jobDescription, getInterviewByCandidate, useRealApi, isAuthenticated } = useStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const candidate = useMemo(() => {
    return filteredResumes.find(r => r.id === params.id);
  }, [filteredResumes, params.id]);

  const interview = useMemo(() => {
    return getInterviewByCandidate(params.id);
  }, [interviews, params.id]);

  const finalScore = useMemo(() => {
    if (!candidate) return 0;
    if (!interview) return candidate.score;
    
    // Combined score: 60% resume, 20% sentiment, 20% confidence
    return Math.round(
      (candidate.score * 0.6) + 
      (interview.sentimentScore * 0.2) + 
      (interview.confidenceScore * 0.2)
    );
  }, [candidate, interview]);

  const recommendation = useMemo(() => {
    if (finalScore >= 75) return { label: 'Highly Recommended', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: <CheckCircle className="h-6 w-6" /> };
    if (finalScore >= 60) return { label: 'Recommended', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: <CheckCircle className="h-6 w-6" /> };
    if (finalScore >= 45) return { label: 'Maybe', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: <AlertCircle className="h-6 w-6" /> };
    return { label: 'Not Recommended', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: <XCircle className="h-6 w-6" /> };
  }, [finalScore]);

  const handleDownloadPdf = async () => {
    if (!useRealApi || !isAuthenticated) {
      alert('PDF export requires backend connection. Please ensure the server is running.');
      return;
    }
    
    setIsDownloading(true);
    try {
      const blob = await api.downloadReportPdf(params.id, jobDescription?.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidate?.name || 'candidate'}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF report');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Candidate Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The candidate you&apos;re looking for doesn&apos;t exist or hasn&apos;t been screened yet.
              </p>
              <Link href="/results">
                <Button>Back to Results</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Candidate Report</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Comprehensive evaluation for {jobDescription?.title || 'the position'}
                </p>
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
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </motion.div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-6">
                <div className="bg-white dark:bg-gray-700 rounded-full p-4">
                  <User className="h-16 w-16 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{candidate.name}</h2>
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4 mr-2" />
                      {candidate.email}
                    </div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <Phone className="h-4 w-4 mr-2" />
                      {candidate.phone}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold text-primary-700 dark:text-primary-400 mb-2">{finalScore}%</div>
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${recommendation.bg} ${recommendation.color} font-semibold`}>
                  {recommendation.icon}
                  <span>{recommendation.label}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="text-center">
              <Award className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Resume Score</h3>
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(candidate.score)}`}>
                {candidate.score}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getScoreBg(candidate.score)}`}
                  style={{ width: `${candidate.score}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Skills & Experience Match</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="text-center">
              <MessageSquare className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Sentiment Score</h3>
              {interview ? (
                <>
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(interview.sentimentScore)}`}>
                    {interview.sentimentScore}%
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${getScoreBg(interview.sentimentScore)}`}
                      style={{ width: `${interview.sentimentScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Positivity & Enthusiasm</p>
                </>
              ) : (
                <div className="py-4">
                  <p className="text-gray-400 dark:text-gray-500 mb-3">No interview analyzed</p>
                  <Link href={`/interview-analyzer?candidateId=${candidate.id}`}>
                    <Button size="sm">Analyze Interview</Button>
                  </Link>
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="text-center">
              <TrendingUp className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Confidence Score</h3>
              {interview ? (
                <>
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(interview.confidenceScore)}`}>
                    {interview.confidenceScore}%
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${getScoreBg(interview.confidenceScore)}`}
                      style={{ width: `${interview.confidenceScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Clarity & Assertiveness</p>
                </>
              ) : (
                <div className="py-4">
                  <p className="text-gray-400 dark:text-gray-500 mb-3">No interview analyzed</p>
                  <Link href={`/interview-analyzer?candidateId=${candidate.id}`}>
                    <Button size="sm">Analyze Interview</Button>
                  </Link>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Education & Experience */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <GraduationCap className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
                Education & Experience
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Education</h4>
                  <p className="text-gray-600 dark:text-gray-400">{candidate.education}</p>
                </div>
                <div className="border-t dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Experience
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">{candidate.experience}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <span
                    key={index}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      jobDescription?.requiredSkills.some(rs => 
                        rs.toLowerCase().includes(skill.toLowerCase()) ||
                        skill.toLowerCase().includes(rs.toLowerCase())
                      )
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {skill}
                    {jobDescription?.requiredSkills.some(rs => 
                      rs.toLowerCase().includes(skill.toLowerCase()) ||
                      skill.toLowerCase().includes(rs.toLowerCase())
                    ) && (
                      <CheckCircle className="inline h-4 w-4 ml-1" />
                    )}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                <CheckCircle className="inline h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                Green badges indicate skills matching job requirements
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Interview Transcript */}
        {interview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Interview Transcript</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{interview.transcript}</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Job Match Details */}
        {jobDescription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <Card>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Job Match Analysis</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Position: {jobDescription.title}</h4>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {jobDescription.requiredSkills.map((skill, index) => {
                      const hasSkill = candidate.skills.some(cs => 
                        cs.toLowerCase().includes(skill.toLowerCase()) ||
                        skill.toLowerCase().includes(cs.toLowerCase())
                      );
                      return (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            hasSkill
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {skill} {hasSkill ? '✓' : '✗'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex justify-center space-x-4"
        >
          <Link href="/results">
            <Button variant="outline">Back to Results</Button>
          </Link>
          {!interview && (
            <Link href={`/interview-analyzer?candidateId=${candidate.id}`}>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Analyze Interview
              </Button>
            </Link>
          )}
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

