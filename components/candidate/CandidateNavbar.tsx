'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Briefcase,
  FileText,
  MessageSquare,
  User,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Calendar,
  FileBadge,
  Brain,
  Target,
  Wifi,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/contexts/ThemeContext';
import CalendarModal from '@/components/Calendar/CalendarModal';
import { useRealtimeUpdates, useRealtimeNotifications, RealtimeEvent, RealtimeEventType } from '@/hooks/useRealtimeUpdates';
import * as api from '@/lib/api';

// Event icons and colors for candidate notifications
const eventIcons: Record<string, React.ReactNode> = {
  new_application: <FileText className="h-3.5 w-3.5" />,
  pipeline_status_changed: <Target className="h-3.5 w-3.5" />,
  new_message: <MessageSquare className="h-3.5 w-3.5" />,
  job_created: <Briefcase className="h-3.5 w-3.5" />,
  candidate_scored: <Target className="h-3.5 w-3.5" />,
  resume_uploaded: <FileText className="h-3.5 w-3.5" />,
  resume_parsed: <FileText className="h-3.5 w-3.5" />,
  interview_analyzed: <MessageSquare className="h-3.5 w-3.5" />,
  report_generated: <FileText className="h-3.5 w-3.5" />,
  job_deleted: <Trash2 className="h-3.5 w-3.5" />,
  connection_established: <Wifi className="h-3.5 w-3.5" />,
};

const eventColors: Record<string, string> = {
  new_application: 'bg-emerald-500',
  pipeline_status_changed: 'bg-purple-500',
  new_message: 'bg-candidate-500',
  job_created: 'bg-teal-500',
  candidate_scored: 'bg-emerald-500',
  resume_uploaded: 'bg-blue-500',
  resume_parsed: 'bg-blue-500',
  interview_analyzed: 'bg-amber-500',
  report_generated: 'bg-indigo-500',
  job_deleted: 'bg-red-500',
  connection_established: 'bg-gray-500',
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleTimeString();
}

const navItems = [
  { href: '/candidate', label: 'Home', icon: Home },
  { href: '/candidate/jobs', label: 'Browse Jobs', icon: Briefcase },
  { href: '/candidate/applications', label: 'Applications', icon: FileText },
  { href: '/candidate/resume', label: 'Resume', icon: FileBadge },
  { href: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function CandidateNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Realtime notifications
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { notifications, addNotification, dismissNotification, clearNotifications, setNotifications } = useRealtimeNotifications();
  const [dbNotificationsLoaded, setDbNotificationsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      setAuthToken(token || undefined);
    }
  }, []);

  // Load persisted notifications from database on mount
  useEffect(() => {
    if (!user || dbNotificationsLoaded) return;
    const loadDbNotifications = async () => {
      try {
        const response = await api.getNotifications();
        if (response.notifications && response.notifications.length > 0) {
          const mapped = response.notifications
            .filter((n: api.NotificationItem) => !n.is_read)
            .map((n: api.NotificationItem) => ({
              id: n.id,
              type: n.type as RealtimeEventType,
              message: n.message,
              timestamp: new Date(n.created_at),
              data: {
                notification_db_id: n.id,
                application_id: n.application_id,
                candidate_name: n.candidate_name,
                job_title: n.job_title,
                job_id: n.job_id,
              },
            }));
          if (mapped.length > 0) {
            setNotifications(mapped);
          }
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
      setDbNotificationsLoaded(true);
    };
    loadDbNotifications();
  }, [user, dbNotificationsLoaded, setNotifications]);

  // Notification preference filtering
  const eventCategoryMap: Record<string, string> = {
    new_application: 'new_applications',
    pipeline_status_changed: 'new_applications',
    new_message: 'messages',
    job_created: 'job_updates',
    job_deleted: 'job_updates',
  };

  const handleEvent = useCallback((event: RealtimeEvent) => {
    if (event.type !== 'connection_established') {
      const category = eventCategoryMap[event.type];
      const prefs = user?.notification_preferences;
      const isMuted = category && prefs && prefs[category] === false;

      if (!isMuted) {
        addNotification(event);
      }
    }
  }, [addNotification, user?.notification_preferences]);

  const { isConnected } = useRealtimeUpdates({
    onEvent: handleEvent,
    token: authToken,
    enabled: !!user
  });

  // Handle scroll effect
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/candidate/login');
  };

  const isActive = (href: string) => {
    if (href === '/candidate') {
      return pathname === '/candidate';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between px-4 lg:px-6 py-3 rounded-2xl transition-all duration-300 ${scrolled
              ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-candidate-200/20 dark:shadow-black/20 border border-candidate-200/50 dark:border-gray-700/50'
              : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-candidate-200/30 dark:border-gray-700/30'
            }`}>
            {/* Logo */}
            <Link href="/candidate" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-candidate-500 to-cyan-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-candidate-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  HireQ
                </span>
                <div className="flex items-center gap-1 -mt-1">
                  <Sparkles className="h-3 w-3 text-candidate-500" />
                  <span className="text-xs text-candidate-600 dark:text-candidate-400">Career Portal</span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 rounded-full p-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${active
                          ? 'text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="candidate-navbar-active"
                          className="absolute inset-0 bg-gradient-to-r from-candidate-500 to-cyan-500 rounded-full shadow-lg"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Messages */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/candidate/messages')}
                className={`relative p-2 rounded-lg transition-colors ${
                  pathname === '/candidate/messages'
                    ? 'bg-candidate-500/10 dark:bg-candidate-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <MessageSquare className={`h-5 w-5 ${
                  pathname === '/candidate/messages'
                    ? 'text-candidate-500'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </motion.button>

              {/* Calendar */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCalendar(true)}
                className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </motion.button>

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                  className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  {notifications.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-candidate-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                    >
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </motion.span>
                  )}
                  <span className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                </motion.button>

                {/* Notification Dropdown Panel */}
                <AnimatePresence>
                  {showNotificationPanel && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-80 max-h-[400px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                    >
                      {/* Header */}
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-candidate-50 to-cyan-50 dark:from-candidate-900/20 dark:to-cyan-900/20">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
                          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          {notifications.length > 0 && (
                            <button
                              onClick={async () => {
                                try { await api.deleteAllNotifications(); } catch (e) { console.error('Failed to delete all notifications:', e); }
                                clearNotifications();
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotificationPanel(false)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-[320px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No notifications</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {isConnected ? 'Live updates enabled' : 'Connecting...'}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {notifications.map((notification) => (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-1.5 rounded-lg ${eventColors[notification.type] || 'bg-gray-500'} text-white`}>
                                    {eventIcons[notification.type] || <Bell className="h-3.5 w-3.5" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {formatTimestamp(notification.timestamp)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      const dbId = (notification.data?.notification_db_id as string) || notification.id;
                                      try { await api.deleteNotification(dbId); } catch (e) { console.error('Failed to delete notification:', e); }
                                      dismissNotification(notification.id);
                                    }}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                  >
                                    <X className="h-3 w-3 text-gray-400" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </motion.button>

              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-candidate-500/30 hover:bg-white/[0.08] transition-all duration-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-candidate-400 to-cyan-500 flex items-center justify-center ring-2 ring-candidate-500/20 shadow-sm">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-300 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500 group-hover:rotate-180 transition-transform duration-300" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-3 w-[320px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                  {/* Outer glow */}
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-candidate-500/20 via-transparent to-cyan-500/10 pointer-events-none" />
                  <div className="relative bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden">
                    {/* Profile Header */}
                    <div className="relative p-5 pb-4">
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-candidate-500/[0.06] via-transparent to-cyan-500/[0.04]" />
                      <div className="relative flex items-center gap-4">
                        {/* Avatar with gradient ring */}
                        <div className="relative">
                          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-candidate-400 to-cyan-500 opacity-60 blur-sm" />
                          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-candidate-400 to-cyan-500 flex items-center justify-center ring-2 ring-white/10">
                            <span className="text-2xl font-bold text-white">
                              {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{user?.name || 'User'}</p>
                          <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-candidate-500/10 border border-candidate-500/20 text-candidate-400 text-xs font-medium">
                            <Sparkles className="h-3 w-3" />
                            Job Seeker
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                    {/* Menu Items */}
                    <div className="p-2 space-y-0.5">
                      <Link
                        href="/candidate/profile"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/[0.06] transition-all duration-150 group/item"
                      >
                        <div className="w-9 h-9 rounded-lg bg-candidate-500/10 border border-candidate-500/20 flex items-center justify-center group-hover/item:bg-candidate-500/20 group-hover/item:shadow-sm group-hover/item:shadow-candidate-500/20 transition-all">
                          <User className="h-4 w-4 text-candidate-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-200 group-hover/item:text-white transition-colors">My Profile</p>
                          <p className="text-xs text-gray-500">View and edit your profile</p>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-600 -rotate-90 group-hover/item:text-gray-400 group-hover/item:translate-x-0.5 transition-all" />
                      </Link>
                      <Link
                        href="/candidate/resume"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/[0.06] transition-all duration-150 group/item"
                      >
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover/item:bg-cyan-500/20 group-hover/item:shadow-sm group-hover/item:shadow-cyan-500/20 transition-all">
                          <FileText className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-200 group-hover/item:text-white transition-colors">My Resume</p>
                          <p className="text-xs text-gray-500">Manage your resume</p>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-600 -rotate-90 group-hover/item:text-gray-400 group-hover/item:translate-x-0.5 transition-all" />
                      </Link>
                      <Link
                        href="/candidate/applications"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/[0.06] transition-all duration-150 group/item"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover/item:bg-emerald-500/20 group-hover/item:shadow-sm group-hover/item:shadow-emerald-500/20 transition-all">
                          <Briefcase className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-200 group-hover/item:text-white transition-colors">Applications</p>
                          <p className="text-xs text-gray-500">Track your job applications</p>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-600 -rotate-90 group-hover/item:text-gray-400 group-hover/item:translate-x-0.5 transition-all" />
                      </Link>
                    </div>

                    {/* Separator */}
                    <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                    {/* Logout */}
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/[0.08] transition-all duration-150 group/item"
                      >
                        <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover/item:bg-red-500/20 transition-all">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium group-hover/item:text-red-300 transition-colors">Sign Out</p>
                          <p className="text-xs text-red-500/60">End your session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-4 right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 lg:hidden overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${active
                            ? 'bg-gradient-to-r from-candidate-500 to-cyan-500 text-white shadow-lg'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href="/candidate/messages"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-1 ${
                    pathname === '/candidate/messages'
                      ? 'bg-candidate-500/10 text-candidate-600 dark:text-candidate-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Messages</span>
                </Link>
                <Link
                  href="/candidate/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-candidate-400 to-cyan-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">View Profile</p>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-20" />

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        variant="candidate"
      />
    </>
  );
}
