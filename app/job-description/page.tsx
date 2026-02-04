'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Briefcase, Sparkles, AlertCircle, Cloud, HardDrive, Zap } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useStore } from '@/store/useStore';
import { parseJobDescription, screenCandidates } from '@/lib/mockApi';
import * as api from '@/lib/api';

export default function JobDescriptionPage() {
  const router = useRouter();
  const { resumes, setJobDescription, setFilteredResumes, setIsLoading, useRealApi, isAuthenticated } = useStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) return;

    if (resumes.length === 0) {
      alert('Please upload resumes first!');
      router.push('/upload-resume');
      return;
    }

    setIsProcessing(true);
    setIsLoading(true);

    try {
      let requiredSkills: string[] = [];
      let rankedCandidates: typeof resumes = [];

      if (useRealApi && isAuthenticated) {
        // Use real backend API
        setProcessingStep('Creating job description...');
        
        const jobResponse = await api.createJobDescription({
          title,
          description,
          experience_required: experience,
        });

        requiredSkills = jobResponse.required_skills;
        setExtractedSkills(requiredSkills);
        
        setProcessingStep('Screening candidates with AI...');
        
        // Screen candidates
        const results = await api.screenCandidates(jobResponse.id);
        
        rankedCandidates = results.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          skills: r.skills,
          education: r.education,
          experience: r.experience,
          score: r.score,
          skillMatches: r.skill_matches
        }));

        // Store job ID for later use
        const jobDesc = {
          id: jobResponse.id,
          title,
          description,
          requiredSkills,
          experience
        };
        setJobDescription(jobDesc);
        
      } else {
        // Use mock API (demo mode)
        setProcessingStep('Extracting skills from description...');
        requiredSkills = await parseJobDescription(description);
        setExtractedSkills(requiredSkills);
        
        const jobDesc = {
          title,
          description,
          requiredSkills,
          experience
        };
        setJobDescription(jobDesc);

        setProcessingStep('Ranking candidates...');
        rankedCandidates = await screenCandidates(resumes, jobDesc);
      }

      setFilteredResumes(rankedCandidates);
      
      setProcessingStep('Complete!');

      // Navigate to results
      setTimeout(() => {
        router.push('/results');
      }, 500);
    } catch (error) {
      console.error('Error processing job description:', error);
      alert(error instanceof Error ? error.message : 'Failed to process job description');
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  const sampleJD = () => {
    setTitle('Full Stack Developer');
    setDescription(`We are looking for a talented Full Stack Developer to join our team.

Responsibilities:
- Develop and maintain web applications using React and Node.js
- Design and implement RESTful APIs
- Work with databases (MongoDB, PostgreSQL)
- Collaborate with cross-functional teams
- Write clean, maintainable code

Requirements:
- 2+ years of experience in web development
- Strong proficiency in JavaScript, TypeScript
- Experience with React, Node.js, and modern web frameworks
- Knowledge of database design and optimization
- Excellent problem-solving and communication skills
- Bachelor's degree in Computer Science or related field`);
    setExperience('2+ years');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Briefcase className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Description</h1>
            </div>
            
            {/* API Mode Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
              useRealApi && isAuthenticated
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            }`}>
              {useRealApi && isAuthenticated ? (
                <>
                  <Cloud className="h-4 w-4" />
                  <span>AI Matching</span>
                </>
              ) : (
                <>
                  <HardDrive className="h-4 w-4" />
                  <span>Demo Mode</span>
                </>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Define the job requirements to match against candidate profiles
          </p>
        </motion.div>

        {resumes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  No resumes found. Please upload resumes first before proceeding.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {resumes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 rounded">
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-green-500 mr-3" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  <strong>{resumes.length} resume{resumes.length > 1 ? 's' : ''}</strong> ready for screening
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required Experience
              </label>
              <input
                type="text"
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g., 3+ years"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Description *
                </label>
                <button
                  type="button"
                  onClick={sampleJD}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Use Sample</span>
                </button>
              </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste or type the complete job description including responsibilities, requirements, and qualifications..."
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {useRealApi && isAuthenticated 
                  ? 'Our AI will extract key skills using NLP and match candidates with Sentence-BERT'
                  : 'Demo mode uses keyword matching. Connect to backend for AI-powered extraction.'
                }
              </p>
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-primary-700 dark:text-primary-400 font-medium">{processingStep}</span>
                </div>
              </motion.div>
            )}

            {/* Extracted Skills Preview */}
            {extractedSkills.length > 0 && !isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
              >
                <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">Extracted Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {extractedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 rounded-md text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/upload-resume')}
              >
                Back to Upload
              </Button>
              <Button
                type="submit"
                size="lg"
                isLoading={isProcessing}
                disabled={!title || !description || resumes.length === 0}
              >
                {isProcessing ? 'Processing...' : 'Analyze Candidates'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How it works</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 font-bold mr-2">•</span>
                <span>
                  {useRealApi && isAuthenticated
                    ? 'Our spaCy NLP engine extracts key skills, qualifications, and requirements from your job description'
                    : 'Keywords are extracted from your job description (Demo mode)'
                  }
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 font-bold mr-2">•</span>
                <span>
                  {useRealApi && isAuthenticated
                    ? 'Sentence-BERT semantic matching compares candidate profiles against job requirements'
                    : 'Candidates are matched based on keyword overlap (Demo mode)'
                  }
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 font-bold mr-2">•</span>
                <span>Candidates are ranked: 70% skills, 20% experience, 10% education</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 font-bold mr-2">•</span>
                <span>Results are displayed with detailed scoring breakdown for informed decision-making</span>
              </li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
