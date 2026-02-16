'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Briefcase, Plus, Edit3, Trash2, Users, CheckCircle, Clock, Archive, Search, X, ChevronRight, Sparkles, Target, Calendar, MoreVertical, Play, Pause, Settings, Eye, FileText, Filter, BarChart3, Loader2 } from 'lucide-react';
import { useStore, Job } from '@/store/useStore';
import { deleteJobDescription, getJobDescriptions } from '@/lib/api';

export default function JobsPage() {
  const { 
    jobs, 
    addJob, 
    updateJob, 
    deleteJob, 
    setJobs,
    currentJobId, 
    setCurrentJobId, 
    setJobDescription,
    candidateJobAssignments,
    filteredResumes,
    isAuthenticated,
    useRealApi,
  } = useStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'draft'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [jobsLoading, setJobsLoading] = useState(true);

  // Load jobs from API so HR list matches backend (and delete affects candidate portal)
  useEffect(() => {
    if (!isAuthenticated || !useRealApi) {
      setJobsLoading(false);
      return;
    }
    let cancelled = false;
    setJobsLoading(true);
    getJobDescriptions()
      .then((data) => {
        if (cancelled) return;
        const mapped: Job[] = (data || []).map((j: { id: string; title: string; description: string; required_skills: string[]; experience_required?: string; is_active?: boolean; created_at: string; candidates_screened?: number }) => ({
          id: j.id,
          title: j.title,
          description: j.description,
          requiredSkills: j.required_skills || [],
          experience: j.experience_required || '',
          status: j.is_active ? 'open' : 'closed',
          createdAt: j.created_at,
          candidateCount: j.candidates_screened ?? 0,
        }));
        setJobs(mapped);
      })
      .catch(() => {
        if (!cancelled) setJobsLoading(false);
      })
      .finally(() => {
        if (!cancelled) setJobsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, useRealApi, setJobs]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    experience: ''
  });

  // Filter jobs
  const displayedJobs = useMemo(() => {
    let filtered = [...jobs];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(j => 
        j.title.toLowerCase().includes(query) ||
        j.description.toLowerCase().includes(query) ||
        j.requiredSkills.some(s => s.toLowerCase().includes(query))
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(j => j.status === statusFilter);
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [jobs, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: jobs.length,
    open: jobs.filter(j => j.status === 'open').length,
    closed: jobs.filter(j => j.status === 'closed').length,
    draft: jobs.filter(j => j.status === 'draft').length,
    totalCandidates: candidateJobAssignments.length
  }), [jobs, candidateJobAssignments]);

  const resetForm = () => {
    setFormData({ title: '', description: '', requiredSkills: '', experience: '' });
    setEditingJob(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (job: Job) => {
    setFormData({
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills.join(', '),
      experience: job.experience
    });
    setEditingJob(job);
    setShowCreateModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const skills = formData.requiredSkills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (editingJob) {
      updateJob(editingJob.id, {
        title: formData.title,
        description: formData.description,
        requiredSkills: skills,
        experience: formData.experience
      });
    } else {
      const newJob: Job = {
        id: `job_${Date.now()}`,
        title: formData.title,
        description: formData.description,
        requiredSkills: skills,
        experience: formData.experience,
        status: 'draft',
        createdAt: new Date().toISOString(),
        candidateCount: 0
      };
      addJob(newJob);
    }
    
    setShowCreateModal(false);
    resetForm();
  };

  const handleSetActive = (job: Job) => {
    setCurrentJobId(job.id);
    // Also update the legacy jobDescription for compatibility
    setJobDescription({
      id: job.id,
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills,
      experience: job.experience
    });
    // Update job status to open
    if (job.status !== 'open') {
      updateJob(job.id, { status: 'open' });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteJobDescription(id);
      deleteJob(id);
      setShowDeleteConfirm(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete job';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: Job['status']) => {
    switch (status) {
      case 'open':
        return { label: 'Open', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20', icon: <Play className="h-3.5 w-3.5" /> };
      case 'closed':
        return { label: 'Closed', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20', icon: <Pause className="h-3.5 w-3.5" /> };
      case 'draft':
        return { label: 'Draft', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20', icon: <Edit3 className="h-3.5 w-3.5" /> };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-4 ring-1 ring-blue-500/20"
              >
                <Briefcase className="h-4 w-4" />
                <span>Job Management</span>
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                Open <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Positions</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Create and manage job positions, assign candidates to roles
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-xl shadow-blue-500/30"
            >
              <Plus className="h-5 w-5" />
              Create Job
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          {[
            { label: 'Total Jobs', value: stats.total, icon: <Briefcase className="h-5 w-5" />, gradient: 'from-slate-500 to-gray-600' },
            { label: 'Open', value: stats.open, icon: <Play className="h-5 w-5" />, gradient: 'from-emerald-500 to-green-600' },
            { label: 'Closed', value: stats.closed, icon: <Pause className="h-5 w-5" />, gradient: 'from-gray-500 to-slate-600' },
            { label: 'Drafts', value: stats.draft, icon: <Edit3 className="h-5 w-5" />, gradient: 'from-amber-500 to-orange-600' },
            { label: 'Assignments', value: stats.totalCandidates, icon: <Users className="h-5 w-5" />, gradient: 'from-purple-500 to-pink-600' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05 + index * 0.03 }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl p-4 border border-white/50 dark:border-gray-800/50 shadow-lg"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white mb-3 shadow-lg`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl border border-white/50 dark:border-gray-800/50 shadow-xl p-5 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search jobs by title, description, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              {(['all', 'open', 'closed', 'draft'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    statusFilter === status
                      ? status === 'all' 
                        ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg'
                        : status === 'open'
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                        : status === 'closed'
                        ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Jobs List */}
        {displayedJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl border border-white/50 dark:border-gray-800/50 p-16 text-center shadow-xl"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {jobs.length === 0 ? 'No Jobs Yet' : 'No Matching Jobs'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {jobs.length === 0 
                ? 'Create your first job position to start managing candidates'
                : 'Try adjusting your search or filters'}
            </p>
            {jobs.length === 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openCreateModal}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30"
              >
                <Plus className="h-5 w-5 inline mr-2" />
                Create First Job
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {displayedJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.05 + index * 0.02, 0.3) }}
                className={`group backdrop-blur-xl rounded-2xl border overflow-hidden transition-all duration-300 ${
                  currentJobId === job.id
                    ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-500 ring-2 ring-blue-500/30 shadow-xl shadow-blue-500/10'
                    : 'bg-white/70 dark:bg-gray-900/70 border-white/50 dark:border-gray-800/50 hover:border-blue-500/30 hover:shadow-xl'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(job.status).color}`}>
                          {getStatusBadge(job.status).icon}
                          {getStatusBadge(job.status).label}
                        </span>
                        {currentJobId === job.id && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold">
                            <Target className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.slice(0, 6).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 6 && (
                          <span className="px-3 py-1.5 bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 rounded-lg text-xs font-semibold">
                            +{job.requiredSkills.length - 6} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {job.candidateCount} candidates
                        </span>
                        {job.experience && (
                          <span className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {job.experience}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2">
                      {currentJobId !== job.id && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSetActive(job)}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                          <Target className="h-4 w-4" />
                          Set Active
                        </motion.button>
                      )}
                      
                      <Link href={`/results?jobId=${job.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full px-4 py-2.5 bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Candidates
                        </motion.button>
                      </Link>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openEditModal(job)}
                        className="px-4 py-2.5 bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDeleteConfirm(job.id)}
                        className="px-4 py-2.5 bg-rose-50/80 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-semibold hover:bg-rose-100/80 dark:hover:bg-rose-900/30 transition-all flex items-center justify-center gap-2 ring-1 ring-rose-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link href="/job-description">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 rounded-2xl font-bold border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/50 transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <FileText className="h-5 w-5" />
                Quick Job Setup
              </motion.button>
            </Link>
            <Link href="/results">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3"
              >
                <Users className="h-5 w-5" />
                View All Candidates
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-white/50 dark:border-gray-800/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200/50 dark:border-gray-800/50 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    {editingJob ? <Edit3 className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {editingJob ? 'Edit Job' : 'Create New Job'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {editingJob ? 'Update job details' : 'Add a new position'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    className="w-full px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Required Skills *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requiredSkills}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredSkills: e.target.value }))}
                    placeholder="e.g., React, TypeScript, Node.js, Python"
                    className="w-full px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Separate skills with commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Experience Level
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g., 3-5 years, Senior level, Entry level"
                    className="w-full px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30"
                  >
                    {editingJob ? 'Update Job' : 'Create Job'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/50 dark:border-gray-800/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Delete Job?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                This will permanently delete this job and remove all candidate assignments. This action cannot be undone.
              </p>
              {deleteError && (
                <p className="text-red-600 dark:text-red-400 text-sm text-center mb-4">
                  {deleteError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(null); setDeleteError(null); }}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={!isDeleting ? { scale: 1.01 } : undefined}
                  whileTap={!isDeleting ? { scale: 0.99 } : undefined}
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-rose-500/30 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
