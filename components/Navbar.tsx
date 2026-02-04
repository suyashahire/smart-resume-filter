'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Brain, LogOut, User, Cloud, HardDrive } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, useRealApi } = useStore();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Upload Resume', path: '/upload-resume' },
    { name: 'Job Description', path: '/job-description' },
    { name: 'Results', path: '/results' },
    { name: 'Interview Analyzer', path: '/interview-analyzer' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  const handleLogout = async () => {
    // Call API logout if connected to backend
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
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Smart HR Assistant</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.path
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* User Section */}
            {isAuthenticated && user && (
              <div className="flex items-center ml-4 space-x-2">
                {/* API Mode Indicator */}
                <div className={`flex items-center px-2 py-1 rounded-full text-xs ${
                  useRealApi
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>
                  {useRealApi ? (
                    <Cloud className="h-3 w-3" />
                  ) : (
                    <HardDrive className="h-3 w-3" />
                  )}
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-md">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
            
            {!isAuthenticated && pathname !== '/login' && (
              <Link
                href="/login"
                className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Login
              </Link>
            )}
            
            <div className="ml-4">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile menu button and theme toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.path
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile User Section */}
            {isAuthenticated && user && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
            {!isAuthenticated && pathname !== '/login' && (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 mt-2 bg-primary-600 text-white text-center rounded-md text-base font-medium hover:bg-primary-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

