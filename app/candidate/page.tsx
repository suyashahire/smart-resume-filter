'use client';

import { useState, useEffect } from 'react';
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
  Zap,
  Award,
  Send,
  TrendingUp,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getCandidateApplications, getOpenJobs } from '@/lib/api';

const TITLE_FILTER = 'Full Stack Developer';

/* ═══════════════════════════════════════════
   Fade-in wrapper for sections
   ═══════════════════════════════════════════ */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Section badge (small pill above headings)
   ═══════════════════════════════════════════ */
function SectionBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-candidate-500/10 dark:bg-candidate-500/15 text-candidate-600 dark:text-candidate-400 border border-candidate-500/15 dark:border-candidate-500/25">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export default function CandidateHomePage() {
  const { user } = useStore();
  const [stats, setStats] = useState({ total: 0, pending: 0, interviews: 0, offers: 0 });
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [appsData, jobsData] = await Promise.all([
          getCandidateApplications(),
          getOpenJobs(),
        ]);
        const apps = appsData.applications || [];
        setStats({
          total: apps.length,
          pending: apps.filter((a: any) => ['applied', 'screening'].includes(a.status)).length,
          interviews: apps.filter((a: any) => a.status === 'interview').length,
          offers: apps.filter((a: any) => a.status === 'offer').length,
        });
        const filtered = (jobsData || []).filter(
          (j: { title?: string }) => j.title?.trim() !== TITLE_FILTER
        );
        setRecommendedJobs(filtered.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const refetch = async () => {
      try {
        const jobsData = await getOpenJobs();
        const filtered = (jobsData || []).filter(
          (j: { title?: string }) => j.title?.trim() !== TITLE_FILTER
        );
        setRecommendedJobs(filtered.slice(0, 4));
      } catch { }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') refetch(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const steps = [
    { icon: Search, title: 'Browse', desc: 'Find roles that match your skills and experience.' },
    { icon: Send, title: 'Apply', desc: 'One-click apply with your saved resume.' },
    { icon: TrendingUp, title: 'Track', desc: 'Follow your application status in real time.' },
    { icon: Award, title: 'Get Hired', desc: 'Land interviews and receive offers.' },
  ];

  const features = [
    { icon: Target, title: 'Smart Matching', description: 'AI-powered role recommendations tailored to your profile.', gradient: 'from-candidate-500 to-cyan-500' },
    { icon: FileText, title: 'Application Tracking', description: 'Track every application and get feedback from recruiters.', gradient: 'from-blue-500 to-cyan-500' },
    { icon: MessageSquare, title: 'Direct Messaging', description: 'Chat with recruiters directly and stay in the loop.', gradient: 'from-purple-500 to-candidate-500' },
    { icon: Zap, title: 'Quick Apply', description: 'Apply in seconds with your uploaded resume.', gradient: 'from-amber-500 to-orange-500' },
    { icon: Shield, title: 'Transparent Status', description: 'Know exactly where you stand in every process.', gradient: 'from-green-500 to-emerald-500' },
    { icon: BarChart3, title: 'Career Dashboard', description: 'One hub for jobs, applications, and analytics.', gradient: 'from-candidate-500 to-teal-500' },
  ];

  const statCards = [
    { value: stats.total, label: 'Applications', color: 'from-candidate-400 to-cyan-500' },
    { value: stats.pending, label: 'In Progress', color: 'from-blue-400 to-cyan-500' },
    { value: stats.interviews, label: 'Interviews', color: 'from-purple-400 to-candidate-500' },
    { value: stats.offers, label: 'Offers', color: 'from-green-400 to-emerald-500' },
  ];

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-candidate-200 dark:border-candidate-800" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-candidate-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* ════════════════════════════════════════════════
          SECTION 1 — HERO
         ════════════════════════════════════════════════ */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(20,184,166,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(20,184,166,0.06),transparent)]" />

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <motion.div
            animate={{ x: [0, 60, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-gradient-to-br from-candidate-400/20 to-cyan-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -60, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-gradient-to-br from-purple-400/15 to-candidate-400/15 rounded-full blur-3xl"
          />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <SectionBadge icon={Sparkles} label="Career Portal" />
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-5">
              {user?.name ? (
                <>
                  <span className="text-gray-900 dark:text-white">Welcome back,</span>
                  <br />
                  <span className="bg-gradient-to-r from-candidate-500 via-cyan-500 to-candidate-500 bg-clip-text text-transparent">
                    {user.name.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-gray-900 dark:text-white">Land Your </span>
                  <span className="bg-gradient-to-r from-candidate-500 via-cyan-500 to-candidate-500 bg-clip-text text-transparent">
                    Dream Job
                  </span>
                </>
              )}
            </h1>

            {/* Sub-heading */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Browse roles, apply in one click, and track your applications — all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
              <Link href="/candidate/jobs">
                <motion.span
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5
                    bg-candidate-500 hover:bg-candidate-600
                    dark:bg-candidate-600 dark:hover:bg-candidate-500
                    text-white rounded-xl font-semibold text-base
                    shadow-lg shadow-candidate-500/20
                    hover:shadow-xl hover:shadow-candidate-500/30
                    transition-all duration-200"
                >
                  Browse Jobs
                  <ArrowRight className="h-4.5 w-4.5" />
                </motion.span>
              </Link>
              <Link href="/candidate/applications">
                <motion.span
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5
                    bg-white dark:bg-gray-900
                    text-gray-900 dark:text-white rounded-xl font-semibold text-base
                    border border-gray-200/80 dark:border-gray-700/80
                    hover:border-candidate-300 dark:hover:border-candidate-600
                    shadow-sm hover:shadow-md
                    transition-all duration-200"
                >
                  <FileText className="h-4.5 w-4.5 text-candidate-500" />
                  My Applications
                </motion.span>
              </Link>
            </div>

            {/* Inline stat chips */}
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { value: stats.total, label: 'Applications', icon: Briefcase },
                { value: stats.pending, label: 'In Progress', icon: TrendingUp },
                { value: stats.interviews, label: 'Interviews', icon: MessageSquare },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.08 }}
                  whileHover={{ y: -3 }}
                  className="flex items-center gap-3 px-5 py-3
                    rounded-2xl border border-gray-200/50 dark:border-gray-700/50
                    bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg
                    shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-candidate-500/10 dark:bg-candidate-500/20">
                    <stat.icon className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
                  </span>
                  <div className="text-left">
                    <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">{stat.value}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-5 h-9 rounded-full border-2 border-gray-300 dark:border-gray-700 flex items-start justify-center p-1.5"
          >
            <motion.div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-candidate-500/20 to-transparent" aria-hidden />

      {/* ════════════════════════════════════════════════
          SECTION 2 — HOW IT WORKS
         ════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-28 bg-white dark:bg-gray-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(20,184,166,0.04),transparent)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-16">
            <SectionBadge icon={Zap} label="How It Works" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4 mb-3">
              Four Steps to Your Next Role
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              From browse to offer, we've got you covered.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
            {steps.map((step, index) => (
              <Reveal key={index} delay={index * 0.08}>
                <div className="relative group h-full">
                  <div className="h-full p-7 rounded-2xl
                    border border-gray-200/50 dark:border-gray-700/50
                    bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg
                    hover:border-candidate-300/60 dark:hover:border-candidate-600/40
                    hover:shadow-lg hover:shadow-candidate-500/5
                    transition-all duration-200"
                  >
                    {/* Step number */}
                    <div className="absolute -top-3 -left-1 w-7 h-7 rounded-full
                      bg-candidate-500 text-white text-xs font-bold
                      flex items-center justify-center shadow-sm shadow-candidate-500/30"
                    >
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl
                      bg-gradient-to-br from-candidate-500/10 to-cyan-500/10
                      dark:from-candidate-500/20 dark:to-cyan-500/20
                      border border-candidate-200/30 dark:border-candidate-700/30
                      flex items-center justify-center mb-5
                      group-hover:scale-105 transition-transform duration-200"
                    >
                      <step.icon className="h-6 w-6 text-candidate-600 dark:text-candidate-400" />
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">{step.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>

                  {/* Connector arrow (desktop) */}
                  {index < 3 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 text-gray-200 dark:text-gray-700">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SECTION 3 — FEATURES GRID
         ════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-28 bg-gray-50 dark:bg-gray-900/50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(20,184,166,0.03),transparent)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-16">
            <SectionBadge icon={Shield} label="Platform" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-4 mb-3">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Tools to search, apply, and get hired — faster.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <Reveal key={index} delay={index * 0.05}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="group relative h-full p-7 rounded-2xl overflow-hidden
                    border border-gray-200/50 dark:border-gray-700/50
                    bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg
                    hover:shadow-lg hover:shadow-candidate-500/5
                    transition-all duration-200"
                >
                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />

                  {/* Icon */}
                  <div className={`relative inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-5 shadow-sm`}>
                    <feature.icon className="h-5 w-5" />
                  </div>

                  <h3 className="relative text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="relative text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SECTION 4 — RECOMMENDED JOBS (if any)
         ════════════════════════════════════════════════ */}
      {recommendedJobs.length > 0 && (
        <section className="py-24 sm:py-28 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-12">
              <div>
                <SectionBadge icon={Sparkles} label="For You" />
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-4 mb-1">
                  Recommended Jobs
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Roles that match your profile and experience.
                </p>
              </div>
              <Link
                href="/candidate/jobs"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-candidate-600 dark:text-candidate-400 hover:text-candidate-700 dark:hover:text-candidate-300 transition-colors"
              >
                Browse all jobs
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recommendedJobs.map((job: any, i: number) => (
                <Reveal key={job.id} delay={i * 0.06}>
                  <Link href={`/candidate/jobs/${job.id}`} className="block group h-full">
                    <div className="h-full p-5 rounded-2xl
                      border border-gray-200/50 dark:border-gray-700/50
                      bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg
                      hover:border-candidate-300/60 dark:hover:border-candidate-600/40
                      hover:shadow-lg hover:shadow-candidate-500/5
                      transition-all duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl
                          bg-gradient-to-br from-candidate-500/10 to-purple-500/10
                          dark:from-candidate-500/20 dark:to-purple-500/20
                          border border-candidate-200/30 dark:border-candidate-700/30
                          flex items-center justify-center flex-shrink-0"
                        >
                          <Building className="h-5 w-5 text-candidate-600 dark:text-candidate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">
                            {job.title}
                          </h3>
                          {job.location && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {job.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">{job.description}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-candidate-600 dark:text-candidate-400 group-hover:gap-1.5 transition-all">
                        View role
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          SECTION 5 — STATS STRIP
         ════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 bg-gray-900 dark:bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(20,184,166,0.06),transparent)]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Your Progress at a Glance
            </h2>
            <p className="text-sm text-gray-400">Applications and opportunities in one place.</p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {statCards.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 0.08}>
                <div className="text-center p-6 rounded-2xl
                  border border-white/[0.06]
                  bg-white/[0.03] backdrop-blur-sm"
                >
                  <div className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SECTION 6 — FINAL CTA
         ════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-28 overflow-hidden">
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-candidate-500 via-cyan-600 to-candidate-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.12),transparent)]" />

        {/* Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 relative z-10">
          <Reveal>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5 tracking-tight">
              Ready to Find
              <br />
              Your Next Role?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
              Browse open positions and apply with one click — your next opportunity is a few taps away.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/candidate/jobs">
                <motion.span
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2.5 px-8 py-4
                    bg-white text-candidate-600 rounded-xl
                    font-bold text-base
                    shadow-xl shadow-black/10
                    hover:shadow-2xl
                    transition-all duration-200"
                >
                  Browse Jobs
                  <ArrowRight className="h-5 w-5" />
                </motion.span>
              </Link>
              <Link href="/candidate/dashboard">
                <motion.span
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2.5 px-8 py-4
                    bg-white/10 hover:bg-white/20
                    text-white rounded-xl
                    font-semibold text-base
                    border border-white/20
                    backdrop-blur-sm
                    transition-all duration-200"
                >
                  <BarChart3 className="h-5 w-5" />
                  Dashboard
                </motion.span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
