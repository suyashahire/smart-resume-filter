'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, FileText, MessageSquare, TrendingUp, Award, Calendar, Cloud, HardDrive, RefreshCw, BarChart3, Sparkles, ArrowRight, Crown, Briefcase, Clock, Timer, CheckCircle2 } from 'lucide-react';
import { SkillsDistributionChart, ScoreDistributionChart, PerformanceTrendChart } from '@/components/features/Charts';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
import RealtimeIndicator from '@/components/features/RealtimeIndicator';

export default function DashboardPage() {
  const { resumes, filteredResumes, interviews, jobDescription, useRealApi, isAuthenticated, setResumes, setFilteredResumes, jobs, candidateJobAssignments, hasFetchedSessionData, setHasFetchedSessionData } = useStore();
  const [apiStats, setApiStats] = useState<api.DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch screening results from all jobs (with proper scores)
  const fetchScreeningResultsFromApi = useCallback(async () => {
    setIsLoadingResumes(true);
    try {
      // Fetch all jobs first
      const jobsData = await api.getJobDescriptions();
      
      if (jobsData && jobsData.length > 0) {
        const allScreenedResumes: any[] = [];
        const allResumes: any[] = [];
        
        // Fetch screening results for each job
        for (const job of jobsData) {
          try {
            const screeningResults = await api.getScreeningResults(job.id);
            if (screeningResults && screeningResults.length > 0) {
              const resultsWithJob = screeningResults.map((r: any) => ({
                id: r.id,
                name: r.name || 'Unknown',
                email: r.email || '',
                phone: r.phone || '',
                skills: r.skills || [],
                education: r.education || '',
                experience: r.experience || '',
                score: r.score || 0,
                skillMatches: r.skill_matches || [],
                jobId: job.id
              }));
              allScreenedResumes.push(...resultsWithJob);
            }
          } catch (err) {
            // Job may not have screening results yet
          }
        }
        
        // Also fetch all resumes for total count
        const resumesData = await api.getResumes();
        if (resumesData && resumesData.length > 0) {
          const mappedResumes = resumesData.map((r: any) => ({
            id: r.id,
            name: r.parsed_data?.name || 'Unknown',
            email: r.parsed_data?.email || '',
            phone: r.parsed_data?.phone || '',
            skills: r.parsed_data?.skills || [],
            education: r.parsed_data?.education || '',
            experience: r.parsed_data?.experience || '',
            score: 0,
            skillMatches: []
          }));
          allResumes.push(...mappedResumes);
        }
        
        // Merge: use screened resume data if available, otherwise use raw resume data
        const resumeMap = new Map();
        allResumes.forEach(r => resumeMap.set(r.id, r));
        allScreenedResumes.forEach(r => resumeMap.set(r.id, r)); // Screened overrides
        
        const mergedResumes = Array.from(resumeMap.values());
        const screenedOnly = mergedResumes.filter(r => r.score > 0);
        
        setResumes(mergedResumes);
        setFilteredResumes(screenedOnly);
      } else {
        // No jobs found - still fetch raw resumes for total count
        const resumesData = await api.getResumes();
        if (resumesData && resumesData.length > 0) {
          const mappedResumes = resumesData.map((r: any) => ({
            id: r.id,
            name: r.parsed_data?.name || 'Unknown',
            email: r.parsed_data?.email || '',
            phone: r.parsed_data?.phone || '',
            skills: r.parsed_data?.skills || [],
            education: r.parsed_data?.education || '',
            experience: r.parsed_data?.experience || '',
            score: 0,
            skillMatches: []
          }));
          setResumes(mappedResumes);
        } else {
          setResumes([]);
        }
        setFilteredResumes([]);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoadingResumes(false);
    }
  }, [setResumes, setFilteredResumes]);

  const fetchApiStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const stats = await api.getDashboardStats();
      setApiStats(stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Clear API stats when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setApiStats(null);
      setLastUpdated(null);
    }
  }, [isAuthenticated]);

  // Fetch from backend on login to populate local store (only once per session)
  // This ensures users see their data on any device/browser on first login
  // All mutations (delete, add) sync to backend, so local store is source of truth after initial load
  useEffect(() => {
    if (useRealApi && isAuthenticated && !hasFetchedSessionData) {
      setHasFetchedSessionData(true);
      fetchScreeningResultsFromApi();
      fetchApiStats();
    }
  }, [useRealApi, isAuthenticated, hasFetchedSessionData, setHasFetchedSessionData, fetchScreeningResultsFromApi, fetchApiStats]);

  const stats = useMemo(() => {
    // Calculate jobs count from local store (always use local since jobs are managed locally)
    const activeJobs = jobs.filter(j => j.status === 'open').length;
    const totalJobs = jobs.length;

    // Always use local store data to ensure deletions are reflected
    // Local store is the source of truth after any user modifications
    const totalCandidates = resumes.length;
    const screenedCandidates = filteredResumes.length;
    const totalInterviews = interviews.length;
    const avgScore = screenedCandidates > 0
      ? Math.round(filteredResumes.reduce((acc, r) => acc + r.score, 0) / screenedCandidates)
      : 0;
    const topCandidates = filteredResumes.filter(r => r.score >= 75).length;

    return { totalCandidates, screenedCandidates, totalInterviews, avgScore, topCandidates, activeJobs, totalJobs };
  }, [resumes, filteredResumes, interviews, jobs]);

  const skillsData = useMemo(() => {
    // Always calculate from local store - it's the source of truth
    // This ensures deletions are immediately reflected in the UI
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
  }, [resumes]);

  const scoreDistributionData = useMemo(() => {
    // Always calculate from local store - it's the source of truth
    // This ensures deletions are immediately reflected in the UI
    return [
      { range: '0-44', count: filteredResumes.filter(r => r.score < 45).length },
      { range: '45-59', count: filteredResumes.filter(r => r.score >= 45 && r.score < 60).length },
      { range: '60-74', count: filteredResumes.filter(r => r.score >= 60 && r.score < 75).length },
      { range: '75-100', count: filteredResumes.filter(r => r.score >= 75).length },
    ];
  }, [filteredResumes]);

  const performanceTrendData = useMemo(() => {
    // Always calculate from local store - it's the source of truth
    // This ensures deletions are immediately reflected in the UI
    return filteredResumes.slice(0, 10).map((resume) => ({
      name: resume.name.split(' ')[0],
      score: resume.score
    }));
  }, [filteredResumes]);

  const topCandidatesList = useMemo(() => {
    // Always calculate from local store - it's the source of truth
    // This ensures deletions are immediately reflected in the UI
    return filteredResumes.slice(0, 5).map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      score: r.score
    }));
  }, [filteredResumes]);

  const statCards = [
    { icon: <Briefcase className="h-6 w-6" />, label: 'Active Jobs', value: stats.activeJobs, color: 'from-indigo-500 to-violet-500' },
    { icon: <Users className="h-6 w-6" />, label: 'Total Candidates', value: stats.totalCandidates, color: 'from-blue-500 to-cyan-500' },
    { icon: <FileText className="h-6 w-6" />, label: 'Screened', value: stats.screenedCandidates, color: 'from-green-500 to-emerald-500' },
    { icon: <MessageSquare className="h-6 w-6" />, label: 'Interviews', value: stats.totalInterviews, color: 'from-purple-500 to-pink-500' },
    { icon: <TrendingUp className="h-6 w-6" />, label: 'Avg Score', value: `${stats.avgScore}%`, color: 'from-amber-500 to-orange-500' },
    { icon: <Award className="h-6 w-6" />, label: 'Top Matches', value: stats.topCandidates, color: 'from-rose-500 to-red-500' }
  ];

  // Time-to-Hire Metrics
  const timeToHireMetrics = useMemo(() => {
    const hiredCandidates = candidateJobAssignments.filter(a => a.status === 'hired');
    const screeningCandidates = candidateJobAssignments.filter(a => a.status === 'screening');
    const interviewCandidates = candidateJobAssignments.filter(a => a.status === 'interview');
    const offerCandidates = candidateJobAssignments.filter(a => a.status === 'offer');
    
    // Calculate time in pipeline for each job
    const jobMetrics = jobs.map(job => {
      const jobHires = hiredCandidates.filter(h => h.jobId === job.id);
      const jobAssignments = candidateJobAssignments.filter(a => a.jobId === job.id);
      const jobCreatedDate = new Date(job.createdAt);
      const daysSinceCreation = Math.floor((Date.now() - jobCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        jobId: job.id,
        jobTitle: job.title,
        status: job.status,
        daysOpen: daysSinceCreation,
        totalCandidates: jobAssignments.length,
        hiredCount: jobHires.length,
        inPipeline: jobAssignments.filter(a => ['screening', 'interview', 'offer'].includes(a.status)).length
      };
    });
    
    // Average days to fill (for jobs with at least one hire)
    const filledJobs = jobMetrics.filter(j => j.hiredCount > 0);
    const avgDaysToFill = filledJobs.length > 0
      ? Math.round(filledJobs.reduce((acc, j) => acc + j.daysOpen, 0) / filledJobs.length)
      : 0;
    
    // Current pipeline breakdown
    const pipelineBreakdown = {
      new: candidateJobAssignments.filter(a => a.status === 'new').length,
      screening: screeningCandidates.length,
      interview: interviewCandidates.length,
      offer: offerCandidates.length,
      hired: hiredCandidates.length,
      rejected: candidateJobAssignments.filter(a => a.status === 'rejected').length
    };
    
    // Oldest open job
    const openJobs = jobMetrics.filter(j => j.status === 'open' && j.hiredCount === 0);
    const oldestOpenJob = openJobs.sort((a, b) => b.daysOpen - a.daysOpen)[0];
    
    return {
      avgDaysToFill,
      totalHired: hiredCandidates.length,
      openPositions: jobs.filter(j => j.status === 'open').length,
      pipelineBreakdown,
      oldestOpenJob,
      jobMetrics: jobMetrics.slice(0, 5)
    };
  }, [jobs, candidateJobAssignments]);

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
                  onClick={() => {
                    fetchApiStats();
                    fetchScreeningResultsFromApi();
                  }}
                  disabled={isLoadingStats || isLoadingResumes}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingStats || isLoadingResumes ? 'animate-spin' : ''}`} />
                  Refresh
                </motion.button>
              )}
              
              {lastUpdated && useRealApi && isAuthenticated && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
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
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(0.1 + index * 0.03, 0.3) }}
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

        {/* Time-to-Hire Analytics Section */}
        {(jobs.length > 0 || candidateJobAssignments.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Timer className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Time-to-Hire Analytics</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Track your hiring pipeline efficiency</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Average Days to Fill */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Days to Fill</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {timeToHireMetrics.avgDaysToFill > 0 ? timeToHireMetrics.avgDaysToFill : '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {timeToHireMetrics.totalHired > 0 ? `Based on ${timeToHireMetrics.totalHired} hire${timeToHireMetrics.totalHired > 1 ? 's' : ''}` : 'No hires yet'}
                </p>
              </div>

              {/* Open Positions */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Positions</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {timeToHireMetrics.openPositions}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {timeToHireMetrics.oldestOpenJob ? `Oldest: ${timeToHireMetrics.oldestOpenJob.daysOpen} days` : 'No open jobs'}
                </p>
              </div>

              {/* Total Hired */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hired</span>
                </div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {timeToHireMetrics.totalHired}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  All time
                </p>
              </div>

              {/* Pipeline Breakdown */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pipeline</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-600 dark:text-blue-400">Screening</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{timeToHireMetrics.pipelineBreakdown.screening}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-600 dark:text-purple-400">Interview</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{timeToHireMetrics.pipelineBreakdown.interview}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-600 dark:text-amber-400">Offer</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{timeToHireMetrics.pipelineBreakdown.offer}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
            {scoreDistributionData.some(d => d.count > 0) ? (
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
                  transition={{ delay: Math.min(0.3 + index * 0.03, 0.5) }}
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
      
      {/* Real-time Updates Indicator */}
      <RealtimeIndicator 
        showNotifications={true}
        onEvent={(event) => {
          // Refresh data when relevant events occur
          if (['resume_uploaded', 'candidate_scored', 'job_created', 'job_deleted'].includes(event.type)) {
            fetchScreeningResultsFromApi();
          }
        }}
      />
    </div>
  );
}
