'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Brain, LogOut, User, Settings, Mail, Shield, ChevronDown, Sparkles, Bell, FileText, Target, Briefcase, MessageSquare, Trash2, Wifi, Calendar, UserPlus } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import CalendarModal from '@/components/Calendar/CalendarModal';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
import { useRealtimeUpdates, useRealtimeNotifications, RealtimeEvent, RealtimeEventType } from '@/hooks/useRealtimeUpdates';

// Event icons and colors for notifications
const eventIcons: Record<RealtimeEventType, React.ReactNode> = {
  resume_uploaded: <FileText className="h-3.5 w-3.5" />,
  resume_parsed: <FileText className="h-3.5 w-3.5" />,
  candidate_scored: <Target className="h-3.5 w-3.5" />,
  pipeline_status_changed: <Target className="h-3.5 w-3.5" />,
  interview_analyzed: <MessageSquare className="h-3.5 w-3.5" />,
  report_generated: <FileText className="h-3.5 w-3.5" />,
  job_created: <Briefcase className="h-3.5 w-3.5" />,
  job_deleted: <Trash2 className="h-3.5 w-3.5" />,
  new_application: <UserPlus className="h-3.5 w-3.5" />,
  connection_established: <Wifi className="h-3.5 w-3.5" />,
};

const eventColors: Record<RealtimeEventType, string> = {
  resume_uploaded: 'bg-blue-500',
  resume_parsed: 'bg-blue-500',
  candidate_scored: 'bg-emerald-500',
  pipeline_status_changed: 'bg-purple-500',
  interview_analyzed: 'bg-amber-500',
  report_generated: 'bg-indigo-500',
  job_created: 'bg-teal-500',
  job_deleted: 'bg-red-500',
  new_application: 'bg-emerald-500',
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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { user, isAuthenticated, logout, useRealApi } = useStore();

  // Realtime notifications
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const { notifications, addNotification, dismissNotification, clearNotifications } = useRealtimeNotifications();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      setAuthToken(token || undefined);
    }
  }, []);

  const handleEvent = useCallback((event: RealtimeEvent) => {
    if (event.type !== 'connection_established') {
      addNotification(event);
    }
  }, [addNotification]);

  const { isConnected } = useRealtimeUpdates({
    onEvent: handleEvent,
    token: authToken,
    enabled: isAuthenticated
  });

  // Handle scroll effect with throttling
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

  // Base nav items for all users
  const baseNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Upload', path: '/upload-resume' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Results', path: '/results' },
    { name: 'Interviews', path: '/interview-analyzer' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  // Add role-specific items
  const getNavItems = () => {
    let items = [...baseNavItems];

    // Add Messages for HR users
    if (user?.role === 'hr_manager' || user?.role === 'admin') {
      items.push({ name: 'Messages', path: '/messages' });
    }

    // Add Admin for admin users
    if (user?.role === 'admin') {
      items.push({ name: 'Admin', path: '/admin' });
    }

    return items;
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    if (useRealApi) {
      try {
        await api.logout();
      } catch (error) {
        console.error('API logout error:', error);
      }
    }
    logout();
    router.push('/login');
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'py-2'
          : 'py-4'
        }`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${scrolled ? '' : ''
          }`}>
          <div className={`flex items-center justify-between px-4 lg:px-6 py-3 rounded-2xl transition-all duration-300 ${scrolled
              ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-gray-200/20 dark:shadow-black/20 border border-gray-200/50 dark:border-gray-700/50'
              : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/30 dark:border-gray-700/30'
            }`}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  HireQ
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 rounded-full p-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${pathname === item.path
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    {pathname === item.path && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full shadow-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Calendar - only show when authenticated */}
              {isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCalendar(true)}
                  className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              )}

              {/* Notification Bell - only show when authenticated */}
              {isAuthenticated && (
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
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                      >
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </motion.span>
                    )}
                    {/* Connection status dot */}
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
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          </div>
                          <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                              <button
                                onClick={clearNotifications}
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
                                    <div className={`p-1.5 rounded-lg ${eventColors[notification.type]} text-white`}>
                                      {eventIcons[notification.type]}
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
                                      onClick={() => dismissNotification(notification.id)}
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
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Section */}
              {isAuthenticated && user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center shadow-inner">
                      <span className="text-sm font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400 group-hover:rotate-180 transition-transform duration-300" />
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Profile Header */}
                      <div className="p-4 bg-gradient-to-br from-primary-500/10 to-purple-500/10 dark:from-primary-500/5 dark:to-purple-500/5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium">
                              <Sparkles className="h-3 w-3" />
                              {user.role || 'Recruiter'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group/item"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover/item:bg-primary-100 dark:group-hover/item:bg-primary-900/30 transition-colors">
                            <User className="h-5 w-5 text-gray-500 group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">My Profile</p>
                            <p className="text-xs text-gray-400">View and edit your profile</p>
                          </div>
                        </Link>
                        <Link
                          href="/profile?tab=security"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group/item"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover/item:bg-green-100 dark:group-hover/item:bg-green-900/30 transition-colors">
                            <Shield className="h-5 w-5 text-gray-500 group-hover/item:text-green-600 dark:group-hover/item:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Security</p>
                            <p className="text-xs text-gray-400">Password & authentication</p>
                          </div>
                        </Link>
                        <Link
                          href="/profile?tab=preferences"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group/item"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover/item:bg-purple-100 dark:group-hover/item:bg-purple-900/30 transition-colors">
                            <Settings className="h-5 w-5 text-gray-500 group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Preferences</p>
                            <p className="text-xs text-gray-400">Customize your experience</p>
                          </div>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <LogOut className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">Sign Out</p>
                            <p className="text-xs text-red-400">End your session</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                pathname !== '/login' && (
                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full text-sm font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                    >
                      Get Started
                    </motion.button>
                  </Link>
                )
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
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
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${pathname === item.path
                          ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {isAuthenticated && user && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">View Profile</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}

              {!isAuthenticated && pathname !== '/login' && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full py-3 text-center bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-medium shadow-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
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
        variant="hr"
      />
    </>
  );
}
