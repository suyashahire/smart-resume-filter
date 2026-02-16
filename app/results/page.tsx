'use client';

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Mail, Phone, FileText, MessageSquare, AlertCircle, CheckCircle, Trash2, ArrowRight, Crown, Star, Users, TrendingUp, Search, X, Filter, SlidersHorizontal, Square, CheckSquare, Loader2, Download, GitCompare, Briefcase, GraduationCap, Award, BarChart3, Heart, Sparkles, Eye, ChevronRight, Zap, Target, Shield, FolderPlus, Tags, Plus, RefreshCw, StickyNote, Tag, ChevronDown, UserCheck, Clock, Send, XCircle, CircleDot, HelpCircle, Copy, Lightbulb, LayoutGrid, GripVertical } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useStore, Job, CandidateJobAssignment } from '@/store/useStore';
import * as api from '@/lib/api';
import RealtimeIndicator from '@/components/features/RealtimeIndicator';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    filteredResumes, 
    jobDescription, 
    useRealApi, 
    isAuthenticated, 
    removeResume,
    setResumes,
    setFilteredResumes,
    shortlistedIds, 
    toggleShortlist,
    // Multi-job support
    jobs,
    currentJobId,
    setCurrentJobId,
    candidateJobAssignments,
    assignCandidateToJob,
    unassignCandidateFromJob,
    getCandidatesForJob,
    getJobsForCandidate,
    updateCandidateJobStatus,
    // Notes & Tags
    candidateNotes,
    candidateTags,
    availableTags,
    addCandidateNote,
    addTagToCandidate,
    removeTagFromCandidate,
    // Activity
    addActivity,
    // Session fetch tracking
    hasFetchedSessionData,
    setHasFetchedSessionData
  } = useStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Job filter state (from URL or current job)
  const [selectedJobFilter, setSelectedJobFilter] = useState<string | 'all'>('all');
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'excellent' | 'good' | 'fair' | 'low'>('all');
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [showFilters, setShowFilters] = useState(false);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Comparison modal state
  const [showComparison, setShowComparison] = useState(false);
  
  // Shortlist filter state
  const [showShortlistOnly, setShowShortlistOnly] = useState(false);
  
  // Hover state for cards
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // Notes & Tags state
  const [showNotesModal, setShowNotesModal] = useState<string | null>(null);
  const [showTagsDropdown, setShowTagsDropdown] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  
  // Interview Questions Generator state
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<{ category: string; questions: string[] }[]>([]);
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);
  
  // Kanban board modal state
  const [showKanbanModal, setShowKanbanModal] = useState(false);
  
  // Drag and drop state for Kanban
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Pipeline status config
  const pipelineStatuses: { value: CandidateJobAssignment['status']; label: string; color: string; icon: React.ReactNode }[] = [
    { value: 'new', label: 'New', color: 'bg-gray-500', icon: <CircleDot className="h-3 w-3" /> },
    { value: 'screening', label: 'Screening', color: 'bg-blue-500', icon: <Search className="h-3 w-3" /> },
    { value: 'interview', label: 'Interview', color: 'bg-purple-500', icon: <MessageSquare className="h-3 w-3" /> },
    { value: 'offer', label: 'Offer', color: 'bg-amber-500', icon: <Send className="h-3 w-3" /> },
    { value: 'hired', label: 'Hired', color: 'bg-emerald-500', icon: <UserCheck className="h-3 w-3" /> },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500', icon: <XCircle className="h-3 w-3" /> },
  ];

  // Interview question templates
  const generateInterviewQuestions = useCallback((job: Job) => {
    const questions: { category: string; questions: string[] }[] = [];
    
    // Technical Skills Questions
    if (job.requiredSkills && job.requiredSkills.length > 0) {
      const skillQuestions = job.requiredSkills.slice(0, 5).flatMap(skill => [
        `Can you describe your experience with ${skill}?`,
        `What projects have you completed using ${skill}?`,
        `How would you rate your proficiency in ${skill} and why?`,
      ]);
      questions.push({
        category: 'Technical Skills',
        questions: skillQuestions.slice(0, 8)
      });
    }
    
    // Experience Questions
    const experienceQuestions = [
      `Tell me about your most challenging project and how you overcame obstacles.`,
      `Describe a situation where you had to learn a new technology quickly.`,
      `How do you stay updated with the latest industry trends?`,
      `Can you walk me through your typical approach to solving complex problems?`,
    ];
    if (job.experience) {
      experienceQuestions.unshift(
        `You mentioned ${job.experience} of experience is required. Can you highlight relevant experience that matches this?`
      );
    }
    questions.push({
      category: 'Experience & Background',
      questions: experienceQuestions
    });
    
    // Behavioral Questions
    questions.push({
      category: 'Behavioral',
      questions: [
        `Tell me about a time you had a disagreement with a team member. How did you handle it?`,
        `Describe a situation where you had to meet a tight deadline. What was your approach?`,
        `Give an example of when you received constructive criticism. How did you respond?`,
        `Tell me about a time you failed and what you learned from it.`,
        `How do you prioritize tasks when you have multiple deadlines?`,
      ]
    });
    
    // Role-Specific Questions
    const roleTitle = job.title.toLowerCase();
    const roleQuestions: string[] = [];
    
    if (roleTitle.includes('senior') || roleTitle.includes('lead') || roleTitle.includes('manager')) {
      roleQuestions.push(
        `How do you mentor junior team members?`,
        `Describe your leadership style and how you motivate your team.`,
        `How do you handle underperforming team members?`,
      );
    }
    if (roleTitle.includes('frontend') || roleTitle.includes('ui') || roleTitle.includes('ux')) {
      roleQuestions.push(
        `How do you ensure cross-browser compatibility in your projects?`,
        `What's your approach to responsive design?`,
        `How do you optimize frontend performance?`,
      );
    }
    if (roleTitle.includes('backend') || roleTitle.includes('api')) {
      roleQuestions.push(
        `How do you design scalable API architectures?`,
        `What's your approach to database optimization?`,
        `How do you handle security in backend systems?`,
      );
    }
    if (roleTitle.includes('fullstack') || roleTitle.includes('full stack')) {
      roleQuestions.push(
        `How do you balance frontend and backend development in your projects?`,
        `What's your preferred tech stack and why?`,
        `How do you ensure consistency between frontend and backend?`,
      );
    }
    if (roleTitle.includes('data') || roleTitle.includes('analyst')) {
      roleQuestions.push(
        `How do you approach data cleaning and preprocessing?`,
        `Describe a data-driven decision you helped make.`,
        `What tools do you use for data visualization?`,
      );
    }
    if (roleTitle.includes('devops') || roleTitle.includes('sre') || roleTitle.includes('infrastructure')) {
      roleQuestions.push(
        `How do you approach CI/CD pipeline design?`,
        `Describe your experience with container orchestration.`,
        `How do you handle incident response?`,
      );
    }
    
    if (roleQuestions.length > 0) {
      questions.push({
        category: `Role-Specific (${job.title})`,
        questions: roleQuestions
      });
    }
    
    // Culture Fit Questions
    questions.push({
      category: 'Culture & Fit',
      questions: [
        `Why are you interested in this role?`,
        `What type of work environment do you thrive in?`,
        `Where do you see yourself in 5 years?`,
        `What motivates you to do your best work?`,
        `Do you have any questions for us?`,
      ]
    });
    
    return questions;
  }, []);

  // Handle copy question to clipboard
  const handleCopyQuestion = (question: string) => {
    navigator.clipboard.writeText(question);
    setCopiedQuestion(question);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  // Fetch screening results from API (proper endpoint with scores)
  const fetchScreeningResultsFromApi = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // First get all jobs to fetch their screening results
      const jobsData = await api.getJobDescriptions();
      
      if (!jobsData || jobsData.length === 0) {
        // No jobs exist - clear local store to stay in sync
        setFilteredResumes([]);
        setResumes([]);
        return;
      }
      
      const allScreenedResumes: any[] = [];
      
      // Fetch screening results for each job
      for (const job of jobsData) {
        try {
          const screeningResults = await api.getScreeningResults(job.id);
          if (screeningResults && screeningResults.length > 0) {
            // Add job info to each result
            const resultsWithJob = screeningResults.map((r: any) => ({
              id: r.id,
              name: r.name || 'Unknown',
              email: r.email || '',
              phone: r.phone || '',
              skills: r.skills || [],
              education: r.education || '',
              experience: r.experience || '',
              score: r.score || 0,
              skillMatches: r.skill_matches || [],
              jobId: job.id,
              jobTitle: job.title
            }));
            allScreenedResumes.push(...resultsWithJob);
          }
        } catch (err) {
          // Job may not have screening results yet, that's okay
          console.log(`No screening results for job ${job.id}`);
        }
      }
      
      if (allScreenedResumes.length > 0) {
        // Deduplicate by resume ID (keep highest score if duplicates)
        const uniqueResumes = new Map();
        allScreenedResumes.forEach(r => {
          const existing = uniqueResumes.get(r.id);
          if (!existing || r.score > existing.score) {
            uniqueResumes.set(r.id, r);
          }
        });
        
        const dedupedResumes = Array.from(uniqueResumes.values());
        setFilteredResumes(dedupedResumes);
        setResumes(dedupedResumes);
      } else {
        // No screening results found - clear local store to stay in sync
        setFilteredResumes([]);
        setResumes([]);
      }
    } catch (error) {
      console.error('Failed to fetch screening results:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [setResumes, setFilteredResumes]);

  // Fetch from API on mount when connected and no local data (only once per session)
  useEffect(() => {
    if (useRealApi && isAuthenticated && filteredResumes.length === 0 && !hasFetchedSessionData) {
      setHasFetchedSessionData(true);
      fetchScreeningResultsFromApi();
    }
  }, [useRealApi, isAuthenticated, filteredResumes.length, hasFetchedSessionData, setHasFetchedSessionData, fetchScreeningResultsFromApi]);

  // Re-fetch when URL timestamp changes (after new upload/assignment)
  const lastTimestampRef = useRef<string | null>(null);
  useEffect(() => {
    const timestamp = searchParams.get('t');
    if (timestamp && timestamp !== lastTimestampRef.current && useRealApi && isAuthenticated) {
      lastTimestampRef.current = timestamp;
      fetchScreeningResultsFromApi();
    }
  }, [searchParams, useRealApi, isAuthenticated, fetchScreeningResultsFromApi]);

  // Note: hasFetchedSessionData is reset automatically by the store's logout function

  // Initialize job filter from URL
  useEffect(() => {
    const jobIdParam = searchParams.get('jobId');
    if (jobIdParam) {
      setSelectedJobFilter(jobIdParam);
    } else if (currentJobId) {
      setSelectedJobFilter(currentJobId);
    }
  }, [searchParams, currentJobId]);

  // Memoize stats BEFORE any early returns (Rules of Hooks)
  const stats = useMemo(() => {
    const excellentCount = filteredResumes.filter(r => r.score >= 75).length;
    const goodCount = filteredResumes.filter(r => r.score >= 60 && r.score < 75).length;
    const fairCount = filteredResumes.filter(r => r.score >= 45 && r.score < 60).length;
    const avgScore = filteredResumes.length > 0
      ? Math.round(filteredResumes.reduce((acc, r) => acc + r.score, 0) / filteredResumes.length)
      : 0;
    
    return { total: filteredResumes.length, excellent: excellentCount, good: goodCount, fair: fairCount, avgScore };
  }, [filteredResumes]);

  // Filter candidates based on search and filters
  const displayedCandidates = useMemo(() => {
    let candidates = [...filteredResumes];
    
    // Job assignment filter
    if (selectedJobFilter !== 'all') {
      const assignedCandidateIds = candidateJobAssignments
        .filter(a => a.jobId === selectedJobFilter)
        .map(a => a.candidateId);
      candidates = candidates.filter(c => assignedCandidateIds.includes(c.id));
    }
    
    // Shortlist filter
    if (showShortlistOnly) {
      candidates = candidates.filter(c => shortlistedIds.has(c.id));
    }
    
    // Text search (name, email, skills)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      candidates = candidates.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }
    
    // Quick score filter
    if (scoreFilter !== 'all') {
      candidates = candidates.filter(c => {
        if (scoreFilter === 'excellent') return c.score >= 75;
        if (scoreFilter === 'good') return c.score >= 60 && c.score < 75;
        if (scoreFilter === 'fair') return c.score >= 45 && c.score < 60;
        if (scoreFilter === 'low') return c.score < 45;
        return true;
      });
    }
    
    // Custom score range
    candidates = candidates.filter(c => c.score >= minScore && c.score <= maxScore);
    
    return candidates;
  }, [filteredResumes, searchQuery, scoreFilter, minScore, maxScore, showShortlistOnly, shortlistedIds, selectedJobFilter, candidateJobAssignments]);

  // Get all unique skills for suggestions
  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    filteredResumes.forEach(r => r.skills.forEach(s => skills.add(s)));
    return Array.from(skills).slice(0, 20);
  }, [filteredResumes]);

  const clearFilters = () => {
    setSearchQuery('');
    setScoreFilter('all');
    setMinScore(0);
    setMaxScore(100);
    setShowShortlistOnly(false);
    setSelectedJobFilter('all');
  };

  const hasActiveFilters = searchQuery || scoreFilter !== 'all' || minScore > 0 || maxScore < 100 || showShortlistOnly || selectedJobFilter !== 'all';

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedCandidates.map(c => c.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Get candidates for comparison (2-3 selected)
  const comparisonCandidates = useMemo(() => {
    return displayedCandidates.filter(c => selectedIds.has(c.id)).slice(0, 3);
  }, [displayedCandidates, selectedIds]);

  const canCompare = selectedIds.size >= 2 && selectedIds.size <= 3;

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} candidate${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    setIsBulkDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    let backendFailures = 0;

    for (const id of idsToDelete) {
      try {
        if (useRealApi && isAuthenticated) {
          await api.deleteResume(id);
        }
      } catch (error) {
        console.error(`Error deleting candidate ${id} from backend:`, error);
        backendFailures++;
      }
      // Always remove from local store regardless of backend success
      removeResume(id);
    }

    setSelectedIds(new Set());
    setIsBulkDeleting(false);

    if (backendFailures > 0) {
      alert(`Deleted ${idsToDelete.length} candidates locally. ${backendFailures} may not have synced with server.`);
    }
  };

  // CSV Export function
  const exportToCSV = () => {
    const candidatesToExport = selectedIds.size > 0 
      ? displayedCandidates.filter(c => selectedIds.has(c.id))
      : displayedCandidates;

    if (candidatesToExport.length === 0) {
      alert('No candidates to export');
      return;
    }

    const headers = ['Rank', 'Name', 'Email', 'Phone', 'Score', 'Match Level', 'Skills', 'Matched Skills', 'Experience', 'Education'];

    const rows = candidatesToExport.map((candidate, index) => {
      const matchLevel = candidate.score >= 75 ? 'Excellent' 
        : candidate.score >= 60 ? 'Good' 
        : candidate.score >= 45 ? 'Fair' 
        : 'Low';

      return [
        index + 1,
        `"${candidate.name.replace(/"/g, '""')}"`,
        candidate.email,
        candidate.phone || '',
        `${candidate.score}%`,
        matchLevel,
        `"${candidate.skills.join(', ').replace(/"/g, '""')}"`,
        `"${(candidate.skillMatches || []).join(', ').replace(/"/g, '""')}"`,
        `"${(candidate.experience || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(candidate.education || '').replace(/"/g, '""').replace(/\n/g, ' ')}""`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    const jobTitle = jobDescription?.title?.replace(/[^a-z0-9]/gi, '_') || 'candidates';
    link.download = `${jobTitle}_candidates_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      // Always try to delete from backend first when connected
      if (useRealApi && isAuthenticated) {
        await api.deleteResume(id);
      }
      // Only remove from local store after successful backend deletion
      removeResume(id);
    } catch (error) {
      console.error('Error deleting candidate:', error);
      // If backend delete failed, still remove from local store to maintain consistency
      // The candidate may already be deleted on backend or the error was transient
      removeResume(id);
      // Show warning instead of error since we still removed locally
      alert('Candidate removed. Note: There may have been an issue syncing with the server.');
    } finally {
      setDeletingId(null);
    }
  };

  // Show loading state when fetching
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading candidates...</p>
        </motion.div>
      </div>
    );
  }

  if (filteredResumes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 rounded-full blur-[100px]"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-[2rem] shadow-2xl border border-white/50 dark:border-gray-800/50 p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-8 shadow-lg"
            >
              <AlertCircle className="h-12 w-12 text-gray-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">No Results Yet</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto">
              Upload resumes and define a job description to start screening candidates
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/upload-resume">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 text-white rounded-2xl font-semibold shadow-xl shadow-primary-500/30 inline-flex items-center gap-3"
                >
                  <Sparkles className="h-5 w-5" />
                  Upload Resumes
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'from-emerald-400 via-green-500 to-teal-600';
    if (score >= 60) return 'from-blue-400 via-indigo-500 to-violet-600';
    if (score >= 45) return 'from-amber-400 via-orange-500 to-rose-500';
    return 'from-rose-400 via-red-500 to-pink-600';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 75) return 'stroke-emerald-400';
    if (score >= 60) return 'stroke-blue-400';
    if (score >= 45) return 'stroke-amber-400';
    return 'stroke-rose-400';
  };

  const getScoreGlow = (score: number) => {
    if (score >= 75) return 'shadow-emerald-500/40';
    if (score >= 60) return 'shadow-blue-500/40';
    if (score >= 45) return 'shadow-amber-500/40';
    return 'shadow-rose-500/40';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 75) return { label: 'Excellent Match', color: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10', icon: <Sparkles className="h-3.5 w-3.5" /> };
    if (score >= 60) return { label: 'Good Match', color: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10', icon: <CheckCircle className="h-3.5 w-3.5" /> };
    if (score >= 45) return { label: 'Potential Match', color: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10', icon: <Target className="h-3.5 w-3.5" /> };
    return { label: 'Review Needed', color: 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30 shadow-lg shadow-rose-500/10', icon: <Eye className="h-3.5 w-3.5" /> };
  };

  const filterButtons = [
    { value: 'all', label: 'All', count: stats.total, gradient: 'from-gray-500 to-slate-600' },
    { value: 'excellent', label: 'Excellent', count: stats.excellent, gradient: 'from-emerald-500 to-green-600' },
    { value: 'good', label: 'Good', count: stats.good, gradient: 'from-blue-500 to-indigo-600' },
    { value: 'fair', label: 'Fair', count: stats.fair, gradient: 'from-amber-500 to-orange-600' },
    { value: 'low', label: 'Low', count: stats.total - stats.excellent - stats.good - stats.fair, gradient: 'from-rose-500 to-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary-500/15 to-purple-500/15 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Section */}
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-4 ring-1 ring-emerald-500/20"
              >
                <Trophy className="h-4 w-4" />
                <span>Screening Complete</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                Candidate <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">Rankings</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{filteredResumes.length}</span> candidates evaluated for{' '}
                <span className="font-semibold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">{jobDescription?.title || 'the position'}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToCSV}
                className="flex items-center gap-2 px-5 py-3 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl font-medium border border-gray-200/50 dark:border-gray-700/50 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-lg shadow-gray-200/50 dark:shadow-none"
              >
                <Download className="h-4 w-4" />
                {selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export CSV'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total Candidates', value: stats.total, icon: <Users className="h-5 w-5" />, gradient: 'from-slate-500 to-gray-600', glow: 'shadow-slate-500/20' },
            { label: 'Excellent Match', value: stats.excellent, icon: <Star className="h-5 w-5" />, gradient: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/20' },
            { label: 'Good Match', value: stats.good, icon: <CheckCircle className="h-5 w-5" />, gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/20' },
            { label: 'Avg Score', value: `${stats.avgScore}%`, icon: <TrendingUp className="h-5 w-5" />, gradient: 'from-purple-500 to-pink-600', glow: 'shadow-purple-500/20' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl p-5 border border-white/50 dark:border-gray-800/50 shadow-xl ${stat.glow} hover:shadow-2xl transition-all duration-300`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Search & Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl border border-white/50 dark:border-gray-800/50 shadow-xl p-5 mb-8"
        >
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-5">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, email, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-base"
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-medium transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="hidden sm:inline">Advanced Filters</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                  {(scoreFilter !== 'all' ? 1 : 0) + (minScore > 0 || maxScore < 100 ? 1 : 0) + (showShortlistOnly ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Job Filter Dropdown */}
            {jobs.length > 0 && (
              <>
                <div className="relative">
                  <select
                    value={selectedJobFilter}
                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                    className="appearance-none pl-10 pr-10 py-2.5 bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 ring-1 ring-blue-500/20 transition-all"
                  >
                    <option value="all">All Candidates</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} ({candidateJobAssignments.filter(a => a.jobId === job.id).length})
                      </option>
                    ))}
                  </select>
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 rotate-90" />
                </div>
                
                {/* Interview Questions Generator Button */}
                {selectedJobFilter !== 'all' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const job = jobs.find(j => j.id === selectedJobFilter);
                      if (job) {
                        const questions = generateInterviewQuestions(job);
                        setGeneratedQuestions(questions);
                        setShowQuestionsModal(true);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline">Interview Questions</span>
                    <span className="sm:hidden">Questions</span>
                  </motion.button>
                )}
                
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
              </>
            )}
            
            {/* Shortlist Toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowShortlistOnly(!showShortlistOnly)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                showShortlistOnly
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                  : 'bg-pink-50/80 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100/80 dark:hover:bg-pink-900/30 ring-1 ring-pink-500/20'
              }`}
            >
              <Heart className={`h-4 w-4 ${showShortlistOnly ? 'fill-current' : ''}`} />
              <span>Shortlisted</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${showShortlistOnly ? 'bg-white/20' : 'bg-pink-500/10'}`}>
                {shortlistedIds.size}
              </span>
            </motion.button>

            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Score Filter Pills */}
            {filterButtons.map((filter) => (
              <motion.button
                key={filter.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setScoreFilter(filter.value as typeof scoreFilter)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  scoreFilter === filter.value
                    ? `bg-gradient-to-r ${filter.gradient} text-white shadow-lg`
                    : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80'
                }`}
              >
                <span>{filter.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${scoreFilter === filter.value ? 'bg-white/20' : 'bg-gray-500/10'}`}>
                  {filter.count}
                </span>
              </motion.button>
            ))}
            
            {/* Pipeline Board Button */}
            {selectedJobFilter !== 'all' && (
              <>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowKanbanModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>Pipeline Board</span>
                </motion.button>
              </>
            )}
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-5 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Score Range */}
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Score Range: <span className="text-primary-600 dark:text-primary-400">{minScore}%</span> - <span className="text-primary-600 dark:text-primary-400">{maxScore}%</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={minScore}
                          onChange={(e) => setMinScore(Math.min(Number(e.target.value), maxScore))}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-500"
                        />
                        <span className="text-sm text-gray-400 font-medium">to</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={maxScore}
                          onChange={(e) => setMaxScore(Math.max(Number(e.target.value), minScore))}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-500"
                        />
                      </div>
                    </div>

                    {/* Skill Suggestions */}
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Quick Skill Search
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allSkills.slice(0, 8).map((skill) => (
                          <button
                            key={skill}
                            onClick={() => setSearchQuery(skill)}
                            className="px-3 py-1.5 bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-medium hover:bg-primary-100/80 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-all ring-1 ring-gray-200/50 dark:ring-gray-600/50 hover:ring-primary-500/30"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold flex items-center gap-2 group"
                    >
                      <X className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-bold text-gray-900 dark:text-white">{displayedCandidates.length}</span> of{' '}
                <span className="font-bold">{filteredResumes.length}</span> candidates
              </p>
            </div>
          )}
        </motion.div>

        {/* Top Candidate Spotlight */}
        {displayedCandidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-r from-amber-50/80 via-yellow-50/80 to-orange-50/80 dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-orange-900/30 rounded-2xl p-6 lg:p-8 border border-amber-200/50 dark:border-amber-800/50 shadow-xl shadow-amber-500/10">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/30 to-amber-400/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-2xl"></div>
              
              <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/40"
                  >
                    <Crown className="h-10 w-10 text-white drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      TOP CANDIDATE
                    </p>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{displayedCandidates[0].name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {displayedCandidates[0].email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">{displayedCandidates[0].score}%</p>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">{getScoreBadge(displayedCandidates[0].score).label}</p>
                  </div>
                  <Link href={`/reports/${displayedCandidates[0].id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white rounded-xl font-bold shadow-xl shadow-amber-500/40 flex items-center gap-2"
                    >
                      <Eye className="h-5 w-5" />
                      View Report
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bulk Selection Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6 backdrop-blur-xl bg-gradient-to-r from-primary-50/90 to-purple-50/90 dark:from-primary-900/30 dark:to-purple-900/30 rounded-2xl border border-primary-200/50 dark:border-primary-800/50 p-5 shadow-xl shadow-primary-500/10"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <CheckSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">
                      {selectedIds.size} selected
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ready for bulk actions
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Clear
                  </button>
                  {canCompare && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowComparison(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                      <GitCompare className="h-4 w-4" />
                      Compare
                    </motion.button>
                  )}
                  {selectedIds.size > 3 && (
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      Select 2-3 to compare
                    </span>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Select All Header */}
        {displayedCandidates.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
            >
              <span className={`p-1 rounded-lg transition-all ${selectedIds.size === displayedCandidates.length && displayedCandidates.length > 0 ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'}`}>
                {selectedIds.size === displayedCandidates.length && displayedCandidates.length > 0 ? (
                  <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </span>
              {selectedIds.size === displayedCandidates.length && displayedCandidates.length > 0 
                ? 'Deselect All' 
                : `Select All (${displayedCandidates.length})`}
            </button>
            {selectedIds.size > 0 && selectedIds.size < displayedCandidates.length && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {selectedIds.size} of {displayedCandidates.length} selected
              </span>
            )}
          </div>
        )}

        {/* Candidate List */}
        {displayedCandidates.length === 0 && hasActiveFilters ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl border border-white/50 dark:border-gray-800/50 p-16 text-center shadow-xl"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <Filter className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No matches found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Try adjusting your search terms or filter criteria
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearFilters}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30"
            >
              Clear Filters
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {displayedCandidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: Math.min(0.05 + index * 0.03, 0.3), type: "spring", damping: 20 }}
                onMouseEnter={() => setHoveredCard(candidate.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative rounded-3xl overflow-hidden transition-all duration-500 ${
                  selectedIds.has(candidate.id)
                    ? 'ring-2 ring-primary-500 shadow-2xl shadow-primary-500/20 scale-[1.01]'
                    : 'hover:shadow-2xl hover:scale-[1.005]'
                }`}
              >
                {/* Glass background with gradient border */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-800/80 backdrop-blur-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/50 dark:to-gray-800/30"></div>
                
                {/* Animated gradient border on hover */}
                <div className={`absolute inset-0 rounded-3xl transition-opacity duration-500 ${
                  hoveredCard === candidate.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${getScoreColor(candidate.score)} p-[1px]`}>
                    <div className="absolute inset-[1px] rounded-3xl bg-white dark:bg-gray-900"></div>
                  </div>
                </div>
                
                {/* Border */}
                <div className="absolute inset-0 rounded-3xl border border-gray-200/60 dark:border-gray-700/60"></div>

                <div className="relative flex flex-col lg:flex-row">
                  {/* Rank & Score Section - Premium circular gauge design */}
                  <div 
                    onClick={() => toggleSelect(candidate.id)}
                    className={`relative lg:w-44 flex flex-col items-center justify-center p-6 lg:p-8 bg-gradient-to-br ${getScoreColor(candidate.score)} cursor-pointer transition-all duration-300 group-hover:brightness-105`}
                  >
                    {/* Selection checkbox */}
                    <motion.div
                      initial={false}
                      animate={{ scale: selectedIds.has(candidate.id) ? 1.1 : 1 }}
                      className="absolute top-4 left-4 p-2 rounded-xl bg-white/25 backdrop-blur-sm hover:bg-white/40 transition-all"
                    >
                      {selectedIds.has(candidate.id) ? (
                        <CheckSquare className="h-5 w-5 text-white drop-shadow-lg" />
                      ) : (
                        <Square className="h-5 w-5 text-white/80" />
                      )}
                    </motion.div>
                    
                    {/* Rank badge */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/25 backdrop-blur-sm">
                      <span className="text-sm font-bold text-white drop-shadow">#{index + 1}</span>
                    </div>
                    
                    {/* Circular score gauge */}
                    <div className="relative w-28 h-28 lg:w-32 lg:h-32">
                      {/* Background ring */}
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="rgba(255,255,255,0.9)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${candidate.score * 2.64} 264`}
                          className="drop-shadow-lg transition-all duration-1000"
                        />
                      </svg>
                      {/* Score text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{Math.round(candidate.score)}</span>
                        <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Match %</span>
                      </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-6 lg:p-8">
                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                      <div className="flex-1 space-y-5">
                        {/* Name & Badge Row */}
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{candidate.name}</h3>
                          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${getScoreBadge(candidate.score).color}`}>
                            {getScoreBadge(candidate.score).icon}
                            {getScoreBadge(candidate.score).label}
                          </span>
                          {shortlistedIds.has(candidate.id) && (
                            <motion.span 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-600 dark:text-pink-400 text-xs font-bold ring-1 ring-pink-500/30 shadow-lg shadow-pink-500/10"
                            >
                              <Heart className="h-3.5 w-3.5 fill-current" />
                              Shortlisted
                            </motion.span>
                          )}
                          {/* Candidate Tags */}
                          {candidateTags[candidate.id]?.map((tagId) => {
                            const tag = availableTags.find(t => t.id === tagId);
                            if (!tag) return null;
                            const colorMap: Record<string, string> = {
                              red: 'from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 ring-red-500/30',
                              green: 'from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30',
                              yellow: 'from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 ring-amber-500/30',
                              blue: 'from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 ring-blue-500/30',
                              purple: 'from-purple-500/20 to-violet-500/20 text-purple-600 dark:text-purple-400 ring-purple-500/30',
                            };
                            return (
                              <motion.span
                                key={tagId}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${colorMap[tag.color] || colorMap.blue} text-xs font-bold ring-1 shadow-lg`}
                              >
                                <Tag className="h-3 w-3" />
                                {tag.label}
                              </motion.span>
                            );
                          })}
                        </div>
                        
                        {/* Contact Info - Premium pill design */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-gray-100/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-700/60 rounded-2xl text-sm text-gray-700 dark:text-gray-300 ring-1 ring-gray-200/50 dark:ring-gray-700/50 backdrop-blur-sm">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </div>
                            {candidate.email}
                          </span>
                          {candidate.phone && (
                            <span className="inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-gray-100/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-700/60 rounded-2xl text-sm text-gray-700 dark:text-gray-300 ring-1 ring-gray-200/50 dark:ring-gray-700/50 backdrop-blur-sm">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                                <Phone className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              </div>
                              {candidate.phone}
                            </span>
                          )}
                        </div>

                        {/* Skills - Premium tag design */}
                        <div className="flex flex-wrap gap-2.5">
                          {candidate.skills.slice(0, 6).map((skill, idx) => {
                            const isMatch = candidate.skillMatches?.includes(skill);
                            return (
                              <motion.span
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 + idx * 0.03 }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                                  isMatch 
                                    ? 'bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                                    : 'bg-gradient-to-r from-gray-100/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-700/70 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200/50 dark:ring-gray-700/50'
                                }`}
                              >
                                {isMatch && (
                                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  </span>
                                )}
                                {skill}
                              </motion.span>
                            );
                          })}
                          {candidate.skills.length > 6 && (
                            <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500/10 to-purple-500/10 text-primary-600 dark:text-primary-400 rounded-2xl text-sm font-bold ring-1 ring-primary-500/20">
                              +{candidate.skills.length - 6} more
                            </span>
                          )}
                        </div>

                        {/* Ranking Explanation */}
                        {selectedJobFilter !== 'all' && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                            <div className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <p className="font-semibold text-blue-700 dark:text-blue-300">Why this score?</p>
                                <ul className="space-y-0.5">
                                  {candidate.skillMatches && candidate.skillMatches.length > 0 ? (
                                    <li className="flex items-center gap-1.5">
                                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                                      <span><span className="font-medium text-emerald-600 dark:text-emerald-400">{candidate.skillMatches.length}</span> of {jobs.find(j => j.id === selectedJobFilter)?.requiredSkills?.length || 'N/A'} required skills matched</span>
                                    </li>
                                  ) : (
                                    <li className="flex items-center gap-1.5">
                                      <AlertCircle className="h-3 w-3 text-amber-500" />
                                      <span>No exact skill matches found</span>
                                    </li>
                                  )}
                                  {candidate.score >= 75 && (
                                    <li className="flex items-center gap-1.5">
                                      <Crown className="h-3 w-3 text-amber-500" />
                                      <span>Strong alignment with job requirements</span>
                                    </li>
                                  )}
                                  {candidate.score >= 60 && candidate.score < 75 && (
                                    <li className="flex items-center gap-1.5">
                                      <TrendingUp className="h-3 w-3 text-blue-500" />
                                      <span>Good fit with some skill gaps</span>
                                    </li>
                                  )}
                                  {candidate.score >= 45 && candidate.score < 60 && (
                                    <li className="flex items-center gap-1.5">
                                      <AlertCircle className="h-3 w-3 text-amber-500" />
                                      <span>Partial match - may need training</span>
                                    </li>
                                  )}
                                  {candidate.score < 45 && (
                                    <li className="flex items-center gap-1.5">
                                      <AlertCircle className="h-3 w-3 text-red-500" />
                                      <span>Low alignment - significant gaps</span>
                                    </li>
                                  )}
                                  {candidate.experience && (
                                    <li className="flex items-center gap-1.5">
                                      <Briefcase className="h-3 w-3 text-purple-500" />
                                      <span>Experience: {candidate.experience.slice(0, 50)}{candidate.experience.length > 50 ? '...' : ''}</span>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions - Redesigned compact layout */}
                      <div className="flex flex-col gap-3">
                        {/* Pipeline Status - Full width when visible */}
                        {selectedJobFilter !== 'all' && (
                          <div className="relative">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setShowStatusDropdown(showStatusDropdown === candidate.id ? null : candidate.id)}
                              className={`w-full px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                                pipelineStatuses.find(s => s.value === (candidateJobAssignments.find(a => a.candidateId === candidate.id && a.jobId === selectedJobFilter)?.status || 'new'))?.color
                              } text-white shadow-md`}
                            >
                              {pipelineStatuses.find(s => s.value === (candidateJobAssignments.find(a => a.candidateId === candidate.id && a.jobId === selectedJobFilter)?.status || 'new'))?.icon}
                              {pipelineStatuses.find(s => s.value === (candidateJobAssignments.find(a => a.candidateId === candidate.id && a.jobId === selectedJobFilter)?.status || 'new'))?.label}
                              <ChevronDown className="h-3.5 w-3.5" />
                            </motion.button>
                            
                            <AnimatePresence>
                              {showStatusDropdown === candidate.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  className="absolute top-full mt-2 right-0 z-50 w-44 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                                >
                                  {pipelineStatuses.map((status) => (
                                    <button
                                      key={status.value}
                                      onClick={() => {
                                        updateCandidateJobStatus(candidate.id, selectedJobFilter, status.value);
                                        addActivity({
                                          type: 'status_changed',
                                          description: `${candidate.name} moved to ${status.label}`,
                                          candidateId: candidate.id,
                                          jobId: selectedJobFilter,
                                          metadata: { newStatus: status.value }
                                        });
                                        setShowStatusDropdown(null);
                                      }}
                                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                    >
                                      <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{status.label}</span>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                        
                        {/* Quick Actions Row - Icon buttons */}
                        <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl">
                          {/* Shortlist */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleShortlist(candidate.id)}
                            className={`p-2 rounded-lg transition-all ${
                              shortlistedIds.has(candidate.id)
                                ? 'bg-pink-500 text-white shadow-md'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}
                            title={shortlistedIds.has(candidate.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                          >
                            <Heart className={`h-4 w-4 ${shortlistedIds.has(candidate.id) ? 'fill-current' : ''}`} />
                          </motion.button>
                          
                          {/* Notes */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowNotesModal(candidate.id)}
                            className={`p-2 rounded-lg transition-all relative ${
                              (candidateNotes[candidate.id]?.length || 0) > 0
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}
                            title="Notes"
                          >
                            <StickyNote className="h-4 w-4" />
                            {(candidateNotes[candidate.id]?.length || 0) > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {candidateNotes[candidate.id].length}
                              </span>
                            )}
                          </motion.button>
                          
                          {/* Tags */}
                          <div className="relative">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setShowTagsDropdown(showTagsDropdown === candidate.id ? null : candidate.id)}
                              className={`p-2 rounded-lg transition-all ${
                                (candidateTags[candidate.id]?.length || 0) > 0
                                  ? 'bg-teal-500 text-white shadow-md'
                                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}
                              title="Tags"
                            >
                              <Tag className="h-4 w-4" />
                            </motion.button>
                            
                            <AnimatePresence>
                              {showTagsDropdown === candidate.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  className="absolute top-full mt-2 right-0 z-50 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3"
                                >
                                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">Add Tags</p>
                                  <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {availableTags.map((tag) => {
                                      const isSelected = candidateTags[candidate.id]?.includes(tag.id);
                                      return (
                                        <button
                                          key={tag.id}
                                          onClick={() => {
                                            if (isSelected) {
                                              removeTagFromCandidate(candidate.id, tag.id);
                                            } else {
                                              addTagToCandidate(candidate.id, tag.id);
                                              addActivity({
                                                type: 'tag_added',
                                                description: `Tagged ${candidate.name} as "${tag.label}"`,
                                                candidateId: candidate.id,
                                                metadata: { tag: tag.label }
                                              });
                                            }
                                          }}
                                          className={`w-full px-3 py-2 flex items-center gap-2 rounded-xl transition-all ${
                                            isSelected
                                              ? 'bg-gray-100 dark:bg-gray-700'
                                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                          }`}
                                        >
                                          <span className={`w-3 h-3 rounded-full bg-${tag.color}-500`}></span>
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 text-left">{tag.label}</span>
                                          {isSelected && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          {/* Assign to Job */}
                          {jobs.length > 0 && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setShowAssignModal(candidate.id)}
                              className={`p-2 rounded-lg transition-all ${
                                getJobsForCandidate(candidate.id).length > 0
                                  ? 'bg-blue-500 text-white shadow-md'
                                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}
                              title="Assign to Job"
                            >
                              <FolderPlus className="h-4 w-4" />
                            </motion.button>
                          )}
                          
                          {/* Divider */}
                          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                          
                          {/* Delete */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteCandidate(candidate.id, candidate.name)}
                            disabled={deletingId === candidate.id}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === candidate.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </motion.button>
                        </div>
                        
                        {/* Primary Actions */}
                        <div className="flex gap-2">
                          <Link href={`/reports/${candidate.id}`} className="flex-1">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              Report
                            </motion.button>
                          </Link>
                          
                          <Link href={`/interview-analyzer?candidateId=${candidate.id}`} className="flex-1">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full px-3 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Interview
                            </motion.button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link href="/interview-analyzer">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group px-8 py-4 bg-gradient-to-r from-primary-500 via-purple-500 to-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/30 flex items-center justify-center gap-3"
            >
              <MessageSquare className="h-5 w-5" />
              Analyze Interviews
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 rounded-2xl font-bold border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-500/50 transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              <BarChart3 className="h-5 w-5" />
              View Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Pipeline Board Modal */}
      <AnimatePresence>
        {showKanbanModal && selectedJobFilter !== 'all' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setShowKanbanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden border border-white/50 dark:border-gray-800/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pipeline Board</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {jobs.find(j => j.id === selectedJobFilter)?.title || 'All Jobs'} • {displayedCandidates.length} candidates
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKanbanModal(false)}
                  className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              
              {/* Kanban Board Content */}
              <div className="p-6 h-[calc(90vh-100px)] overflow-x-auto">
                <div className="flex gap-5 h-full min-w-max">
                  {pipelineStatuses.map((status) => {
                    const candidatesInColumn = displayedCandidates.filter(c => {
                      const assignment = candidateJobAssignments.find(
                        a => a.candidateId === c.id && a.jobId === selectedJobFilter
                      );
                      return (assignment?.status || 'new') === status.value;
                    });
                    
                    return (
                      <div
                        key={status.value}
                        className={`w-80 flex-shrink-0 flex flex-col rounded-2xl transition-all h-full ${
                          dragOverColumn === status.value
                            ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/50'
                            : 'bg-gray-50 dark:bg-gray-800/50'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverColumn(status.value);
                        }}
                        onDragLeave={() => setDragOverColumn(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedCandidate) {
                            updateCandidateJobStatus(draggedCandidate, selectedJobFilter, status.value);
                            const candidate = displayedCandidates.find(c => c.id === draggedCandidate);
                            if (candidate) {
                              addActivity({
                                type: 'status_changed',
                                description: `${candidate.name} moved to ${status.label}`,
                                candidateId: draggedCandidate,
                                jobId: selectedJobFilter,
                                metadata: { newStatus: status.value }
                              });
                            }
                          }
                          setDraggedCandidate(null);
                          setDragOverColumn(null);
                        }}
                      >
                        {/* Column Header */}
                        <div className={`p-4 rounded-t-2xl ${status.color}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                              {status.icon}
                              <span className="font-semibold text-lg">{status.label}</span>
                            </div>
                            <span className="px-3 py-1.5 bg-white/20 rounded-xl text-sm font-bold text-white">
                              {candidatesInColumn.length}
                            </span>
                          </div>
                        </div>
                        
                        {/* Column Content - Scrollable */}
                        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                          {candidatesInColumn.length === 0 ? (
                            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                              <div className="text-center">
                                <GripVertical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <span>Drop candidates here</span>
                              </div>
                            </div>
                          ) : (
                            candidatesInColumn.map((candidate) => (
                              <motion.div
                                key={candidate.id}
                                draggable
                                onDragStart={() => setDraggedCandidate(candidate.id)}
                                onDragEnd={() => {
                                  setDraggedCandidate(null);
                                  setDragOverColumn(null);
                                }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className={`bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-md border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing transition-all ${
                                  draggedCandidate === candidate.id ? 'opacity-50 ring-2 ring-primary-500 shadow-xl' : 'hover:shadow-lg'
                                }`}
                              >
                                <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0 pt-1">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                      <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">
                                        {candidate.name}
                                      </h4>
                                      <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                                        candidate.score >= 75 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                        candidate.score >= 60 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                        candidate.score >= 45 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                      }`}>
                                        {candidate.score}%
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-3">
                                      {candidate.email}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                      {candidate.skills.slice(0, 4).map((skill, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-medium"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                      {candidate.skills.length > 4 && (
                                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 rounded-lg text-xs font-medium">
                                          +{candidate.skills.length - 4}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                      <button
                                        onClick={() => toggleShortlist(candidate.id)}
                                        className={`p-2 rounded-xl transition-all ${
                                          shortlistedIds.has(candidate.id)
                                            ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'
                                        }`}
                                        title="Shortlist"
                                      >
                                        <Heart className={`h-4 w-4 ${shortlistedIds.has(candidate.id) ? 'fill-current' : ''}`} />
                                      </button>
                                      <button
                                        onClick={() => setShowNotesModal(candidate.id)}
                                        className={`p-2 rounded-xl transition-all ${
                                          (candidateNotes[candidate.id]?.length || 0) > 0
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'
                                        }`}
                                        title="Notes"
                                      >
                                        <StickyNote className="h-4 w-4" />
                                      </button>
                                      <div className="flex-1" />
                                      <Link href={`/reports/${candidate.id}`}>
                                        <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-all" title="View Report">
                                          <FileText className="h-4 w-4" />
                                        </button>
                                      </Link>
                                      <Link href={`/interview-analyzer?candidateId=${candidate.id}`}>
                                        <button className="p-2 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-all" title="Interview">
                                          <MessageSquare className="h-4 w-4" />
                                        </button>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Modal */}
      <AnimatePresence>
        {showNotesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowNotesModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden border border-white/50 dark:border-gray-800/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                    <StickyNote className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Candidate Notes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {filteredResumes.find(r => r.id === showNotesModal)?.name || 'Candidate'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotesModal(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {/* Add Note Input */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add a note about this candidate..."
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-2xl text-sm resize-none focus:ring-2 focus:ring-amber-500"
                    rows={2}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (newNoteText.trim() && showNotesModal) {
                        addCandidateNote(showNotesModal, newNoteText.trim());
                        addActivity({
                          type: 'note_added',
                          description: `Added note to ${filteredResumes.find(r => r.id === showNotesModal)?.name || 'Candidate'}`,
                          candidateId: showNotesModal
                        });
                        setNewNoteText('');
                      }
                    }}
                    disabled={!newNoteText.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-2xl font-semibold shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
              
              {/* Notes List */}
              <div className="p-4 max-h-[40vh] overflow-y-auto space-y-3">
                {(candidateNotes[showNotesModal || ''] || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No notes yet. Add your first note above!</p>
                  </div>
                ) : (
                  (candidateNotes[showNotesModal || ''] || []).slice().reverse().map((note) => (
                    <div
                      key={note.id}
                      className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/50"
                    >
                      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && comparisonCandidates.length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowComparison(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto border border-white/50 dark:border-gray-800/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200/50 dark:border-gray-800/50 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <GitCompare className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compare Candidates</h2>
                    <p className="text-gray-600 dark:text-gray-400">Side-by-side comparison of {comparisonCandidates.length} candidates</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowComparison(false)}
                  className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Comparison Content */}
              <div className="p-6">
                <div className={`grid gap-6 ${comparisonCandidates.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                  {comparisonCandidates.map((candidate, idx) => (
                    <div key={candidate.id} className="space-y-4">
                      {/* Candidate Header */}
                      <div className={`p-5 rounded-2xl bg-gradient-to-br ${getScoreColor(candidate.score)} text-white shadow-lg ${getScoreGlow(candidate.score)}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold opacity-80 bg-white/20 px-2 py-1 rounded-lg">#{idx + 1}</span>
                          <span className="text-3xl font-black">{candidate.score}%</span>
                        </div>
                        <h3 className="text-xl font-bold truncate">{candidate.name}</h3>
                        <p className="text-sm opacity-80 truncate flex items-center gap-2 mt-1">
                          <Mail className="h-4 w-4" />
                          {candidate.email}
                        </p>
                      </div>

                      {/* Match Level */}
                      <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Match Level</span>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${getScoreBadge(candidate.score).color}`}>
                          {getScoreBadge(candidate.score).icon}
                          {getScoreBadge(candidate.score).label}
                        </span>
                      </div>

                      {/* Skills */}
                      <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Skills ({candidate.skills.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.skills.slice(0, 8).map((skill, skillIdx) => {
                            const isMatch = candidate.skillMatches?.includes(skill);
                            return (
                              <span
                                key={skillIdx}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                  isMatch
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })}
                          {candidate.skills.length > 8 && (
                            <span className="px-2.5 py-1 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg text-xs text-gray-500 font-semibold">
                              +{candidate.skills.length - 8}
                            </span>
                          )}
                        </div>
                        {candidate.skillMatches && candidate.skillMatches.length > 0 && (
                          <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {candidate.skillMatches.length} matching skills
                          </p>
                        )}
                      </div>

                      {/* Experience */}
                      <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Experience</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                          {candidate.experience || 'Not specified'}
                        </p>
                      </div>

                      {/* Education */}
                      <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Education</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                          {candidate.education || 'Not specified'}
                        </p>
                      </div>

                      {/* View Full Report Button */}
                      <Link href={`/reports/${candidate.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-3.5 bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all flex items-center justify-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          View Full Report
                          <ChevronRight className="h-4 w-4" />
                        </motion.button>
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Quick Winner Summary */}
                <div className="mt-8 p-6 bg-gradient-to-r from-amber-50/80 via-yellow-50/80 to-orange-50/80 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/50">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg">
                      <Crown className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Comparison Summary</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Highest Score</p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {comparisonCandidates.reduce((a, b) => a.score > b.score ? a : b).name}
                        <span className="ml-2 text-emerald-600 dark:text-emerald-400">({Math.max(...comparisonCandidates.map(c => c.score))}%)</span>
                      </p>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Most Skills</p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {comparisonCandidates.reduce((a, b) => a.skills.length > b.skills.length ? a : b).name}
                        <span className="ml-2 text-blue-600 dark:text-blue-400">({Math.max(...comparisonCandidates.map(c => c.skills.length))} skills)</span>
                      </p>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Best Skill Match</p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {comparisonCandidates.reduce((a, b) => (a.skillMatches?.length || 0) > (b.skillMatches?.length || 0) ? a : b).name}
                        <span className="ml-2 text-purple-600 dark:text-purple-400">({Math.max(...comparisonCandidates.map(c => c.skillMatches?.length || 0))} matches)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interview Questions Generator Modal */}
      <AnimatePresence>
        {showQuestionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowQuestionsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Lightbulb className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Interview Questions</h2>
                      <p className="text-white/80 text-sm">
                        Generated for: {jobs.find(j => j.id === selectedJobFilter)?.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQuestionsModal(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Questions Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                <div className="space-y-6">
                  {generatedQuestions.map((category, idx) => (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          idx === 0 ? 'bg-blue-500' :
                          idx === 1 ? 'bg-emerald-500' :
                          idx === 2 ? 'bg-amber-500' :
                          idx === 3 ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`}>
                          <HelpCircle className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {category.category}
                        </h3>
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {category.questions.length} questions
                        </span>
                      </div>
                      <div className="space-y-3">
                        {category.questions.map((question, qIdx) => (
                          <div
                            key={qIdx}
                            className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900/50 rounded-xl group hover:shadow-md transition-all"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                              {qIdx + 1}
                            </span>
                            <p className="flex-1 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                              {question}
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleCopyQuestion(question)}
                              className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                                copiedQuestion === question
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100'
                              }`}
                              title="Copy to clipboard"
                            >
                              {copiedQuestion === question ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tips Section */}
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/50">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Pro Tips</h4>
                      <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                        <li>• Use follow-up questions based on candidate responses</li>
                        <li>• Take notes during the interview for better evaluation</li>
                        <li>• Allow candidates time to think before answering</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign to Job Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAssignModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <FolderPlus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Assign to Job</h2>
                      <p className="text-white/80 text-sm">
                        {filteredResumes.find(r => r.id === showAssignModal)?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Jobs List */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {jobs.filter(j => j.status === 'open').length > 0 ? (
                  <div className="space-y-3">
                    {jobs.filter(j => j.status === 'open').map((job) => {
                      const isAssigned = candidateJobAssignments.some(
                        a => a.candidateId === showAssignModal && a.jobId === job.id
                      );
                      return (
                        <motion.button
                          key={job.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (isAssigned) {
                              unassignCandidateFromJob(showAssignModal!, job.id);
                            } else {
                              assignCandidateToJob(showAssignModal!, job.id, 0);
                            }
                          }}
                          className={`w-full p-4 rounded-2xl text-left transition-all ${
                            isAssigned
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isAssigned
                                  ? 'bg-white/20'
                                  : 'bg-blue-100 dark:bg-blue-900/30'
                              }`}>
                                <Briefcase className={`h-5 w-5 ${
                                  isAssigned ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                                }`} />
                              </div>
                              <div>
                                <p className={`font-semibold ${
                                  isAssigned ? 'text-white' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {job.title}
                                </p>
                                <p className={`text-sm ${
                                  isAssigned ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {candidateJobAssignments.filter(a => a.jobId === job.id).length} candidates
                                </p>
                              </div>
                            </div>
                            {isAssigned && (
                              <CheckCircle className="h-5 w-5 text-white" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderPlus className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No open jobs</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Create a job first to assign candidates
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAssignModal(null)}
                  className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Real-time Updates Indicator */}
      <RealtimeIndicator 
        showNotifications={true}
        onEvent={(event) => {
          // Refresh data when relevant events occur
          if (['resume_uploaded', 'candidate_scored', 'pipeline_status_changed'].includes(event.type)) {
            // Trigger refresh of screening results
            window.location.reload();
          }
        }}
      />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}
