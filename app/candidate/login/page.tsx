'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Briefcase,
  FileText,
  MessageSquare,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { login, register } from '@/lib/api';

export default function CandidateLoginPage() {
  const router = useRouter();
  const { setUser, setAuthToken, setIsAuthenticated } = useStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await login(formData.email, formData.password);
        
        // Verify user is a candidate
        if (response.user.role !== 'candidate') {
          setError('This portal is for candidates only. Please use the HR portal.');
          setIsLoading(false);
          return;
        }
        
        setAuthToken(response.access_token);
        setUser(response.user);
        setIsAuthenticated(true);
        router.push('/candidate');
      } else {
        // Register as candidate
        const response = await register(
          formData.name,
          formData.email,
          formData.password,
          'candidate'
        );
        
        setAuthToken(response.access_token);
        setUser(response.user);
        setIsAuthenticated(true);
        router.push('/candidate');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Briefcase, title: 'Browse Jobs', description: 'Find your perfect opportunity' },
    { icon: FileText, title: 'Track Applications', description: 'Monitor your progress in real-time' },
    { icon: TrendingUp, title: 'View Match Scores', description: 'See how you match with jobs' },
    { icon: MessageSquare, title: 'Chat with Recruiters', description: 'Direct communication with HR' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-candidate-600 to-cyan-600 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">HireQ</span>
              <span className="text-sm text-white/70 block">Career Portal</span>
            </div>
          </Link>
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Track Your Career Journey
            </h1>
            <p className="text-xl text-white/80">
              Apply to jobs, track your applications, and connect with recruiters all in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <feature.icon className="h-8 w-8 text-white mb-2" />
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-white/60 text-sm">
          &copy; {new Date().getFullYear()} HireQ. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-12 h-12 bg-candidate-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">H</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">HireQ</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 block">Career Portal</span>
              </div>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isLogin
                ? 'Sign in to track your applications'
                : 'Join HireQ to start your job search'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-candidate-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-candidate-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-candidate-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-candidate-600 to-cyan-600 text-white rounded-xl font-medium hover:from-candidate-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-candidate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-candidate-600 dark:text-candidate-400 hover:text-candidate-700 dark:hover:text-candidate-300 font-medium"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you a recruiter?{' '}
              <Link
                href="/login"
                className="text-candidate-600 dark:text-candidate-400 hover:text-candidate-700 dark:hover:text-candidate-300 font-medium"
              >
                HR Portal &rarr;
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
