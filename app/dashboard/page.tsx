'use client';

import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, FileText, MessageSquare, TrendingUp, Award, Calendar, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { SkillsDistributionChart, ScoreDistributionChart, PerformanceTrendChart } from '@/components/Charts';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

export default function DashboardPage() {
  const { resumes, filteredResumes, interviews, jobDescription, useRealApi, isAuthenticated } = useStore();
  const [apiStats, setApiStats] = useState<api.DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch stats from API if connected
  useEffect(() => {
    if (useRealApi && isAuthenticated) {
      fetchApiStats();
    }
  }, [useRealApi, isAuthenticated]);

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

  // Calculate statistics from local store or API
  const stats = useMemo(() => {
    if (apiStats && useRealApi) {
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

    return {
      totalCandidates,
      screenedCandidates,
      totalInterviews,
      avgScore,
      topCandidates
    };
  }, [resumes, filteredResumes, interviews, apiStats, useRealApi]);

  // Skills distribution data
  const skillsData = useMemo(() => {
    if (apiStats?.skills_distribution && useRealApi) {
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
  }, [resumes, apiStats, useRealApi]);

  // Score distribution data
  const scoreDistributionData = useMemo(() => {
    if (apiStats?.score_distribution && useRealApi) {
      return apiStats.score_distribution;
    }

    return [
      { range: '0-44', count: filteredResumes.filter(r => r.score < 45).length },
      { range: '45-59', count: filteredResumes.filter(r => r.score >= 45 && r.score < 60).length },
      { range: '60-74', count: filteredResumes.filter(r => r.score >= 60 && r.score < 75).length },
      { range: '75-100', count: filteredResumes.filter(r => r.score >= 75).length },
    ];
  }, [filteredResumes, apiStats, useRealApi]);

  // Performance trend data
  const performanceTrendData = useMemo(() => {
    if (apiStats?.top_candidates && useRealApi) {
      return apiStats.top_candidates.map(c => ({
        name: c.name.split(' ')[0],
        score: c.score
      }));
    }

    return filteredResumes.slice(0, 10).map((resume) => ({
      name: resume.name.split(' ')[0],
      score: resume.score
    }));
  }, [filteredResumes, apiStats, useRealApi]);

  // Top candidates list
  const topCandidatesList = useMemo(() => {
    if (apiStats?.top_candidates && useRealApi) {
      return apiStats.top_candidates;
    }
    return filteredResumes.slice(0, 5).map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      score: r.score
    }));
  }, [filteredResumes, apiStats, useRealApi]);

  const statCards = [
    {
      icon: <Users className="h-8 w-8" />,
      label: 'Total Candidates',
      value: stats.totalCandidates,
      color: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: <FileText className="h-8 w-8" />,
      label: 'Screened',
      value: stats.screenedCandidates,
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      label: 'Interviews Analyzed',
      value: stats.totalInterviews,
      color: 'bg-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      label: 'Average Score',
      value: `${stats.avgScore}%`,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      icon: <Award className="h-8 w-8" />,
      label: 'Top Candidates',
      value: stats.topCandidates,
      color: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Overview of recruitment analytics and candidate metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* API Mode Indicator */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
                useRealApi && isAuthenticated
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {useRealApi && isAuthenticated ? (
                  <>
                    <Cloud className="h-4 w-4" />
                    <span>Live Data</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4" />
                    <span>Offline</span>
                  </>
                )}
              </div>
              
              {useRealApi && isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchApiStats}
                  disabled={isLoadingStats}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
              
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Calendar className="h-5 w-5" />
                <span className="text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          {jobDescription && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong className="text-primary-700 dark:text-primary-400">Current Position:</strong> {jobDescription.title}
              </p>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="text-center hover:shadow-lg transition-shadow">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${stat.color} text-white mb-3`}>
                  {stat.icon}
                </div>
                <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                  {stat.value}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/upload-resume">
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Resumes
                </Button>
              </Link>
              <Link href="/job-description">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  New Job Description
                </Button>
              </Link>
              <Link href="/results">
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              </Link>
              <Link href="/interview-analyzer">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Analyze Interview
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Skills Distribution</h2>
              {skillsData.length > 0 ? (
                <SkillsDistributionChart data={skillsData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                  No data available. Upload resumes to see skills distribution.
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Score Distribution</h2>
              {filteredResumes.length > 0 || (apiStats?.total_screened && apiStats.total_screened > 0) ? (
                <ScoreDistributionChart data={scoreDistributionData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                  No data available. Screen candidates to see score distribution.
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Performance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <Card>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Candidates Performance</h2>
            {performanceTrendData.length > 0 ? (
              <PerformanceTrendChart data={performanceTrendData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                No data available. Screen candidates to see performance trends.
              </div>
            )}
          </Card>
        </motion.div>

        {/* Top Candidates List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Candidates</h2>
            {topCandidatesList.length > 0 ? (
              <div className="space-y-3">
                {topCandidatesList.map((candidate, index) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{candidate.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{candidate.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary-600 dark:text-primary-400">{candidate.score}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Match Score</div>
                      </div>
                      <Link href={`/reports/${candidate.id}`}>
                        <Button size="sm" variant="outline">
                          View Report
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                No candidates screened yet. Start by uploading resumes and defining a job description.
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
