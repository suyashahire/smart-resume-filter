'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase,
  FileText,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  ChevronRight,
  Search,
  Sparkles,
  ArrowRight,
  Upload,
  Target,
  Award,
  Building,
  MapPin,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getCandidateApplications, getOpenJobs } from '@/lib/api';

interface DashboardStats {
  totalApplications: number;
  pending: number;
  interviews: number;
  offers: number;
}

export default function CandidateHomePage() {
  const { user } = useStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pending: 0,
    interviews: 0,
    offers: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const appsData = await getCandidateApplications();
        const apps = appsData.applications || [];
        setStats({
          totalApplications: apps.length,
          pending: apps.filter((a: any) => ['applied', 'screening'].includes(a.status)).length,
          interviews: apps.filter((a: any) => a.status === 'interview').length,
          offers: apps.filter((a: any) => a.status === 'offer').length,
        });
        setRecentApplications(apps.slice(0, 3));
        const jobsData = await getOpenJobs();
        const filtered = (jobsData || []).filter(
          (j: { title?: string }) => j.title?.trim() !== 'Full Stack Developer'
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
    const refetchJobs = async () => {
      try {
        const jobsData = await getOpenJobs();
        const filtered = (jobsData || []).filter(
          (j: { title?: string }) => j.title?.trim() !== 'Full Stack Developer'
        );
        setRecommendedJobs(filtered.slice(0, 4));
      } catch {
        // ignore
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refetchJobs();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-candidate-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-candidate-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-candidate-950 -z-10" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your career dashboard — find jobs and track applications
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Applications', value: stats.totalApplications, icon: FileText, color: 'from-blue-500 to-cyan-500' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-500' },
            { label: 'Interviews', value: stats.interviews, icon: MessageSquare, color: 'from-purple-500 to-pink-500' },
            { label: 'Offers', value: stats.offers, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-candidate-500" />
              Recommended for you
            </h2>
            <Link
              href="/candidate/jobs"
              className="text-sm font-medium text-candidate-600 dark:text-candidate-400 hover:underline flex items-center gap-1"
            >
              Browse all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {recommendedJobs.length === 0 ? (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No open positions right now.</p>
              <Link
                href="/candidate/jobs"
                className="inline-flex items-center gap-2 px-4 py-2 bg-candidate-600 text-white rounded-xl font-medium hover:bg-candidate-700"
              >
                <Search className="h-4 w-4" /> Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedJobs.map((job: any, i: number) => (
                <Link key={job.id} href={`/candidate/jobs/${job.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 hover:border-candidate-300 dark:hover:border-candidate-600 transition-colors h-full"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-candidate-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Building className="h-5 w-5 text-candidate-600 dark:text-candidate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{job.title}</h3>
                        {job.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {job.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{job.description}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-candidate-600 dark:text-candidate-400 text-sm font-medium">
                      View <ArrowRight className="h-3 w-3" />
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid sm:grid-cols-2 gap-4"
        >
          <Link
            href="/candidate/applications"
            className="flex items-center gap-4 p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-candidate-300 dark:hover:border-candidate-600 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-candidate-500 to-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">My Applications</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track status and feedback</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-candidate-500" />
          </Link>
          <Link
            href="/candidate/jobs"
            className="flex items-center gap-4 p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-candidate-300 dark:hover:border-candidate-600 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-candidate-500 to-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Browse Jobs</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Find your next opportunity</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-candidate-500" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
