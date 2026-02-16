'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Briefcase,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import * as api from '@/lib/api';

interface AdminStats {
  total_users: number;
  pending_approval: number;
  active_users: number;
  by_role: {
    hr_managers: number;
    candidates: number;
    admins: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsData, pendingData] = await Promise.all([
        api.getAdminStats(),
        api.getPendingUsers()
      ]);
      setStats(statsData);
      setPendingUsers(pendingData.slice(0, 5)); // Show only first 5
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await api.approveUser(userId);
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Failed to approve user:', err);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await api.rejectUser(userId, 'Account rejected by administrator');
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Failed to reject user:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-admin-200 border-t-admin-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Pending Approvals',
      value: stats?.pending_approval || 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      urgent: (stats?.pending_approval || 0) > 0
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: UserCheck,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'HR Managers',
      value: stats?.by_role?.hr_managers || 0,
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Candidates',
      value: stats?.by_role?.candidates || 0,
      icon: TrendingUp,
      color: 'from-cyan-500 to-teal-500',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      textColor: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      title: 'Admins',
      value: stats?.by_role?.admins || 0,
      icon: Users,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      textColor: 'text-pink-600 dark:text-pink-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your platform&apos;s activity and user management
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white dark:bg-gray-900 rounded-2xl border p-6 ${
              stat.urgent 
                ? 'border-amber-300 dark:border-amber-700' 
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
            {stat.urgent && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Requires attention
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pending Approvals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pending Approvals
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              HR accounts waiting for approval
            </p>
          </div>
          {pendingUsers.length > 0 && (
            <Link
              href="/admin/users?filter=pending"
              className="text-sm text-admin-600 dark:text-admin-400 hover:text-admin-700 flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No pending approvals</p>
            <p className="text-sm">All user accounts have been reviewed</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                    {user.role === 'hr_manager' ? 'HR Manager' : user.role}
                  </span>
                  <button
                    onClick={() => handleApprove(user.id)}
                    className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    title="Approve"
                  >
                    <UserCheck className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <UserX className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Link
          href="/admin/users"
          className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-admin-300 dark:hover:border-admin-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-admin-600 dark:group-hover:text-admin-400 transition-colors">
                Manage Users
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View and manage all user accounts
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-admin-600 dark:group-hover:text-admin-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
        <Link
          href="/dashboard"
          className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                HR Dashboard
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Switch to HR recruiter view
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
