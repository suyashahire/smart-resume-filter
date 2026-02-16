'use client';

import { Github, Linkedin, Mail, Brain, Sparkles, FileText, Users, BarChart3, Mic, Briefcase, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
  const productLinks = [
    { name: 'Upload Resume', path: '/upload-resume', icon: FileText },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Candidates', path: '/results', icon: Users },
    { name: 'Interview Analyzer', path: '/interview-analyzer', icon: Mic },
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  ];

  const features = [
    { name: 'AI Resume Parsing', description: 'NLP-powered extraction' },
    { name: 'Smart Job Matching', description: 'Semantic similarity' },
    { name: 'Interview Analysis', description: 'Sentiment & confidence' },
    { name: 'AI Chat Assistant', description: 'RAG-powered insights' },
    { name: 'Real-time Updates', description: 'Live notifications' },
  ];

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: '#', color: 'hover:text-white' },
    { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:text-blue-400' },
    { name: 'Email', icon: Mail, href: 'mailto:hello@hireq.com', color: 'hover:text-primary-400' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black text-gray-300 mt-auto overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Section - Larger */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative p-2.5 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl">
                  <Brain className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  HireQ
                </span>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Sparkles className="h-3 w-3 text-primary-400" />
                  <span>AI-Powered Recruitment</span>
                </div>
              </div>
            </Link>
            
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Transform your hiring process with intelligent candidate screening, 
              AI-powered interview analysis, and data-driven recruitment decisions.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
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

          {/* Product Links */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-primary-500 to-transparent" />
              Product
            </h3>
            <ul className="space-y-3">
              {productLinks.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className="group flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-gray-600 group-hover:text-primary-400 transition-colors" />
                    <span className="text-sm">{item.name}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-purple-500 to-transparent" />
              Capabilities
            </h3>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature.name} className="group">
                  <div className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {feature.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {feature.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-emerald-500 to-transparent" />
              Get Started
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Ready to transform your hiring?
              </p>
              <Link href="/upload-resume">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-500/20"
                >
                  Upload Resume
                </motion.button>
              </Link>
              <Link href="/jobs">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-all border border-gray-700 hover:border-gray-600 mt-2"
                >
                  Manage Jobs
                </motion.button>
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
            

            <div className="flex items-center gap-4 text-xs text-gray-600">
              <Link href="#" className="hover:text-gray-400 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-gray-400 transition-colors">Terms</Link>
              <Link href="/docs/deployment" className="hover:text-gray-400 transition-colors">Docs</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
