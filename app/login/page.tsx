'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Mail, Lock, Eye, EyeOff, AlertCircle, Wifi, WifiOff, User, ArrowRight, Shield, Zap, BarChart3, Clock, Building } from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setAuthToken, setIsAuthenticated, setUseRealApi } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

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
    setIsPendingApproval(false);
    setIsLoading(true);

    try {
      if (backendStatus === 'online') {
        if (isRegistering) {
          const response = await api.register(name, email, password, 'hr_manager', company || undefined);

          // Check if account is pending approval
          if (!response.access_token || response.user.account_status === 'pending') {
            setIsPendingApproval(true);
            setIsLoading(false);
            return;
          }

          setAuthToken(response.access_token);
          setUser({
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role,
            account_status: response.user.account_status,
            company: response.user.company
          });
          setIsAuthenticated(true);
          router.push('/dashboard');
        } else {
          const response = await api.login(email, password);

          // Check if user is a candidate (should use candidate portal)
          if (response.user.role === 'candidate') {
            setError('This portal is for recruiters only. Please use the Candidate Portal.');
            setIsLoading(false);
            return;
          }

          setAuthToken(response.access_token);
          setUser({
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role,
            account_status: response.user.account_status,
            company: response.user.company
          });
          setIsAuthenticated(true);
          router.push('/dashboard');
        }
      } else {
        throw new Error('Backend server is offline. Please try again later.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      // Check if it's a pending approval error
      if (errorMessage.toLowerCase().includes('pending')) {
        setIsPendingApproval(true);
      } else {
        setError(errorMessage);
      }
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
  };

  const features = [
    { icon: <Zap className="h-5 w-5" />, text: 'AI-Powered Resume Screening' },
    { icon: <BarChart3 className="h-5 w-5" />, text: 'Smart Candidate Ranking' },
    { icon: <Shield className="h-5 w-5" />, text: 'Interview Analysis' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600"></div>

        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -70, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"
          />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-12">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">HireQ</span>
            </Link>

            {/* Tagline */}
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Hire Smarter,
              <br />
              <span className="text-white/80">Not Harder</span>
            </h1>
            <p className="text-xl text-white/70 mb-10 max-w-md">
              Transform your recruitment with AI-powered candidate screening and intelligent matching.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3 text-white/90"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-500/5 to-primary-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">HireQ</span>
            </Link>
          </div>

          {/* Backend Status */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium ${backendStatus === 'online'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : backendStatus === 'offline'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}>
              {backendStatus === 'online' ? (
                <>
                  <Wifi className="h-4 w-4" />
                  <span>Server Connected</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </>
              ) : backendStatus === 'offline' ? (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span>Server Offline</span>
                </>
              ) : (
                <>
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              )}
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isRegistering
                ? 'Start your journey with HireQ'
                : 'Sign in to continue to HireQ'
              }
            </p>
          </motion.div>

          {/* Pending Approval Message */}
          {isPendingApproval && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center"
            >
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Account Pending Approval
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your recruiter account is being reviewed by an administrator.
                You&apos;ll receive an email once your account is approved.
              </p>
              <button
                onClick={() => {
                  setIsPendingApproval(false);
                  setIsRegistering(false);
                }}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                Back to Sign In
              </button>
            </motion.div>
          )}

          {/* Form Card */}
          {!isPendingApproval && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </motion.div>
                )}


                {/* Name Field (Registration only) */}
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                        required={isRegistering}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Company Name Field (Registration only) */}
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label htmlFor="company" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Company Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                        required={isRegistering}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full pl-12 pr-12 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {isRegistering && (
                    <p className="text-xs text-gray-500 mt-2">Minimum 6 characters</p>
                  )}
                </div>

                {/* Remember Me / Forgot Password */}
                {!isRegistering && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || backendStatus !== 'online'}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full group py-4 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isRegistering ? 'Creating Account...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">or</span>
                </div>
              </div>

              {/* Toggle Login/Register */}
              <p className="text-center text-gray-600 dark:text-gray-400">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  {isRegistering ? 'Sign In' : 'Create one'}
                </button>
              </p>
            </motion.div>
          )}

          {/* Candidate Portal Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 bg-gradient-to-r from-candidate-50 to-cyan-50 dark:from-candidate-900/20 dark:to-cyan-900/20 border border-candidate-200 dark:border-candidate-800 rounded-2xl"
          >
            <p className="text-center text-gray-700 dark:text-gray-300 text-sm">
              Looking for a job?{' '}
              <Link
                href="/candidate/login"
                className="font-semibold text-candidate-600 hover:text-candidate-700 dark:text-candidate-400 dark:hover:text-candidate-300 transition-colors inline-flex items-center gap-1"
              >
                Go to Candidate Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </motion.div>

          {/* Terms */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
