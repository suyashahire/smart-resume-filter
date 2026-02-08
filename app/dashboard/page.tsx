'use client';

import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, FileText, MessageSquare, TrendingUp, Award, Calendar, Cloud, HardDrive, RefreshCw, BarChart3, Sparkles, ArrowRight, Crown } from 'lucide-react';
import { SkillsDistributionChart, ScoreDistributionChart, PerformanceTrendChart } from '@/components/Charts';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

export default function DashboardPage() {
  const { resumes, filteredResumes, interviews, jobDescription, useRealApi, isAuthenticated } = useStore();
  const [apiStats, setApiStats] = useState<api.DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch API stats when connected
  useEffect(() => {
    if (useRealApi && isAuthenticated) {
      fetchApiStats();
    }
  }, [useRealApi, isAuthenticated]);

  // Clear API stats when local data is cleared (e.g., all candidates deleted)
  useEffect(() => {
    if (resumes.length === 0 && filteredResumes.length === 0 && apiStats) {
      // Local data is empty, clear cached API stats to show accurate state
      setApiStats(null);
    }
  }, [resumes.length, filteredResumes.length]);

  const fetchApiStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await api.getDashboardStats();
      setApiStats(stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Check if we have any local data
  const hasLocalData = resumes.length > 0 || filteredResumes.length > 0;

  const stats = useMemo(() => {
    // Only use API stats if we have local data too (prevents stale data after deletion)
    if (apiStats && useRealApi && hasLocalData) {
      return {
        totalCandidates: apiStats.total_resumes,
        screenedCandidates: apiStats.total_screened,
        totalInterviews: apiStats.total_interviews,
        avgScore: apiStats.average_score,
        topCandidates: apiStats.excellent_matches
      };
    }

    const totalCandidates = resumes.length;
    const screenedCandidates = filteredResumes.length;
    const totalInterviews = interviews.length;
    const avgScore = screenedCandidates > 0
      ? Math.round(filteredResumes.reduce((acc, r) => acc + r.score, 0) / screenedCandidates)
      : 0;
    const topCandidates = filteredResumes.filter(r => r.score >= 75).length;

    return { totalCandidates, screenedCandidates, totalInterviews, avgScore, topCandidates };
  }, [resumes, filteredResumes, interviews, apiStats, useRealApi, hasLocalData]);

  const skillsData = useMemo(() => {
    // Only use API stats if we have local data
    if (apiStats?.skills_distribution && useRealApi && hasLocalData) {
      return apiStats.skills_distribution;
    }

    const skillCount: Record<string, number> = {};
    resumes.forEach(resume => {
      resume.skills.forEach(skill => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
  }, [resumes, apiStats, useRealApi, hasLocalData]);

  const scoreDistributionData = useMemo(() => {
    // Only use API stats if we have local data
    if (apiStats?.score_distribution && useRealApi && hasLocalData) {
      return apiStats.score_distribution;
    }

    return [
      { range: '0-44', count: filteredResumes.filter(r => r.score < 45).length },
      { range: '45-59', count: filteredResumes.filter(r => r.score >= 45 && r.score < 60).length },
      { range: '60-74', count: filteredResumes.filter(r => r.score >= 60 && r.score < 75).length },
      { range: '75-100', count: filteredResumes.filter(r => r.score >= 75).length },
    ];
  }, [filteredResumes, apiStats, useRealApi, hasLocalData]);

  const performanceTrendData = useMemo(() => {
    // Only use API stats if we have local data
    if (apiStats?.top_candidates && useRealApi && hasLocalData) {
      return apiStats.top_candidates.map(c => ({
        name: c.name.split(' ')[0],
        score: c.score
      }));
    }

    return filteredResumes.slice(0, 10).map((resume) => ({
      name: resume.name.split(' ')[0],
      score: resume.score
    }));
  }, [filteredResumes, apiStats, useRealApi, hasLocalData]);

  const topCandidatesList = useMemo(() => {
    // Only use API stats if we have local data
    if (apiStats?.top_candidates && useRealApi && hasLocalData) {
      return apiStats.top_candidates;
    }
    return filteredResumes.slice(0, 5).map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      score: r.score
    }));
  }, [filteredResumes, apiStats, useRealApi, hasLocalData]);

  const statCards = [
    { icon: <Users className="h-6 w-6" />, label: 'Total Candidates', value: stats.totalCandidates, color: 'from-blue-500 to-cyan-500' },
    { icon: <FileText className="h-6 w-6" />, label: 'Screened', value: stats.screenedCandidates, color: 'from-green-500 to-emerald-500' },
    { icon: <MessageSquare className="h-6 w-6" />, label: 'Interviews', value: stats.totalInterviews, color: 'from-purple-500 to-pink-500' },
    { icon: <TrendingUp className="h-6 w-6" />, label: 'Avg Score', value: `${stats.avgScore}%`, color: 'from-amber-500 to-orange-500' },
    { icon: <Award className="h-6 w-6" />, label: 'Top Matches', value: stats.topCandidates, color: 'from-rose-500 to-red-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-primary-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics Overview</span>
              </motion.div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Recruitment <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Dashboard</span>
              </h1>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Calendar className="h-5 w-5" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* API Status */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${
                useRealApi && isAuthenticated
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              }`}>
                {useRealApi && isAuthenticated ? (
                  <>
                    <Cloud className="h-4 w-4" />
                    <span>Live Data</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4" />
                    <span>Local Data</span>
                  </>
                )}
              </div>
              
              {useRealApi && isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchApiStats}
                  disabled={isLoadingStats}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  Refresh
                </motion.button>
              )}
            </div>
          </div>

          {/* Current Position Banner */}
          {jobDescription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">Current Position</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{jobDescription.title}</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:border-primary-500/30 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Skills Distribution</h2>
            {skillsData.length > 0 ? (
              <SkillsDistributionChart data={skillsData} />
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
                <p>Upload resumes to see skills distribution</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Score Distribution</h2>
            {filteredResumes.length > 0 ? (
              <ScoreDistributionChart data={scoreDistributionData} />
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <TrendingUp className="h-12 w-12 mb-3 opacity-50" />
                <p>Screen candidates to see score distribution</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Candidates Performance</h2>
          {performanceTrendData.length > 0 ? (
            <PerformanceTrendChart data={performanceTrendData} />
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <Award className="h-12 w-12 mb-3 opacity-50" />
              <p>Screen candidates to see performance trends</p>
            </div>
          )}
        </motion.div>

        {/* Top Candidates List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Candidates</h2>
            {topCandidatesList.length > 0 && (
              <Link href="/results">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            )}
          </div>
          
          {topCandidatesList.length > 0 ? (
            <div className="space-y-3">
              {topCandidatesList.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                      index === 0 
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500' 
                        : 'bg-gradient-to-br from-primary-500 to-purple-600'
                    }`}>
                      {index === 0 ? <Crown className="h-5 w-5" /> : `#${index + 1}`}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{candidate.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        candidate.score >= 75 
                          ? 'text-green-600 dark:text-green-400'
                          : candidate.score >= 60 
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-amber-600 dark:text-amber-400'
                      }`}>{candidate.score}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Match Score</p>
                    </div>
                    <Link href={`/reports/${candidate.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium group-hover:bg-primary-500 group-hover:text-white transition-colors"
                      >
                        Report
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No candidates screened yet</p>
              <Link href="/upload-resume">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-medium shadow-lg"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
