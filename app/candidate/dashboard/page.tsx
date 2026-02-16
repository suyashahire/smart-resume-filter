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
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  getCandidateApplications,
  getOpenJobs,
  getCandidateProfile,
} from '@/lib/api';
import {
  StatCard,
  DashboardSection,
  QuickActionItem,
  EmptyState,
} from '@/components/candidate/dashboard';

interface DashboardStats {
  total: number;
  pending: number;
  screening: number;
  interview: number;
  offers: number;
  rejected: number;
}

const careerTips = [
  {
    title: 'Optimize your resume',
    description: 'Use keywords from job descriptions to improve your match score.',
    icon: Lightbulb,
    accent: 'text-amber-500',
  },
  {
    title: 'Research companies',
    description: 'Learn about company culture before interviews for better conversations.',
    icon: BookOpen,
    accent: 'text-blue-500',
  },
  {
    title: 'Highlight achievements',
    description: 'Quantify your accomplishments with numbers and metrics.',
    icon: Sparkles,
    accent: 'text-purple-500',
  },
  {
    title: 'Network actively',
    description: 'Connect with professionals in your field on LinkedIn.',
    icon: Building,
    accent: 'text-candidate-500',
  },
];

const statConfig = [
  { key: 'total', label: 'Total', icon: FileText, accent: 'bg-candidate-500' },
  { key: 'pending', label: 'Pending', icon: Clock, accent: 'bg-blue-500' },
  { key: 'screening', label: 'Screening', icon: Search, accent: 'bg-amber-500' },
  { key: 'interview', label: 'Interview', icon: Users, accent: 'bg-purple-500' },
  { key: 'offers', label: 'Offers', icon: Gift, accent: 'bg-green-500' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, accent: 'bg-red-500' },
];

const pipelineStages = [
  { key: 'applied', label: 'Applied', icon: FileText, color: 'text-blue-500' },
  { key: 'screening', label: 'Screening', icon: Search, color: 'text-amber-500' },
  { key: 'interview', label: 'Interview', icon: Users, color: 'text-purple-500' },
  { key: 'offer', label: 'Offer', icon: Gift, color: 'text-green-500' },
];

export default function CandidateDashboardPage() {
  const { user } = useStore();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    screening: 0,
    interview: 0,
    offers: 0,
    rejected: 0,
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
      setRecentApplications(apps.slice(0, 3));
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

  const profileChecks = [
    { key: 'name', label: 'Full name', value: profile?.name || user?.name },
    { key: 'email', label: 'Email', value: profile?.email || user?.email },
    { key: 'phone', label: 'Phone', value: profile?.phone },
    { key: 'resume', label: 'Resume uploaded', value: profile?.resume_url },
  ];
  const completedChecks = profileChecks.filter((c) => !!c.value?.toString().trim()).length;
  const profilePercent = profileChecks.length ? Math.round((completedChecks / profileChecks.length) * 100) : 0;
  const maxStat = Math.max(stats.total, 1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-candidate-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Subtle background - reduced gradient */}
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.06),transparent)] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Top section: Heading + CTAs ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-8">
            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-candidate-500/10 dark:bg-candidate-500/20 text-candidate-600 dark:text-candidate-400 border border-candidate-500/20 mb-3">
              Analytics & Insights
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Your Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track your job search progress and career insights
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap items-center gap-3 lg:justify-end">
            <Link
              href="/candidate/resume"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500"
            >
              <Upload className="h-4 w-4" />
              Update Resume
            </Link>
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 focus-visible:ring-offset-2"
            >
              Find Jobs
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200/80 dark:bg-gray-700/80 mb-6" aria-hidden />

        {/* ─── Stats row: 6 equal cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {statConfig.map((item, i) => (
            <StatCard
              key={item.key}
              label={item.label}
              value={stats[item.key as keyof DashboardStats]}
              icon={item.icon}
              accentColor={item.accent}
              progressPercent={item.key === 'total' ? 100 : (stats[item.key as keyof DashboardStats] / maxStat) * 100}
              index={i}
            />
          ))}
        </div>

        {/* ─── Main content: 8 + 4 columns ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left column (8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Application Pipeline */}
            <DashboardSection
              title="Application Pipeline"
              icon={BarChart3}
              card
              divider
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {pipelineStages.map((stage) => {
                  const count =
                    stage.key === 'offer'
                      ? stats.offers
                      : stage.key === 'applied'
                        ? stats.pending
                        : stats[stage.key as keyof DashboardStats];
                  return (
                    <div
                      key={stage.key}
                      className={`p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-3`}
                    >
                      <stage.icon className={`h-5 w-5 flex-shrink-0 ${stage.color}`} />
                      <div>
                        <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{count}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stage.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardSection>

            {/* Applications */}
            <DashboardSection
              title="Applications"
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
                  subtitle="Start your journey by browsing jobs"
                  actionLabel="Browse Jobs"
                  actionHref="/candidate/jobs"
                />
              ) : (
                <ul className="space-y-2">
                  {recentApplications.map((app: any) => (
                    <li key={app.id}>
                      <Link
                        href={`/candidate/applications/${app.id}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400">
                            {app.job_title || 'Application'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{app.status}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardSection>

            {/* For You */}
            <DashboardSection
              title="For You"
              icon={Sparkles}
              actionLabel="See All"
              actionHref="/candidate/jobs"
              card
              divider
            >
              {recommendedJobs.length === 0 ? (
                <EmptyState
                  icon={Building}
                  title="No jobs available"
                  subtitle="Check back later for new opportunities"
                  actionLabel="Browse Jobs"
                  actionHref="/candidate/jobs"
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {recommendedJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/candidate/jobs/${job.id}`}
                      className="block p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-800/20 hover:border-candidate-400/40 dark:hover:border-candidate-500/40 hover:bg-candidate-500/5 dark:hover:bg-candidate-500/10 transition-all group"
                    >
                      <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400">
                        {job.title}
                      </p>
                      {job.company && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{job.company}</p>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-candidate-600 dark:text-candidate-400 font-medium mt-2">
                        View job <ChevronRight className="h-3 w-3" />
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
                  <div
                    key={i}
                    className={`p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/30 dark:bg-gray-800/20 flex gap-3`}
                  >
                    <tip.icon className={`h-5 w-5 flex-shrink-0 ${tip.accent}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{tip.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardSection>
          </div>

          {/* Right column (4) - sticky sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Strength - sticky */}
            <div className="lg:sticky lg:top-24">
              <DashboardSection title="Profile Strength" icon={Target} card divider>
                <div className="mb-4">
                  <div className="flex items-end justify-between gap-2 mb-2">
                    <span className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                      {profilePercent}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Complete your profile</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-candidate-500 dark:bg-candidate-400 transition-all duration-500"
                      style={{ width: `${profilePercent}%` }}
                    />
                  </div>
                </div>
                <ul className="space-y-2">
                  {profileChecks.map((check) => (
                    <li key={check.key} className="flex items-center gap-2 text-sm">
                      {check.value ? (
                        <span className="text-green-500" aria-hidden>✓</span>
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                      )}
                      <span className={check.value ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}>
                        {check.key === 'name' ? 'Name added' : check.key === 'email' ? 'Email verified' : check.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/candidate/profile"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-candidate-500 hover:bg-candidate-600 dark:bg-candidate-600 dark:hover:bg-candidate-500 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500"
                >
                  Complete Profile
                </Link>
              </DashboardSection>

              {/* Upcoming Interviews */}
              <div className="mt-6">
                <DashboardSection title="Upcoming Interviews" icon={Calendar} card divider>
                  <EmptyState
                    icon={Calendar}
                    title="No upcoming interviews"
                    subtitle="Interviews will appear here once scheduled"
                    actionLabel="View Applications"
                    actionHref="/candidate/applications"
                  />
                </DashboardSection>
              </div>

              {/* Quick Actions */}
              <div className="mt-6">
                <DashboardSection title="Quick Actions" icon={Zap} card divider>
                  <div className="space-y-1">
                    <QuickActionItem
                      title="Browse Jobs"
                      subtitle="Find your next opportunity"
                      icon={Search}
                      href="/candidate/jobs"
                      iconBgClass="bg-candidate-500/10 dark:bg-candidate-500/20 text-candidate-600 dark:text-candidate-400"
                    />
                    <QuickActionItem
                      title="Upload Resume"
                      subtitle="Keep your resume updated"
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
    </div>
  );
}
