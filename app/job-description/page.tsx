'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Briefcase, Sparkles, AlertCircle, Cloud, HardDrive, Zap, ArrowRight, ArrowLeft, FileText, Target, Brain, CheckCircle } from 'lucide-react';
import Button from '@/components/Button';
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
        setProcessingStep('Creating job description...');
        
        const jobResponse = await api.createJobDescription({
          title,
          description,
          experience_required: experience,
        });

        requiredSkills = jobResponse.required_skills;
        setExtractedSkills(requiredSkills);
        
        setProcessingStep('Screening candidates with AI...');
        
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

        const jobDesc = {
          id: jobResponse.id,
          title,
          description,
          requiredSkills,
          experience
        };
        setJobDescription(jobDesc);
        
      } else {
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

  const features = [
    { icon: <Brain className="h-5 w-5" />, title: 'NLP Extraction', desc: 'Extract skills with AI' },
    { icon: <Target className="h-5 w-5" />, title: 'Semantic Match', desc: 'Deep understanding' },
    { icon: <Zap className="h-5 w-5" />, title: 'Smart Ranking', desc: 'Weighted scoring' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6"
          >
            <Briefcase className="h-4 w-4" />
            <span>Step 2 of 3</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Define <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Requirements</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Enter job details and let AI match candidates to your requirements
          </p>
        </motion.div>

        {/* Status Cards Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          {/* Resumes Status */}
          <div className={`rounded-2xl p-4 border ${
            resumes.length > 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                resumes.length > 0 
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                <FileText className={`h-5 w-5 ${
                  resumes.length > 0 
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`} />
              </div>
              <div>
                <p className={`font-semibold ${
                  resumes.length > 0 
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-amber-800 dark:text-amber-300'
                }`}>
                  {resumes.length > 0 ? `${resumes.length} Resume${resumes.length > 1 ? 's' : ''} Ready` : 'No Resumes'}
                </p>
                <p className={`text-sm ${
                  resumes.length > 0 
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {resumes.length > 0 ? 'Ready for screening' : 'Upload resumes first'}
                </p>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className={`rounded-2xl p-4 border ${
            useRealApi && isAuthenticated
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                useRealApi && isAuthenticated
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {useRealApi && isAuthenticated ? (
                  <Cloud className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <HardDrive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div>
                <p className={`font-semibold ${
                  useRealApi && isAuthenticated
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-gray-800 dark:text-gray-300'
                }`}>
                  {useRealApi && isAuthenticated ? 'AI Processing' : 'Local Mode'}
                </p>
                <p className={`text-sm ${
                  useRealApi && isAuthenticated
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {useRealApi && isAuthenticated ? 'Sentence-BERT matching' : 'Keyword matching'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Job Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                required
              />
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Required Experience
              </label>
              <input
                type="text"
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g., 3+ years"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
            </div>

            {/* Job Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Job Description *
                </label>
                <motion.button
                  type="button"
                  onClick={sampleJD}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Use Sample</span>
                </motion.button>
              </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste or type the complete job description including responsibilities, requirements, and qualifications..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                required
              />
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-800 dark:text-purple-300">{processingStep}</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Please wait...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Extracted Skills */}
            {extractedSkills.length > 0 && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="font-semibold text-green-800 dark:text-green-300">Extracted Skills</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {extractedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <motion.button
                type="button"
                onClick={() => router.push('/upload-resume')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Upload
              </motion.button>
              <motion.button
                type="submit"
                disabled={!title || !description || resumes.length === 0 || isProcessing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto group px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Analyze Candidates'}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
