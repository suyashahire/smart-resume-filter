'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, FileText, MessageSquare, BarChart3, Users, Zap, Target, Shield } from 'lucide-react';
import Button from '@/components/Button';
import { useStore } from '@/store/useStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show nothing while redirecting to prevent flash
  if (!isAuthenticated) {
    return null;
  }
  
  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Resume Screening',
      description: 'Automatically parse and analyze resumes using NLP to extract key information and rank candidates.'
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'Interview Analysis',
      description: 'Convert interview recordings to text and analyze sentiment, confidence, and communication skills.'
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Smart Analytics',
      description: 'Get detailed insights and analytics about candidates with comprehensive scoring metrics.'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Candidate Ranking',
      description: 'ML-powered ranking system to identify the best candidates based on job requirements.'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Fast Processing',
      description: 'Process multiple resumes and interviews quickly with our optimized AI pipeline.'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Reduce Bias',
      description: 'Objective evaluation criteria help minimize unconscious bias in the hiring process.'
    }
  ];

  const stats = [
    { value: '95%', label: 'Accuracy' },
    { value: '70%', label: 'Time Saved' },
    { value: '50%', label: 'Cost Reduction' },
    { value: '100+', label: 'Resumes/Hour' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <Brain className="h-20 w-20" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Smart Resume Filter & AI HR Assistant
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Automate candidate screening and interview evaluation with AI-powered recruitment platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link href="/upload-resume">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                      Start Screening
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                      View Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                      Login to Start
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                      View Demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to streamline your recruitment process
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="text-primary-600 dark:text-primary-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Simple, fast, and efficient recruitment process
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Upload Resumes', desc: 'Upload candidate resumes in PDF or DOCX format' },
              { step: '2', title: 'Add Job Description', desc: 'Define job requirements and required skills' },
              { step: '3', title: 'AI Analysis', desc: 'Our AI analyzes and ranks candidates automatically' },
              { step: '4', title: 'Get Results', desc: 'Review ranked candidates and detailed reports' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <Target className="h-6 w-6 text-primary-300 dark:text-primary-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Hiring Process?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Start using our AI-powered platform today and find the best candidates faster
            </p>
            <Link href={isAuthenticated ? "/upload-resume" : "/login"}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                {isAuthenticated ? "Get Started Now" : "Login to Get Started"}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

