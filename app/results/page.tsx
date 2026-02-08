'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Mail, Phone, FileText, MessageSquare, AlertCircle, CheckCircle, Trash2, ArrowRight, Crown, Star, Users, TrendingUp } from 'lucide-react';
import Button from '@/components/Button';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

export default function ResultsPage() {
  const router = useRouter();
  const { filteredResumes, jobDescription, useRealApi, isAuthenticated, removeResume } = useStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      if (useRealApi && isAuthenticated) {
        await api.deleteResume(id);
      }
      removeResume(id);
    } catch (error) {
      console.error('Error deleting candidate:', error);
      alert('Failed to delete candidate. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (filteredResumes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-12 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Results Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Please upload resumes and define job description first
            </p>
            <Link href="/upload-resume">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg"
              >
                Upload Resumes
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 45) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 75) return { label: 'Excellent', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
    if (score >= 45) return { label: 'Fair', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
    return { label: 'Low', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' };
  };

  const stats = [
    { label: 'Total Candidates', value: filteredResumes.length, icon: <Users className="h-5 w-5" />, color: 'from-blue-500 to-cyan-500' },
    { label: 'Excellent Match', value: filteredResumes.filter(r => r.score >= 75).length, icon: <Star className="h-5 w-5" />, color: 'from-green-500 to-emerald-500' },
    { label: 'Good Match', value: filteredResumes.filter(r => r.score >= 60 && r.score < 75).length, icon: <CheckCircle className="h-5 w-5" />, color: 'from-amber-500 to-orange-500' },
    { label: 'Avg Score', value: `${Math.round(filteredResumes.reduce((acc, r) => acc + r.score, 0) / filteredResumes.length)}%`, icon: <TrendingUp className="h-5 w-5" />, color: 'from-purple-500 to-pink-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-6"
          >
            <Trophy className="h-4 w-4" />
            <span>Step 3 of 3 - Complete</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Screening <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Results</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {filteredResumes.length} candidate{filteredResumes.length > 1 ? 's' : ''} ranked for{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{jobDescription?.title || 'the position'}</span>
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Top Candidate Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 rounded-3xl p-6 border border-amber-200 dark:border-amber-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-2xl"></div>
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Top Candidate</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{filteredResumes[0].name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{filteredResumes[0].email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">{filteredResumes[0].score}%</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">{getScoreBadge(filteredResumes[0].score).label} Match</p>
                </div>
                <Link href={`/reports/${filteredResumes[0].id}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-medium shadow-lg"
                  >
                    View Report
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Candidate List */}
        <div className="space-y-4">
          {filteredResumes.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Rank & Score */}
                <div className={`lg:w-24 flex lg:flex-col items-center justify-center p-4 bg-gradient-to-br ${getScoreColor(candidate.score)} text-white`}>
                  <span className="text-3xl font-bold">#{index + 1}</span>
                  <span className="text-sm opacity-80 lg:mt-1 ml-2 lg:ml-0">{candidate.score}%</span>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{candidate.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getScoreBadge(candidate.score).color}`}>
                          {getScoreBadge(candidate.score).label} Match
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {candidate.email}
                        </span>
                        {candidate.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {candidate.phone}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.slice(0, 6).map((skill, idx) => {
                          const isMatch = candidate.skillMatches?.includes(skill);
                          return (
                            <span
                              key={idx}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                                isMatch 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {isMatch && <CheckCircle className="h-3 w-3" />}
                              {skill}
                            </span>
                          );
                        })}
                        {candidate.skills.length > 6 && (
                          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-medium">
                            +{candidate.skills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2">
                      <Link href={`/reports/${candidate.id}`} className="flex-1 lg:flex-none">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Report
                        </motion.button>
                      </Link>
                      <Link href={`/interview-analyzer?candidateId=${candidate.id}`} className="flex-1 lg:flex-none">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-md flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Interview
                        </motion.button>
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                        disabled={deletingId === candidate.id}
                        className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === candidate.id ? '...' : 'Delete'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link href="/interview-analyzer">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-2xl font-semibold shadow-xl shadow-primary-500/25 flex items-center gap-2"
            >
              <MessageSquare className="h-5 w-5" />
              Analyze Interviews
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors flex items-center gap-2"
            >
              View Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
