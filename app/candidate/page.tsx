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
  Calendar,
  Upload,
  Users,
  Zap,
  Star,
  Eye,
  BarChart3,
  Rocket,
  Shield,
  Brain,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  getCandidateApplications,
  getOpenJobs,
  getCandidateDashboardStats,
  getCandidateProfile,
  getUnreadCount,
  type CandidateDashboardStats,
  type CandidateApplication,
  type JobDescriptionResponse,
} from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

/* ═══════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════ */
function CandidateHomeSkeleton() {
  const shimmer =
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent';
  const bar = (w: string, h = 'h-4') =>
    `${h} ${w} rounded-lg bg-gray-200 dark:bg-gray-800 ${shimmer}`;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-12 text-center">
          <div className={`${bar('w-40', 'h-5')} mx-auto`} />
          <div className={`${bar('w-80', 'h-10')} mx-auto mt-4`} />
          <div className={`${bar('w-64', 'h-5')} mx-auto mt-3`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 h-44" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 h-72" />
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 h-72" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Greeting helper
   ═══════════════════════════════════════════ */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ═══════════════════════════════════════════
   Activity item
   ═══════════════════════════════════════════ */
const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  applied: { dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
  screening: { dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' },
  interview: { dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400' },
  offer: { dot: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
  hired: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  rejected: { dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
};

function formatTimeAgo(dateStr?: string): string {
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
   Main Page
   ═══════════════════════════════════════════ */
export default function CandidateHomePage() {
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  const [dashStats, setDashStats] = useState<CandidateDashboardStats | null>(null);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [openJobs, setOpenJobs] = useState<JobDescriptionResponse[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, appsRes, jobsRes, profileRes, unreadRes] = await Promise.all([
        getCandidateDashboardStats().catch(() => null),
        getCandidateApplications().catch(() => ({ applications: [] })),
        getOpenJobs().catch(() => []),
        getCandidateProfile().catch(() => null),
        getUnreadCount().catch(() => ({ unread_count: 0 })),
      ]);
      if (statsRes) setDashStats(statsRes);
      setApplications(appsRes.applications || []);
      setOpenJobs(jobsRes || []);
      if (profileRes) setProfile(profileRes);
      setUnreadCount(unreadRes.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch candidate data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useRealtimeUpdates({
    onEvent: (event) => {
      if (['application_update', 'new_message', 'interview_scheduled'].includes(event.type)) {
        fetchData();
      }
    },
  });

  /* ── Derived ── */
  const firstName = (profile?.name || user?.name || 'there').split(' ')[0];
  const totalApps = dashStats?.total ?? applications.length;
  const interviewCount = dashStats?.interview ?? applications.filter(a => a.status === 'interview').length;
  const offerCount = dashStats?.offers ?? applications.filter(a => a.status === 'offer').length;
  const upcomingInterviews = dashStats?.upcoming_interviews ?? [];
  const recentApps = [...applications]
    .sort((a, b) => new Date(b.applied_at || b.created_at || 0).getTime() - new Date(a.applied_at || a.created_at || 0).getTime())
    .slice(0, 4);
  const featuredJobs = openJobs.slice(0, 6);

  if (isLoading) return <CandidateHomeSkeleton />;

  return (
    <div className="min-h-screen">
      {/* ═══ Background ═══ */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-gradient-to-b from-candidate-500/[0.06] via-cyan-500/[0.03] to-transparent dark:from-candidate-500/[0.04] dark:via-cyan-500/[0.02]" />
        <div className="absolute top-32 -left-32 w-96 h-96 rounded-full bg-candidate-500/[0.05] blur-3xl" />
        <div className="absolute top-64 -right-32 w-80 h-80 rounded-full bg-cyan-500/[0.05] blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* ═══════════════════════════════════
            HERO — Greeting + CTA
           ═══════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative mb-10"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-800/80 border border-gray-800 dark:border-gray-700/50 p-8 sm:p-10 lg:p-12">
            {/* Decorative mesh */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-candidate-500/15 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-candidate-600/[0.06] blur-[100px]" />
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }}
              />
            </div>

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-candidate-500/15 border border-candidate-500/20 text-candidate-400 text-xs font-semibold tracking-wide uppercase mb-5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {getGreeting()}
                </motion.div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-4">
                  {firstName !== 'there' ? (
                    <>Hey {firstName},<br /><span className="bg-gradient-to-r from-candidate-400 to-cyan-400 bg-clip-text text-transparent">let&apos;s find your next role</span></>
                  ) : (
                    <>Your career journey<br /><span className="bg-gradient-to-r from-candidate-400 to-cyan-400 bg-clip-text text-transparent">starts here</span></>
                  )}
                </h1>
                <p className="text-gray-400 text-base sm:text-lg max-w-lg leading-relaxed">
                  {totalApps > 0
                    ? `You have ${totalApps} active application${totalApps > 1 ? 's' : ''}${interviewCount > 0 ? ` and ${interviewCount} interview${interviewCount > 1 ? 's' : ''} lined up` : ''}. Keep the momentum going.`
                    : 'Explore opportunities, track applications, and land your dream job — all in one place.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-7">
                  <Link href="/candidate/jobs">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-candidate-500 to-cyan-500 hover:from-candidate-600 hover:to-cyan-600 text-white shadow-lg shadow-candidate-500/20 transition-all"
                    >
                      <Search className="h-4 w-4" />
                      Explore Jobs
                    </motion.button>
                  </Link>
                  <Link href="/candidate/resume">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 backdrop-blur-sm transition-all"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Resume
                    </motion.button>
                  </Link>
                </div>
              </div>

              {/* Right side — mini stats */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.35 }}
                className="hidden lg:grid grid-cols-2 gap-3 w-72 flex-shrink-0"
              >
                {[
                  { label: 'Applications', value: totalApps, icon: FileText, color: 'from-candidate-500/20 to-candidate-500/5 border-candidate-500/20' },
                  { label: 'Interviews', value: interviewCount, icon: Users, color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20' },
                  { label: 'Offers', value: offerCount, icon: Award, color: 'from-green-500/20 to-green-500/5 border-green-500/20' },
                  { label: 'New Jobs', value: openJobs.length, icon: Briefcase, color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className={`rounded-xl bg-gradient-to-br ${stat.color} border p-4 backdrop-blur-sm`}
                  >
                    <stat.icon className="h-4 w-4 text-gray-400 mb-2" />
                    <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════
            QUICK NAV CARDS
           ═══════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            { label: 'Dashboard', desc: 'Full analytics', icon: BarChart3, href: '/candidate/dashboard', accent: 'group-hover:text-candidate-500', accentBg: 'bg-candidate-500/10 dark:bg-candidate-500/15 group-hover:bg-candidate-500/20' },
            { label: 'My Applications', desc: `${totalApps} active`, icon: FileText, href: '/candidate/applications', accent: 'group-hover:text-blue-500', accentBg: 'bg-blue-500/10 dark:bg-blue-500/15 group-hover:bg-blue-500/20' },
            { label: 'Messages', desc: unreadCount > 0 ? `${unreadCount} unread` : 'Recruiter chat', icon: MessageSquare, href: '/candidate/messages', accent: 'group-hover:text-purple-500', accentBg: 'bg-purple-500/10 dark:bg-purple-500/15 group-hover:bg-purple-500/20', badge: unreadCount },
            { label: 'ATS Panel', desc: 'Score check', icon: Brain, href: '/candidate/resume/insights', accent: 'group-hover:text-amber-500', accentBg: 'bg-amber-500/10 dark:bg-amber-500/15 group-hover:bg-amber-500/20' },
          ].map((item, i) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                whileHover={{ y: -3 }}
                className="group relative bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-200 cursor-pointer h-full"
              >
                <div className={`w-10 h-10 rounded-xl ${item.accentBg} flex items-center justify-center transition-colors mb-3`}>
                  <item.icon className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${item.accent} transition-colors`} />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                {item.badge ? (
                  <span className="absolute top-3 right-3 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                ) : null}
                <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors" />
              </motion.div>
            </Link>
          ))}
        </motion.section>

        {/* ═══════════════════════════════════
            MAIN 2-COLUMN: Activity + Jobs
           ═══════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">

          {/* ── Left: Activity Feed ── */}
          <motion.section
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 pb-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-candidate-500/10 dark:bg-candidate-500/15 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
                  </div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                </div>
                <Link href="/candidate/applications" className="text-xs font-semibold text-candidate-600 dark:text-candidate-400 hover:underline flex items-center gap-1">
                  All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-5">
                {recentApps.length > 0 ? (
                  <div className="space-y-2.5">
                    {recentApps.map((app, i) => {
                      const colors = STATUS_COLORS[app.status] || STATUS_COLORS.applied;
                      return (
                        <motion.div
                          key={app.id || i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                        >
                          <Link href={`/candidate/applications/${app.id}`} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="mt-1 flex-shrink-0">
                              <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">
                                {app.job_title || app.title || 'Application'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${colors.bg} ${colors.text}`}>
                                  {app.status}
                                </span>
                                <span className="text-[11px] text-gray-400">{formatTimeAgo(app.applied_at || app.created_at)}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No activity yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Your applications will appear here</p>
                  </div>
                )}
              </div>

              {/* Upcoming interviews inline */}
              {upcomingInterviews.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Upcoming Interviews</span>
                  </div>
                  <div className="space-y-2">
                    {upcomingInterviews.slice(0, 2).map((iv: CandidateDashboardStats['upcoming_interviews'][number], idx: number) => (
                      <div key={iv.application_id || idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                          <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{iv.job_title}</p>
                          {iv.company && <p className="text-[11px] text-gray-500 dark:text-gray-400">{iv.company}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* ── Right: Featured Jobs ── */}
          <motion.section
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="lg:col-span-3"
          >
            <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 pb-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/15 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">Open Positions</h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{openJobs.length} jobs available</p>
                  </div>
                </div>
                <Link href="/candidate/jobs" className="text-xs font-semibold text-candidate-600 dark:text-candidate-400 hover:underline flex items-center gap-1">
                  View All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-5">
                {featuredJobs.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {featuredJobs.map((job, i) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32 + i * 0.04 }}
                      >
                        <Link href={`/candidate/jobs/${job.id}`} className="group block p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-candidate-300/50 dark:hover:border-candidate-600/30 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-candidate-50/40 dark:hover:bg-candidate-900/10 hover:shadow-sm transition-all duration-150">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-candidate-500/10 to-cyan-500/10 dark:from-candidate-500/20 dark:to-cyan-500/20 flex items-center justify-center">
                              <Building className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">{job.title}</p>
                              {(job.company || job.location) && (
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                  {job.company && <span>{job.company}</span>}
                                  {job.company && job.location && <span className="text-gray-300 dark:text-gray-600">·</span>}
                                  {job.location && (
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="h-2.5 w-2.5" />{job.location}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            {job.job_type && (
                              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-0.5 capitalize">{job.job_type.replace('-', ' ')}</span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-candidate-600 dark:text-candidate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              Apply <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No open positions yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">New opportunities will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </div>

        {/* ═══════════════════════════════════
            GET STARTED / NEXT STEPS
           ═══════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-candidate-500 to-cyan-500 flex items-center justify-center">
              <Rocket className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">
              {totalApps === 0 ? 'Get Started' : 'Power Up Your Search'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: FileText,
                title: 'Perfect Your Resume',
                desc: 'Upload your resume and get AI-powered ATS scores, improvement tips, and see how you compare to other candidates.',
                href: '/candidate/resume',
                cta: 'Upload Resume',
                gradient: 'from-candidate-500/10 via-candidate-500/5 to-transparent dark:from-candidate-500/15 dark:via-candidate-500/5',
                iconBg: 'bg-candidate-500/15 dark:bg-candidate-500/25',
                iconColor: 'text-candidate-600 dark:text-candidate-400',
              },
              {
                icon: Target,
                title: 'Complete Your Profile',
                desc: 'A complete profile increases your visibility to recruiters. Add your skills, experience, and preferences.',
                href: '/candidate/profile',
                cta: 'Edit Profile',
                gradient: 'from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-500/15 dark:via-purple-500/5',
                iconBg: 'bg-purple-500/15 dark:bg-purple-500/25',
                iconColor: 'text-purple-600 dark:text-purple-400',
              },
              {
                icon: Search,
                title: 'Discover Opportunities',
                desc: 'Browse curated job listings matched to your skills. Apply with a single click and track everything in real time.',
                href: '/candidate/jobs',
                cta: 'Browse Jobs',
                gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent dark:from-cyan-500/15 dark:via-cyan-500/5',
                iconBg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
                iconColor: 'text-cyan-600 dark:text-cyan-400',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
              >
                <Link href={card.href} className="group block h-full">
                  <div className={`relative h-full bg-gradient-to-br ${card.gradient} border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-200/40 dark:hover:shadow-black/20 transition-all duration-200`}>
                    <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center mb-4`}>
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">{card.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-candidate-600 dark:text-candidate-400 group-hover:gap-2.5 transition-all">
                      {card.cta}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════
            PLATFORM FEATURES
           ═══════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.35 }}
        >
          <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Everything you need to land the job</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">HireQ gives you the tools and insights to stand out in your job search.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Brain, label: 'AI Screening', desc: 'Smart matching with job requirements', color: 'text-candidate-500' },
                { icon: Shield, label: 'ATS Scoring', desc: 'Check resume compatibility', color: 'text-cyan-500' },
                { icon: TrendingUp, label: 'Score Insights', desc: 'See how you rank among candidates', color: 'text-purple-500' },
                { icon: Zap, label: 'One-Click Apply', desc: 'Apply to jobs in seconds', color: 'text-amber-500' },
              ].map((feat, i) => (
                <motion.div
                  key={feat.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                  className="text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <feat.icon className={`h-5 w-5 ${feat.color}`} />
                  </div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{feat.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
