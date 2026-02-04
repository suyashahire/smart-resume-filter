'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Mail, Phone, FileText, MessageSquare, AlertCircle, Cloud, HardDrive, CheckCircle } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useStore } from '@/store/useStore';

export default function ResultsPage() {
  const router = useRouter();
  const { filteredResumes, jobDescription, useRealApi, isAuthenticated } = useStore();

  if (filteredResumes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Results Yet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please upload resumes and define job description first
              </p>
              <Link href="/upload-resume">
                <Button>Upload Resumes</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    if (score >= 45) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 75) return { label: 'Excellent Match', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Good Match', color: 'bg-blue-500' };
    if (score >= 45) return { label: 'Fair Match', color: 'bg-yellow-500' };
    return { label: 'Low Match', color: 'bg-red-500' };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Trophy className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Screening Results</h1>
                
                {/* API Mode Indicator */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
                  useRealApi && isAuthenticated
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {useRealApi && isAuthenticated ? (
                    <>
                      <Cloud className="h-4 w-4" />
                      <span>AI Ranked</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="h-4 w-4" />
                      <span>Demo</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {filteredResumes.length} candidate{filteredResumes.length > 1 ? 's' : ''} ranked for{' '}
                <span className="font-semibold text-primary-600 dark:text-primary-400">{jobDescription?.title || 'the position'}</span>
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => router.push('/job-description')}>
                Modify Job Description
              </Button>
              <Link href="/dashboard">
                <Button>View Dashboard</Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Candidates', value: filteredResumes.length, color: 'bg-blue-500' },
            { label: 'Excellent Match', value: filteredResumes.filter(r => r.score >= 75).length, color: 'bg-green-500' },
            { label: 'Good Match', value: filteredResumes.filter(r => r.score >= 60 && r.score < 75).length, color: 'bg-yellow-500' },
            { label: 'Avg Score', value: Math.round(filteredResumes.reduce((acc, r) => acc + r.score, 0) / filteredResumes.length), color: 'bg-purple-500' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full ${stat.color} text-white text-2xl font-bold mb-2`}>
                  {stat.value}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Top Candidate Spotlight */}
        {filteredResumes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary-300 dark:border-primary-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-400 rounded-full p-3">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Top Candidate</h3>
                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{filteredResumes[0].name}</p>
                    <p className="text-gray-600 dark:text-gray-400">{filteredResumes[0].email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary-700 dark:text-primary-400 mb-1">{filteredResumes[0].score}%</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white ${getScoreBadge(filteredResumes[0].score).color}`}>
                    {getScoreBadge(filteredResumes[0].score).label}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Candidate List */}
        <div className="space-y-4">
          {filteredResumes.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="relative overflow-hidden">
                {/* Rank Badge */}
                <div className="absolute top-4 left-0 bg-primary-600 text-white px-3 py-1 text-sm font-bold">
                  #{index + 1}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-12">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{candidate.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(candidate.score)}`}>
                        {candidate.score}% Match
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                        <Mail className="h-4 w-4 mr-2" />
                        {candidate.email}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                        <Phone className="h-4 w-4 mr-2" />
                        {candidate.phone}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Education:</strong> {candidate.education}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Experience:</strong> {candidate.experience}
                      </p>
                    </div>

                    {/* Skills with match highlighting */}
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.slice(0, 6).map((skill, idx) => {
                        const isMatch = candidate.skillMatches?.includes(skill);
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center ${
                              isMatch 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                            }`}
                          >
                            {isMatch && <CheckCircle className="h-3 w-3 mr-1" />}
                            {skill}
                          </span>
                        );
                      })}
                      {candidate.skills.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-xs font-medium">
                          +{candidate.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2">
                    <Link href={`/reports/${candidate.id}`} className="flex-1 md:flex-none">
                      <Button size="sm" variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-1" />
                        View Report
                      </Button>
                    </Link>
                    <Link href={`/interview-analyzer?candidateId=${candidate.id}`} className="flex-1 md:flex-none">
                      <Button size="sm" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Analyze Interview
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center space-x-4"
        >
          <Link href="/interview-analyzer">
            <Button size="lg">
              <MessageSquare className="h-5 w-5 mr-2" />
              Analyze Interviews
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              View Complete Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
