'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase,
  FileText,
  MessageSquare,
  Search,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Target,
  CheckCircle2,
  Building,
  MapPin,
  Clock,
  Award,
  TrendingUp,
  BarChart3,
  Calendar,
  RefreshCw,
  Upload,
  Users,
  Gift,
  XCircle,
  Lightbulb,
  BookOpen,
  Bookmark,
  Mail,
  Zap,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  getCandidateApplications,
  getOpenJobs,
  getCandidateDashboardStats,
  getCandidateProfile,
  getUnreadCount,
  getSavedJobs,
  type CandidateDashboardStats,
} from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

/* ═══════════════════════════════════════════
   Shimmer skeleton while loading
   ═══════════════════════════════════════════ */
function CandidateHomeSkeleton() {
  const shimmer =
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent';
  const bar = (w: string, h = 'h-4') =>
    `${h} ${w} rounded-lg bg-gray-200 dark:bg-gray-800 ${shimmer}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className={bar('w-32', 'h-8')} />
          <div className={`${bar('w-64', 'h-10')} mt-3`} />
          <div className={`${bar('w-48')} mt-2`} />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
              <div className={bar('w-12', 'h-12')} />
              <div className={`${bar('w-16', 'h-8')} mt-3`} />
              <div className={`${bar('w-20')} mt-2`} />
            </div>
          ))}
        </div>
        {/* Insights skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
              <div className={bar('w-full', 'h-4')} />
              <div className={`${bar('w-20', 'h-8')} mt-3`} />
              <div className={`${bar('w-32')} mt-2`} />
            </div>
          ))}
        </div>
        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${bar('w-full', 'h-16')} ${i > 0 ? 'mt-3' : ''}`} />
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`${bar('w-full', 'h-16')} ${i > 0 ? 'mt-3' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Status badge component
   ═══════════════════════════════════════════ */
const STATUS_STYLES: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  screening: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  hired: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════
   Relative time helper
   ═══════════════════════════════════════════ */
function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ═══════════════════════════════════════════
   Career tips data
   ═══════════════════════════════════════════ */
const careerTips = [
  { title: 'Optimize your resume', desc: 'Mirror keywords from job descriptions to boost your AI match score.', icon: Lightbulb, accent: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
  { title: 'Research companies', desc: 'Study company culture before interviews for more authentic conversations.', icon: BookOpen, accent: 'text-blue-500', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
  { title: 'Quantify achievements', desc: 'Use numbers and metrics — they make accomplishments 3x more memorable.', icon: Sparkles, accent: 'text-purple-500', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
];

/* ═══════════════════════════════════════════
   Main page component
   ═══════════════════════════════════════════ */
export default function CandidateHomePage() {
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Data states
  const [dashStats, setDashStats] = useState<CandidateDashboardStats | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [openJobs, setOpenJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  /* ── Fetch all data ── */
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [statsRes, appsRes, jobsRes, profileRes, unreadRes, savedRes] = await Promise.all([
        getCandidateDashboardStats().catch(() => null),
        getCandidateApplications().catch(() => ({ applications: [] })),
        getOpenJobs().catch(() => []),
        getCandidateProfile().catch(() => null),
        getUnreadCount().catch(() => ({ unread_count: 0 })),
        getSavedJobs().catch(() => ({ saved_jobs: [] })),
      ]);
      if (statsRes) setDashStats(statsRes);
      setApplications(appsRes.applications || []);
      setOpenJobs(jobsRes || []);
      if (profileRes) setProfile(profileRes);
      setUnreadCount(unreadRes.unread_count || 0);
      setSavedJobIds(savedRes.saved_jobs || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch candidate data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Real-time updates ── */
  useRealtimeUpdates({
    onEvent: (event) => {
      if (['application_update', 'new_message', 'interview_scheduled'].includes(event.type)) {
        fetchData(true);
      }
    },
  });

  /* ── Refetch on tab focus ── */
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchData(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchData]);

  /* ── Derived data ── */
  const stats = {
    total: dashStats?.total ?? applications.length,
    pending: dashStats?.pending ?? applications.filter((a: any) => a.status === 'applied').length,
    screening: dashStats?.screening ?? applications.filter((a: any) => a.status === 'screening').length,
    interview: dashStats?.interview ?? applications.filter((a: any) => a.status === 'interview').length,
    offers: dashStats?.offers ?? applications.filter((a: any) => a.status === 'offer').length,
    hired: dashStats?.hired ?? applications.filter((a: any) => a.status === 'hired').length,
    rejected: dashStats?.rejected ?? applications.filter((a: any) => a.status === 'rejected').length,
  };

  const upcomingInterviews = dashStats?.upcoming_interviews ?? [];
  const recentApps = [...applications].sort((a, b) => new Date(b.applied_at || b.created_at || 0).getTime() - new Date(a.applied_at || a.created_at || 0).getTime()).slice(0, 5);
  const recommendedJobs = openJobs.slice(0, 4);
  const activeInPipeline = stats.screening + stats.interview + stats.offers;
  const successRate = stats.total > 0 ? Math.round(((stats.interview + stats.offers + stats.hired) / stats.total) * 100) : 0;

  /* ── Stat cards (match HR dashboard pattern — 6 cols) ── */
  const statCards = [
    { icon: <FileText className="h-6 w-6" />, label: 'Total Applied', value: stats.total, color: 'from-candidate-500 to-cyan-500' },
    { icon: <Clock className="h-6 w-6" />, label: 'Pending', value: stats.pending, color: 'from-blue-500 to-cyan-500' },
    { icon: <Search className="h-6 w-6" />, label: 'Screening', value: stats.screening, color: 'from-amber-500 to-orange-500' },
    { icon: <Users className="h-6 w-6" />, label: 'Interviews', value: stats.interview, color: 'from-purple-500 to-pink-500' },
    { icon: <Gift className="h-6 w-6" />, label: 'Offers', value: stats.offers, color: 'from-green-500 to-emerald-500' },
    { icon: <CheckCircle2 className="h-6 w-6" />, label: 'Hired', value: stats.hired, color: 'from-emerald-500 to-teal-500' },
  ];

  /* ── Quick actions ── */
  const quickActions = [
    { icon: Briefcase, label: 'Browse Jobs', href: '/candidate/jobs', color: 'from-candidate-500 to-cyan-500' },
    { icon: FileText, label: 'Applications', href: '/candidate/applications', color: 'from-blue-500 to-cyan-500' },
    { icon: MessageSquare, label: 'Messages', href: '/candidate/messages', badge: unreadCount > 0 ? unreadCount : undefined, color: 'from-purple-500 to-pink-500' },
    { icon: Upload, label: 'Upload Resume', href: '/candidate/resume', color: 'from-amber-500 to-orange-500' },
    { icon: Bookmark, label: 'Saved Jobs', href: '/candidate/jobs', color: 'from-green-500 to-emerald-500' },
    { icon: Target, label: 'My Profile', href: '/candidate/profile', color: 'from-rose-500 to-red-500' },
  ];

  /* ── Loading state ── */
  if (isLoading) {
    return <CandidateHomeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Background blobs (matching HR dashboard pattern) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-candidate-500/5 via-cyan-500/5 to-purple-500/5" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-candidate-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-candidate-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ═══════ Header ═══════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-candidate-100 dark:bg-candidate-900/30 text-candidate-700 dark:text-candidate-300 text-sm font-medium mb-4"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Career Overview</span>
              </motion.div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.name ? (
                  <>Welcome back, <span className="bg-gradient-to-r from-candidate-600 to-cyan-600 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span></>
                ) : (
                  <>Career <span className="bg-gradient-to-r from-candidate-600 to-cyan-600 bg-clip-text text-transparent">Dashboard</span></>
                )}
              </h1>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Calendar className="h-5 w-5" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-candidate-500 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
              {lastUpdated && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Overview banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-candidate-50 to-cyan-50 dark:from-candidate-900/20 dark:to-cyan-900/20 rounded-2xl p-4 border border-candidate-200 dark:border-candidate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-candidate-500 to-cyan-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-candidate-600 dark:text-candidate-400 font-medium">
                  {activeInPipeline > 0
                    ? `${activeInPipeline} application${activeInPipeline > 1 ? 's' : ''} actively in pipeline`
                    : 'Start applying to get your career moving'}
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {stats.total > 0
                    ? `${successRate}% interview/offer rate across ${stats.total} application${stats.total > 1 ? 's' : ''}`
                    : 'Browse open positions and apply with one click'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ═══════ Stat Cards Grid (6 cols like HR) ═══════ */}
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
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:border-candidate-500/30 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══════ Insights Row (4 cards, like Time-to-Hire) ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-candidate-500 to-cyan-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Application Insights</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track your job search progress</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Success Rate */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-candidate-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{successRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Interview + offer rate</p>
            </div>

            {/* Active Pipeline */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">In Pipeline</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeInPipeline}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Screening + interview + offer</p>
            </div>

            {/* Saved Jobs */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Saved Jobs</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{savedJobIds.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Bookmarked for later</p>
            </div>

            {/* Pipeline Breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Breakdown</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600 dark:text-amber-400">Screening</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.screening}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-600 dark:text-purple-400">Interview</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.interview}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 dark:text-green-400">Offers</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.offers}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════ Two-column: Recent Applications + Upcoming/Quick Actions ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Applications</h2>
              {recentApps.length > 0 && (
                <Link href="/candidate/applications">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="text-candidate-600 dark:text-candidate-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              )}
            </div>

            {recentApps.length > 0 ? (
              <div className="space-y-3">
                {recentApps.map((app: any, index: number) => (
                  <motion.div
                    key={app.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(0.3 + index * 0.04, 0.5) }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-candidate-500/10 to-cyan-500/10 dark:from-candidate-500/20 dark:to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Building className="h-5 w-5 text-candidate-600 dark:text-candidate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{app.job_title || app.title || 'Position'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(app.applied_at || app.created_at)}</p>
                      </div>
                    </div>
                    <StatusBadge status={app.status || 'applied'} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">No applications yet</p>
                <Link href="/candidate/jobs">
                  <motion.button whileHover={{ scale: 1.02 }} className="px-6 py-3 bg-gradient-to-r from-candidate-500 to-cyan-600 text-white rounded-xl font-medium shadow-lg">
                    Browse Jobs
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Right column: Upcoming Interviews + Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Upcoming Interviews */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Interviews</h2>
              </div>

              {upcomingInterviews.length > 0 ? (
                <div className="space-y-3">
                  {upcomingInterviews.slice(0, 3).map((interview: any, i: number) => (
                    <div key={interview.application_id || i} className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{interview.job_title}</p>
                        {interview.company && <p className="text-xs text-gray-500 dark:text-gray-400">{interview.company}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming interviews</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, i) => (
                  <Link key={i} href={action.href}>
                    <motion.div
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-candidate-500/40 bg-gray-50 dark:bg-gray-800 hover:bg-candidate-50 dark:hover:bg-candidate-900/10 transition-all cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                      {action.badge && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                          {action.badge}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════ Recommended Jobs (like Top Candidates list) ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recommended Jobs</h2>
            {recommendedJobs.length > 0 && (
              <Link href="/candidate/jobs">
                <motion.button whileHover={{ scale: 1.02 }} className="text-candidate-600 dark:text-candidate-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Browse All
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            )}
          </div>

          {recommendedJobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedJobs.map((job: any, i: number) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.3 + i * 0.05, 0.5) }}
                >
                  <Link href={`/candidate/jobs/${job.id}`} className="block group">
                    <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-candidate-500/40 hover:bg-candidate-50 dark:hover:bg-candidate-900/10 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-candidate-500/10 to-purple-500/10 dark:from-candidate-500/20 dark:to-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Building className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">{job.title}</h3>
                          {job.location && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{job.description}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-candidate-600 dark:text-candidate-400 group-hover:gap-1.5 transition-all">
                        View role <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No open positions right now</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Check back soon for new opportunities</p>
            </div>
          )}
        </motion.div>

        {/* ═══════ Career Tips ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Career Tips</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {careerTips.map((tip, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className={`w-9 h-9 rounded-lg ${tip.bg} flex items-center justify-center flex-shrink-0`}>
                  <tip.icon className={`h-4 w-4 ${tip.accent}`} />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{tip.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
