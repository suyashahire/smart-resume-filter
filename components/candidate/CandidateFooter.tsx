'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase,
  FileText,
  MessageSquare,
  Shield,
  Brain,
  Sparkles,
  LayoutDashboard,
  FileBadge,
  HelpCircle,
  Mail,
  Linkedin,
  Twitter,
  ArrowUpRight,
  Star,
  TrendingUp,
  Target,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function CandidateFooter() {
  const quickLinks = [
    { name: 'Browse Jobs', href: '/candidate/jobs', icon: Briefcase },
    { name: 'My Applications', href: '/candidate/applications', icon: FileText },
    { name: 'My Resume', href: '/candidate/resume', icon: FileBadge },
    { name: 'Messages', href: '/candidate/messages', icon: MessageSquare },
    { name: 'Dashboard', href: '/candidate/dashboard', icon: LayoutDashboard },
  ];

  const resources = [
    { name: 'Resume Tips', description: 'Stand out to recruiters' },
    { name: 'Interview Prep', description: 'Ace your interviews' },
    { name: 'Career Advice', description: 'Grow your career' },
    { name: 'Salary Guide', description: 'Know your worth' },
  ];

  const features = [
    { icon: Target, text: 'AI Job Matching' },
    { icon: TrendingUp, text: 'ATS Score Analysis' },
    { icon: Star, text: 'Resume Rankings' },
    { icon: Zap, text: 'Real-time Updates' },
  ];

  const socialLinks = [
    { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:text-blue-400' },
    { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-sky-400' },
    { name: 'Email', icon: Mail, href: 'mailto:careers@hireq.com', color: 'hover:text-candidate-400' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black text-gray-300 mt-auto overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-candidate-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/candidate" className="inline-flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-candidate-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative p-2.5 bg-gradient-to-br from-candidate-500 to-cyan-600 rounded-xl">
                  <Brain className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  HireQ
                </span>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Sparkles className="h-3 w-3 text-candidate-400" />
                  <span>Career Portal</span>
                </div>
              </div>
            </Link>
            
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Your AI-powered career companion. Track applications, optimize your resume, 
              and land your dream job with intelligent matching and insights.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2">
              {features.map((feature) => (
                <div
                  key={feature.text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700/50 text-xs text-gray-400"
                >
                  <feature.icon className="h-3 w-3 text-candidate-400" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2.5 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-gray-400 ${social.color} transition-all duration-200 border border-gray-800 hover:border-gray-700`}
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-candidate-500 to-transparent" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className="group flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-gray-600 group-hover:text-candidate-400 transition-colors" />
                    <span className="text-sm">{item.name}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-cyan-500 to-transparent" />
              Resources
            </h3>
            <ul className="space-y-3">
              {resources.map((resource) => (
                <li key={resource.name} className="group cursor-pointer">
                  <div className="text-sm text-gray-300 group-hover:text-white transition-colors flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-candidate-500/50 group-hover:text-candidate-400 transition-colors" />
                    {resource.name}
                  </div>
                  <div className="text-xs text-gray-600 pl-5.5 ml-1">
                    {resource.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA & Support */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-emerald-500 to-transparent" />
              Get Started
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Ready to find your dream job?
              </p>
              <Link href="/candidate/jobs">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-candidate-600 to-cyan-600 hover:from-candidate-500 hover:to-cyan-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-candidate-500/20"
                >
                  Browse Jobs
                </motion.button>
              </Link>
              <Link href="/candidate/resume">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-all border border-gray-700 hover:border-gray-600 mt-2"
                >
                  Upload Resume
                </motion.button>
              </Link>
            </div>

            {/* Help */}
            <div className="mt-6 pt-6 border-t border-gray-800/50">
              <Link 
                href="#" 
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help Center</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>&copy; {new Date().getFullYear()} HireQ.</span>
              <span className="hidden sm:inline">All rights reserved.</span>
            </div>

            {/* HR Portal Link */}
            <div className="flex items-center">
              <Link 
                href="/login" 
                className="group flex items-center gap-2 text-sm text-gray-500 hover:text-candidate-400 transition-colors"
              >
                <span>Are you a recruiter?</span>
                <span className="font-medium text-gray-400 group-hover:text-candidate-400 transition-colors">
                  HR Portal
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-600">
              <Link href="#" className="hover:text-gray-400 transition-colors flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Privacy
              </Link>
              <Link href="#" className="hover:text-gray-400 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-gray-400 transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
