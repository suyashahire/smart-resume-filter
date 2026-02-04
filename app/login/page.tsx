'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Brain, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setAuthToken, setIsAuthenticated, useRealApi, setUseRealApi } = useStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend status on mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    setBackendStatus('checking');
    try {
      await api.healthCheck();
      setBackendStatus('online');
      setUseRealApi(true);
    } catch {
      setBackendStatus('offline');
      setUseRealApi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (backendStatus === 'online') {
        // Use real API
        if (isRegistering) {
          // Register new user
          const response = await api.register({ name, email, password });
          setAuthToken(response.access_token);
          setUser({
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role
          });
          setIsAuthenticated(true);
          setSuccess('Account created successfully! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          // Login
          const response = await api.login({ email, password });
          setAuthToken(response.access_token);
          setUser({
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role
          });
          setIsAuthenticated(true);
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 1000);
        }
      } else {
        // Backend is offline
        throw new Error('Backend server is offline. Please try again later.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Backend Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-full text-sm ${
            backendStatus === 'online' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : backendStatus === 'offline'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            {backendStatus === 'online' ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Server Connected</span>
              </>
            ) : backendStatus === 'offline' ? (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Server Offline - Please start the backend</span>
              </>
            ) : (
              <>
                <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-4 rounded-full shadow-lg">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isRegistering 
              ? 'Sign up for Smart Resume Filter & AI HR Assistant'
              : 'Sign in to Smart Resume Filter & AI HR Assistant'
            }
          </p>
        </motion.div>

        {/* Login/Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card animate={false}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start"
                >
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start"
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
                </motion.div>
              )}

              {/* Name Field (Registration only) */}
              {isRegistering && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    required={isRegistering}
                  />
                </motion.div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {isRegistering && (
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                )}
              </div>

              {/* Remember Me (Login only) */}
              {!isRegistering && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                {isLoading 
                  ? (isRegistering ? 'Creating Account...' : 'Signing in...') 
                  : (isRegistering ? 'Create Account' : 'Sign In')
                }
              </Button>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {isRegistering ? 'Sign In' : 'Register'}
                </button>
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card animate={false}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Project Information
            </h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <p><strong>Project:</strong> Smart Resume Filter & AI HR Assistant</p>
              <p><strong>Group:</strong> Group 40 – B.E. Computer Engineering (2025–26)</p>
              <p><strong>Institution:</strong> Sinhgad Academy of Engineering, Pune</p>
              <p><strong>Guide:</strong> Prof. Mrs. T. S. Hashmi</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
