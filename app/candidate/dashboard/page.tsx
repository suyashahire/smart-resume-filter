'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  Search,
  Users,
  Gift,
  XCircle,
  ChevronRight,
  Upload,
  Target,
  Building,
  Calendar,
  Lightbulb,
  BarChart3,
  BookOpen,
  Sparkles,
  MessageSquare,
  Zap,
  ArrowRight,
  Briefcase,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  getCandidateApplications,
  getOpenJobs,
  getCandidateProfile,
} from '@/lib/api';
import {
  KpiCard,
  DashboardSection,
  QuickActionItem,
  EmptyState,
  PipelineStepper,
  ApplicationListItem,
  SkeletonDashboard,
} from '@/components/candidate/dashboard';

/* ────────────────────────────────────────────
 *  Types & config
 * ──────────────────────────────────────────── */

interface DashboardStats {
  total: number;
  pending: number;
  screening: number;
  interview: number;
  offers: number;
  rejected: number;
}

const kpiConfig = [
  { key: 'total', label: 'Total', icon: FileText, accent: 'bg-candidate-500' },
  { key: 'pending', label: 'Pending', icon: Clock, accent: 'bg-blue-500' },
  { key: 'screening', label: 'Screening', icon: Search, accent: 'bg-amber-500' },
  { key: 'interview', label: 'Interview', icon: Users, accent: 'bg-purple-500' },
  { key: 'offers', label: 'Offers', icon: Gift, accent: 'bg-green-500' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, accent: 'bg-red-500' },
];

const pipelineStages = [
  { key: 'applied', label: 'Applied', icon: FileText },
  { key: 'screening', label: 'Screening', icon: Search },
  { key: 'interview', label: 'Interview', icon: Users },
  { key: 'offer', label: 'Offer', icon: Gift },
];

const careerTips = [
  {
    title: 'Optimize your resume',
    description: 'Mirror keywords from job descriptions to boost your AI match score.',
    icon: Lightbulb,
    accent: 'text-amber-500',
    accentBg: 'bg-amber-500/10 dark:bg-amber-500/20',
  },
  {
    title: 'Research companies',
    description: 'Study company culture before interviews for more authentic conversations.',
    icon: BookOpen,
    accent: 'text-blue-500',
    accentBg: 'bg-blue-500/10 dark:bg-blue-500/20',
  },
  {
    title: 'Quantify achievements',
    description: 'Use numbers and metrics — they make accomplishments 3× more memorable.',
    icon: Sparkles,
    accent: 'text-purple-500',
    accentBg: 'bg-purple-500/10 dark:bg-purple-500/20',
  },
  {
    title: 'Build your network',
    description: 'Active networking opens doors to 70% of unadvertised positions.',
    icon: Building,
    accent: 'text-candidate-500',
    accentBg: 'bg-candidate-500/10 dark:bg-candidate-500/20',
  },
];

/* ────────────────────────────────────────────
 *  SVG Progress Ring component
 * ──────────────────────────────────────────── */

function ProfileRing({ percent }: { percent: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * percent) / 100;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-gray-100 dark:text-gray-800"
        />
        {/* Progress */}
        <motion.circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          strokeDasharray={circ}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{percent}%</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Complete</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
 *  Main Dashboard Page
 * ──────────────────────────────────────────── */

export default function CandidateDashboardPage() {
  const { user } = useStore();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, pending: 0, screening: 0, interview: 0, offers: 0, rejected: 0,
  });
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [appsData, jobsData, profileData] = await Promise.all([
        getCandidateApplications(),
        getOpenJobs(),
        getCandidateProfile().catch(() => null),
      ]);
      const apps = appsData.applications || [];
      const total = apps.length;
      const pending = apps.filter((a: any) => a.status === 'applied').length;
      const screening = apps.filter((a: any) => a.status === 'screening').length;
      const interview = apps.filter((a: any) => a.status === 'interview').length;
      const offers = apps.filter((a: any) => a.status === 'offer').length;
      const rejected = apps.filter((a: any) => a.status === 'rejected').length;
      setStats({ total, pending, screening, interview, offers, rejected });

      const filtered = (jobsData || []).filter(
        (j: { title?: string }) => j.title?.trim() !== 'Full Stack Developer'
      );
      setRecommendedJobs(filtered.slice(0, 4));
      setRecentApplications(apps.slice(0, 5));
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchData]);

  /* ── Derived data ── */
  const profileChecks = [
    { key: 'name', label: 'Name added', done: !!(profile?.name || user?.name) },
    { key: 'email', label: 'Email verified', done: !!(profile?.email || user?.email) },
    { key: 'phone', label: 'Phone number', done: !!profile?.phone },
    { key: 'resume', label: 'Resume uploaded', done: !!profile?.resume_url },
  ];
  const completedChecks = profileChecks.filter((c) => c.done).length;
  const profilePercent = profileChecks.length ? Math.round((completedChecks / profileChecks.length) * 100) : 0;
  const maxStat = Math.max(stats.total, 1);

  const pipelineCounts = pipelineStages.map((s) => ({
    ...s,
    count:
      s.key === 'offer' ? stats.offers :
        s.key === 'applied' ? stats.pending :
          stats[s.key as keyof DashboardStats] as number,
  }));

  const contextTip = (() => {
    if (stats.total === 0) return 'Start applying to see your pipeline progress here';
    if (stats.interview > 0) return `You have ${stats.interview} active interview${stats.interview > 1 ? 's' : ''} — good luck!`;
    if (stats.screening > 0) return "You're waiting for screening results — hang tight!";
    if (stats.pending > 0) return `${stats.pending} application${stats.pending > 1 ? 's' : ''} under review by hiring teams`;
    return 'Keep applying to build momentum in your job search';
  })();

  const firstName = (profile?.name || user?.name || 'there').split(' ')[0];

  /* ── Loading state ── */
  if (isLoading) return <SkeletonDashboard />;

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen">
      {/* Background layers */}
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 -z-10" />
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.07),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.05),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-100/50 to-transparent dark:from-gray-900/30 dark:to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8"
        >
          <div className="lg:col-span-8">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-candidate-500/10 dark:bg-candidate-500/15 text-candidate-600 dark:text-candidate-400 border border-candidate-500/15 dark:border-candidate-500/25 mb-3">
              <Briefcase className="h-3 w-3" />
              Career Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Here&apos;s a snapshot of your job search progress and next steps.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-wrap items-center gap-3 lg:justify-end">
            <Link
              href="/candidate/resume"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                border border-gray-200 dark:border-gray-700
                bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-800
                hover:border-gray-300 dark:hover:border-gray-600
                shadow-sm transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500"
            >
              <Upload className="h-4 w-4" />
              Update Resume
            </Link>
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500
                text-white shadow-sm shadow-candidate-500/20
                hover:shadow-md hover:shadow-candidate-500/25
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 focus-visible:ring-offset-2"
            >
              Find Jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700/80 to-transparent mb-7" aria-hidden />

        {/* ═══ KPI ROW ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {kpiConfig.map((item, i) => (
            <KpiCard
              key={item.key}
              label={item.label}
              value={stats[item.key as keyof DashboardStats]}
              icon={item.icon}
              accentColor={item.accent}
              progressPercent={
                item.key === 'total'
                  ? 100
                  : (stats[item.key as keyof DashboardStats] / maxStat) * 100
              }
              index={i}
            />
          ))}
        </div>

        {/* ═══ MAIN CONTENT GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ── Left column (8) ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Pipeline Stepper */}
            <PipelineStepper stages={pipelineCounts} contextTip={contextTip} />

            {/* Recent Applications */}
            <DashboardSection
              title="Recent Applications"
              icon={FileText}
              actionLabel="View All"
              actionHref="/candidate/applications"
              card
              divider
            >
              {recentApplications.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No applications yet"
                  subtitle="Take the first step — browse open positions and apply with one click."
                  actionLabel="Browse Jobs"
                  actionHref="/candidate/jobs"
                />
              ) : (
                <div className="space-y-0.5">
                  {recentApplications.map((app: any, i: number) => (
                    <ApplicationListItem
                      key={app.id}
                      id={app.id}
                      jobTitle={app.job_title || 'Application'}
                      company={app.company}
                      status={app.status}
                      updatedAt={app.updated_at || app.applied_at}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </DashboardSection>

            {/* For You — Recommended Jobs */}
            <DashboardSection
              title="Recommended for You"
              icon={Sparkles}
              actionLabel="See All"
              actionHref="/candidate/jobs"
              card
              divider
            >
              {recommendedJobs.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No recommendations yet"
                  subtitle="Upload your resume and we'll match you with relevant positions."
                  actionLabel="Upload Resume"
                  actionHref="/candidate/resume"
                  secondaryLabel="Browse all jobs"
                  secondaryHref="/candidate/jobs"
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {recommendedJobs.map((job, i) => (
                    <Link
                      key={job.id}
                      href={`/candidate/jobs/${job.id}`}
                      className="group block p-4 rounded-xl
                        border border-gray-100 dark:border-gray-800
                        hover:border-candidate-300/50 dark:hover:border-candidate-600/30
                        bg-gray-50/50 dark:bg-gray-800/30
                        hover:bg-candidate-50/50 dark:hover:bg-candidate-900/10
                        hover:shadow-sm
                        transition-all duration-150"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-candidate-500/10 dark:bg-candidate-500/20 flex items-center justify-center">
                          <Building className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">
                            {job.title}
                          </p>
                          {job.company && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{job.company}</p>
                          )}
                          {(job.location || job.salary_range) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {job.location && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5">{job.location}</span>
                              )}
                              {job.salary_range && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5">{job.salary_range}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-candidate-600 dark:text-candidate-400 font-semibold mt-3">
                        View role <ChevronRight className="h-3 w-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </DashboardSection>

            {/* Career Tips */}
            <DashboardSection title="Career Tips" icon={Lightbulb} card divider>
              <div className="grid sm:grid-cols-2 gap-3">
                {careerTips.map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.2 }}
                    className="group p-3.5 rounded-xl
                      border border-gray-100 dark:border-gray-800
                      hover:border-gray-200 dark:hover:border-gray-700
                      hover:bg-gray-50/60 dark:hover:bg-gray-800/40
                      hover:shadow-sm
                      transition-all duration-150 cursor-default"
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${tip.accentBg}`}>
                        <tip.icon className={`h-4 w-4 ${tip.accent}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{tip.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{tip.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </DashboardSection>
          </div>

          {/* ── Right column (4) — sticky sidebar ── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Profile Strength */}
              <DashboardSection title="Profile Strength" icon={Target} card divider>
                <ProfileRing percent={profilePercent} />

                <ul className="mt-5 space-y-2.5">
                  {profileChecks.map((check) => (
                    <li key={check.key} className="flex items-center gap-2.5 text-sm">
                      {check.done ? (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-700" />
                      )}
                      <span className={check.done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                        {check.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/candidate/profile"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                    bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500
                    text-white shadow-sm shadow-candidate-500/20
                    hover:shadow-md hover:shadow-candidate-500/25
                    transition-all duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500"
                >
                  Complete Profile
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </DashboardSection>

              {/* Upcoming Interviews */}
              <DashboardSection title="Upcoming Interviews" icon={Calendar} card divider>
                <EmptyState
                  icon={Calendar}
                  title="No upcoming interviews"
                  subtitle="Scheduled interviews will appear here — keep applying!"
                  actionLabel="View Applications"
                  actionHref="/candidate/applications"
                />
              </DashboardSection>

              {/* Quick Actions */}
              <DashboardSection title="Quick Actions" icon={Zap} card divider>
                <div className="space-y-2">
                  <QuickActionItem
                    title="Browse Jobs"
                    subtitle="Find your next opportunity"
                    icon={Search}
                    href="/candidate/jobs"
                    iconBgClass="bg-candidate-500/10 dark:bg-candidate-500/20 text-candidate-600 dark:text-candidate-400"
                  />
                  <QuickActionItem
                    title="Upload Resume"
                    subtitle="Keep your profile current"
                    icon={Upload}
                    href="/candidate/resume"
                    iconBgClass="bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                  />
                  <QuickActionItem
                    title="Messages"
                    subtitle="Chat with recruiters"
                    icon={MessageSquare}
                    href="/candidate/messages"
                    iconBgClass="bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                  />
                </div>
              </DashboardSection>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
