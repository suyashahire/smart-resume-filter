'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/contexts/ThemeContext';
import CalendarModal from '@/components/Calendar/CalendarModal';

const navItems = [
  { href: '/candidate', label: 'Home', icon: Home },
  { href: '/candidate/jobs', label: 'Browse Jobs', icon: Briefcase },
  { href: '/candidate/applications', label: 'My Applications', icon: FileText },
  { href: '/candidate/messages', label: 'Messages', icon: MessageSquare },
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
                  <span className="text-xl font-bold text-white">H</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  HireQ
                </span>
                <span className="text-xs text-candidate-600 dark:text-candidate-400 block -mt-1">Career Portal</span>
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-candidate-500 rounded-full"></span>
              </motion.button>

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
