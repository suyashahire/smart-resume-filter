'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Brain, FileText, MessageSquare, BarChart3, Users, Zap,
  ArrowRight, Sparkles, Upload, Search, TrendingUp, Award,
  Briefcase, Clock, UserCheck, Star, ChevronRight, Activity
} from 'lucide-react';
import { useStore, type Resume } from '@/store/useStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, jobs, resumes, filteredResumes } = useStore();
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [isAuthenticated, router]);

  const stats = useMemo(() => {
    const totalCandidates = filteredResumes.length || resumes.length;
    const activeJobs = jobs.length;
    const screened = filteredResumes.filter((r: Resume) => !r.isUnscreened).length;
    const avgScore = screened > 0
      ? Math.round(filteredResumes.filter((r: Resume) => !r.isUnscreened).reduce((acc: number, r) => acc + r.score, 0) / screened)
      : 0;
    const excellent = filteredResumes.filter(r => r.score >= 75).length;
    return { totalCandidates, activeJobs, screened, avgScore, excellent };
  }, [jobs, resumes, filteredResumes]);

  const recentCandidates = useMemo(() => {
    return [...filteredResumes]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [filteredResumes]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const quickActions = [
    { href: '/upload-resume', icon: Upload, label: 'Upload Resumes', desc: 'Screen new candidates', gradient: 'from-blue-500 to-indigo-600' },
    { href: '/job-description', icon: Briefcase, label: 'Create Job', desc: 'Post a new position', gradient: 'from-emerald-500 to-green-600' },
    { href: '/results', icon: BarChart3, label: 'View Results', desc: 'Candidate rankings', gradient: 'from-purple-500 to-violet-600' },
    { href: '/interview-analyzer', icon: Brain, label: 'Interviews', desc: 'Analyze interviews', gradient: 'from-amber-500 to-orange-600' },
    { href: '/messages', icon: MessageSquare, label: 'Messages', desc: 'Team communication', gradient: 'from-pink-500 to-rose-600' },
    { href: '/dashboard', icon: Activity, label: 'Dashboard', desc: 'Full analytics view', gradient: 'from-cyan-500 to-teal-600' },
  ];

  const statCards = [
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Total Candidates', value: stats.totalCandidates, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Screened', value: stats.screened, icon: Search, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Avg Score', value: stats.avgScore ? `${stats.avgScore}%` : '--', icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Top Matches', value: stats.excellent, icon: Star, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>HireQ Dashboard</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {greeting}, <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">{user?.name || 'there'}</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Here&apos;s your recruitment overview for today
              </p>
            </div>
            <Link href="/upload-resume">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all"
              >
                <Upload className="h-4 w-4" />
                Start Screening
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 hover:shadow-xl transition-all cursor-pointer overflow-hidden relative"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} text-white mb-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{action.label}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.desc}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Top Candidates */}
        {recentCandidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-500" />
                Top Candidates
              </h2>
              <Link href="/results" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {recentCandidates.map((candidate, index) => {
                const getScoreColor = (score: number) => {
                  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
                  if (score >= 60) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
                  if (score >= 45) return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
                  return 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30';
                };
                const isUnscreened = candidate.isUnscreened;
                return (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={`flex items-center gap-4 px-5 py-4 ${index < recentCandidates.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {candidate.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{candidate.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{candidate.email}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {candidate.skills.slice(0, 2).map(skill => (
                        <span key={skill} className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${isUnscreened ? 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400' : getScoreColor(candidate.score)}`}>
                      {isUnscreened ? 'N/A' : `${candidate.score}%`}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Active Jobs */}
        {jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-500" />
                Active Positions
              </h2>
              <Link href="/job-description" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                Create new <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.slice(0, 6).map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-5 hover:shadow-lg transition-all"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{job.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{job.description?.substring(0, 60) || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                      <UserCheck className="h-3 w-3" />
                      {filteredResumes.filter((r: Resume) => r.jobId === job.id).length} candidates
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {stats.totalCandidates === 0 && stats.activeJobs === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <FileText className="h-10 w-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get Started with HireQ</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Upload resumes or create a job description to begin your AI-powered recruitment journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/upload-resume">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-medium"
                >
                  <Upload className="h-4 w-4" />
                  Upload Resumes
                </motion.button>
              </Link>
              <Link href="/job-description">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium border border-gray-200 dark:border-gray-700"
                >
                  <Briefcase className="h-4 w-4" />
                  Create Job
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
