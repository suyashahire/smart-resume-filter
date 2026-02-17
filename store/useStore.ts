import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Resume {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: string;
  experience: string;
  score: number;
  file?: File;
  skillMatches?: string[];
}

// Candidate notes
export interface CandidateNote {
  id: string;
  candidateId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

// Candidate tags
export interface CandidateTag {
  id: string;
  label: string;
  color: string; // Tailwind color class
}

// Activity tracking
export interface Activity {
  id: string;
  type: 'candidate_added' | 'candidate_deleted' | 'status_changed' | 'note_added' | 'tag_added' | 'shortlisted' | 'interview_scheduled' | 'job_created' | 'screening_completed';
  description: string;
  candidateId?: string;
  jobId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Interview {
  id: string;
  candidateId: string;
  transcript: string;
  sentimentScore: number;
  confidenceScore: number;
  file?: File;
}

export interface JobDescription {
  id?: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experience: string;
}

// Extended Job interface for multi-job support
export interface Job {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experience: string;
  status: 'open' | 'closed' | 'draft';
  createdAt: string;
  candidateCount: number;
}

// Candidate-Job assignment
export interface CandidateJobAssignment {
  candidateId: string;
  jobId: string;
  score: number;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';
  assignedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  account_status?: string;
  company?: string;
}

// Candidate Portal Interfaces
export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company?: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired' | 'withdrawn';
  appliedAt: string;
  score?: number;
  scoreVisible?: boolean;
  feedback?: string;
  feedbackAt?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sent_at: string;
  read_at?: string | null;
  is_mine?: boolean;
}

export interface ChatConversation {
  id: string;
  other_user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  // Candidate view fields
  hr_user_id?: string;
  hr_user_name?: string;
  candidate_user_id?: string;
  // HR view fields
  candidate_user_name?: string;
  candidate_email?: string;
  // Common fields
  job_id?: string;
  job_title?: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count?: number;
  unread_count_hr?: number;
  unread_count_candidate?: number;
  created_at?: string;
}

interface StoreState {
  // Resume data
  resumes: Resume[];
  filteredResumes: Resume[];
  addResume: (resume: Resume) => void;
  removeResume: (id: string) => void;
  setResumes: (resumes: Resume[]) => void;
  setFilteredResumes: (resumes: Resume[]) => void;
  clearAllData: () => void;

  // Shortlist
  shortlistedIds: Set<string>;
  toggleShortlist: (id: string) => void;
  isShortlisted: (id: string) => boolean;
  clearShortlist: () => void;

  // Job Description (legacy - single job)
  jobDescription: JobDescription | null;
  setJobDescription: (jd: JobDescription) => void;

  // Multi-Job Support
  jobs: Job[];
  currentJobId: string | null;
  candidateJobAssignments: CandidateJobAssignment[];
  addJob: (job: Job) => void;
  updateJob: (id: string, job: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  setJobs: (jobs: Job[]) => void;
  setCurrentJobId: (id: string | null) => void;
  assignCandidateToJob: (candidateId: string, jobId: string, score?: number) => void;
  unassignCandidateFromJob: (candidateId: string, jobId: string) => void;
  updateCandidateJobStatus: (candidateId: string, jobId: string, status: CandidateJobAssignment['status']) => void;
  getCandidatesForJob: (jobId: string) => CandidateJobAssignment[];
  getJobsForCandidate: (candidateId: string) => CandidateJobAssignment[];
  getCurrentJob: () => Job | null;

  // Interview data
  interviews: Interview[];
  addInterview: (interview: Interview) => void;
  getInterviewByCandidate: (candidateId: string) => Interview | undefined;

  // Authentication
  user: User | null;
  authToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
  logout: () => void;

  // API Configuration
  useRealApi: boolean;
  setUseRealApi: (use: boolean) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;

  // Hydration tracking (for SSR/client reconciliation)
  isHydrated: boolean;
  setIsHydrated: (hydrated: boolean) => void;

  // Session-level data fetch tracking (reset on logout)
  hasFetchedSessionData: boolean;
  setHasFetchedSessionData: (fetched: boolean) => void;

  // Candidate Portal state
  candidateApplications: CandidateApplication[];
  setCandidateApplications: (apps: CandidateApplication[]) => void;

  // Messaging state
  conversations: ChatConversation[];
  currentConversationMessages: ChatMessage[];
  setConversations: (convs: ChatConversation[]) => void;
  setCurrentConversationMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;

  // Candidate Notes & Tags
  candidateNotes: Record<string, CandidateNote[]>;
  candidateTags: Record<string, string[]>;
  availableTags: CandidateTag[];
  addCandidateNote: (candidateId: string, content: string) => void;
  updateCandidateNote: (candidateId: string, noteId: string, content: string) => void;
  deleteCandidateNote: (candidateId: string, noteId: string) => void;
  addTagToCandidate: (candidateId: string, tagId: string) => void;
  removeTagFromCandidate: (candidateId: string, tagId: string) => void;
  createTag: (label: string, color: string) => CandidateTag;
  deleteTag: (tagId: string) => void;

  // Activity Feed
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  getActivitiesForCandidate: (candidateId: string) => Activity[];
  getRecentActivities: (limit?: number) => Activity[];
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      resumes: [],
      filteredResumes: [],
      jobDescription: null,
      interviews: [],
      shortlistedIds: new Set<string>(),
      jobs: [],
      currentJobId: null,
      candidateJobAssignments: [],
      user: null,
      authToken: null,
      isAuthenticated: false,
      isLoading: false,
      useRealApi: false,
      error: null,
      candidateNotes: {},
      candidateTags: {},
      availableTags: [
        { id: 'tag_1', label: 'High Priority', color: 'red' },
        { id: 'tag_2', label: 'Strong Fit', color: 'green' },
        { id: 'tag_3', label: 'Needs Review', color: 'yellow' },
        { id: 'tag_4', label: 'Referral', color: 'blue' },
        { id: 'tag_5', label: 'Follow Up', color: 'purple' },
      ],
      activities: [],
      isHydrated: false,
      hasFetchedSessionData: false,
      candidateApplications: [],
      conversations: [],
      currentConversationMessages: [],

      // Resume actions
      addResume: (resume) => set((state) => {
        // Prevent duplicates by checking if resume with same ID already exists
        const exists = state.resumes.some(r => r.id === resume.id);
        if (exists) {
          // Update existing resume instead of adding duplicate
          return {
            resumes: state.resumes.map(r => r.id === resume.id ? resume : r)
          };
        }
        return {
          resumes: [...state.resumes, resume]
        };
      }),

      removeResume: (id) => set((state) => ({
        resumes: state.resumes.filter(r => r.id !== id),
        filteredResumes: state.filteredResumes.filter(r => r.id !== id)
      })),

      setResumes: (resumes) => {
        // Efficient O(n) deduplication using Map
        const seen = new Map<string, Resume>();
        resumes.forEach(r => seen.set(r.id, r));
        return set({ resumes: Array.from(seen.values()) });
      },

      setFilteredResumes: (resumes) => {
        // Efficient O(n) deduplication using Map
        const seen = new Map<string, Resume>();
        resumes.forEach(r => seen.set(r.id, r));
        return set({ filteredResumes: Array.from(seen.values()) });
      },

      clearAllData: () => set({
        resumes: [],
        filteredResumes: [],
        jobDescription: null,
        interviews: [],
        shortlistedIds: new Set<string>()
      }),

      // Shortlist actions
      toggleShortlist: (id) => set((state) => {
        const newSet = new Set(state.shortlistedIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { shortlistedIds: newSet };
      }),

      isShortlisted: (id) => {
        return get().shortlistedIds.has(id);
      },

      clearShortlist: () => set({ shortlistedIds: new Set<string>() }),

      // Job Description actions (legacy)
      setJobDescription: (jd) => set({ jobDescription: jd }),

      // Multi-Job actions
      addJob: (job) => set((state) => ({
        jobs: [...state.jobs, job]
      })),

      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map(j => j.id === id ? { ...j, ...updates } : j)
      })),

      deleteJob: (id) => set((state) => ({
        jobs: state.jobs.filter(j => j.id !== id),
        candidateJobAssignments: state.candidateJobAssignments.filter(a => a.jobId !== id),
        currentJobId: state.currentJobId === id ? null : state.currentJobId
      })),

      setJobs: (jobs) => set({ jobs }),

      setCurrentJobId: (id) => set({ currentJobId: id }),

      assignCandidateToJob: (candidateId, jobId, score = 0) => set((state) => {
        // Check if already assigned
        const exists = state.candidateJobAssignments.some(
          a => a.candidateId === candidateId && a.jobId === jobId
        );
        if (exists) return state;

        const assignment: CandidateJobAssignment = {
          candidateId,
          jobId,
          score,
          status: 'new',
          assignedAt: new Date().toISOString()
        };

        // Update job candidate count
        const updatedJobs = state.jobs.map(j =>
          j.id === jobId ? { ...j, candidateCount: j.candidateCount + 1 } : j
        );

        return {
          candidateJobAssignments: [...state.candidateJobAssignments, assignment],
          jobs: updatedJobs
        };
      }),

      unassignCandidateFromJob: (candidateId, jobId) => set((state) => {
        const updatedJobs = state.jobs.map(j =>
          j.id === jobId ? { ...j, candidateCount: Math.max(0, j.candidateCount - 1) } : j
        );

        return {
          candidateJobAssignments: state.candidateJobAssignments.filter(
            a => !(a.candidateId === candidateId && a.jobId === jobId)
          ),
          jobs: updatedJobs
        };
      }),

      updateCandidateJobStatus: (candidateId, jobId, status) => set((state) => ({
        candidateJobAssignments: state.candidateJobAssignments.map(a =>
          a.candidateId === candidateId && a.jobId === jobId
            ? { ...a, status }
            : a
        )
      })),

      getCandidatesForJob: (jobId) => {
        return get().candidateJobAssignments.filter(a => a.jobId === jobId);
      },

      getJobsForCandidate: (candidateId) => {
        return get().candidateJobAssignments.filter(a => a.candidateId === candidateId);
      },

      getCurrentJob: () => {
        const { jobs, currentJobId } = get();
        return jobs.find(j => j.id === currentJobId) || null;
      },

      // Interview actions
      addInterview: (interview) => set((state) => ({
        interviews: [...state.interviews, interview]
      })),

      getInterviewByCandidate: (candidateId) => {
        return get().interviews.find(i => i.candidateId === candidateId);
      },

      // Authentication actions
      setUser: (user) => set({ user }),

      setAuthToken: (token) => {
        set({ authToken: token });
        // Also store in localStorage for API client
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('auth_token', token);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      },

      setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),

      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          // Also clear the persisted zustand storage to prevent stale data on re-login
          localStorage.removeItem('hireq-storage');
        }
        set({
          user: null,
          authToken: null,
          isAuthenticated: false,
          resumes: [],
          filteredResumes: [],
          jobDescription: null,
          interviews: [],
          shortlistedIds: new Set<string>(),
          jobs: [],
          currentJobId: null,
          candidateJobAssignments: [],
          error: null,
          candidateNotes: {},
          candidateTags: {},
          activities: [],
          hasFetchedSessionData: false
        });
      },

      // API Configuration
      setUseRealApi: (use) => set({ useRealApi: use }),

      // UI state actions
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Error handling
      setError: (error) => set({ error }),

      // Hydration tracking
      setIsHydrated: (hydrated) => set({ isHydrated: hydrated }),

      // Session-level data fetch tracking
      setHasFetchedSessionData: (fetched) => set({ hasFetchedSessionData: fetched }),

      // Candidate Portal actions
      setCandidateApplications: (apps) => set({ candidateApplications: apps }),

      // Messaging actions
      setConversations: (convs) => set({ conversations: convs }),
      setCurrentConversationMessages: (msgs) => set({ currentConversationMessages: msgs }),
      addMessage: (msg) => set((state) => ({
        currentConversationMessages: [...state.currentConversationMessages, msg]
      })),

      // Candidate Notes actions
      addCandidateNote: (candidateId, content) => set((state) => {
        const note: CandidateNote = {
          id: `note_${Date.now()}`,
          candidateId,
          content,
          createdAt: new Date().toISOString()
        };
        const existingNotes = state.candidateNotes[candidateId] || [];
        return {
          candidateNotes: {
            ...state.candidateNotes,
            [candidateId]: [...existingNotes, note]
          }
        };
      }),

      updateCandidateNote: (candidateId, noteId, content) => set((state) => {
        const existingNotes = state.candidateNotes[candidateId] || [];
        return {
          candidateNotes: {
            ...state.candidateNotes,
            [candidateId]: existingNotes.map(n =>
              n.id === noteId ? { ...n, content, updatedAt: new Date().toISOString() } : n
            )
          }
        };
      }),

      deleteCandidateNote: (candidateId, noteId) => set((state) => {
        const existingNotes = state.candidateNotes[candidateId] || [];
        return {
          candidateNotes: {
            ...state.candidateNotes,
            [candidateId]: existingNotes.filter(n => n.id !== noteId)
          }
        };
      }),

      // Candidate Tags actions
      addTagToCandidate: (candidateId, tagId) => set((state) => {
        const existingTags = state.candidateTags[candidateId] || [];
        if (existingTags.includes(tagId)) return state;
        return {
          candidateTags: {
            ...state.candidateTags,
            [candidateId]: [...existingTags, tagId]
          }
        };
      }),

      removeTagFromCandidate: (candidateId, tagId) => set((state) => {
        const existingTags = state.candidateTags[candidateId] || [];
        return {
          candidateTags: {
            ...state.candidateTags,
            [candidateId]: existingTags.filter(t => t !== tagId)
          }
        };
      }),

      createTag: (label, color) => {
        const newTag: CandidateTag = {
          id: `tag_${Date.now()}`,
          label,
          color
        };
        set((state) => ({
          availableTags: [...state.availableTags, newTag]
        }));
        return newTag;
      },

      deleteTag: (tagId) => set((state) => ({
        availableTags: state.availableTags.filter(t => t.id !== tagId),
        // Also remove from all candidates
        candidateTags: Object.fromEntries(
          Object.entries(state.candidateTags).map(([candidateId, tags]) => [
            candidateId,
            tags.filter(t => t !== tagId)
          ])
        )
      })),

      // Activity Feed actions
      addActivity: (activity) => set((state) => ({
        activities: [
          {
            ...activity,
            id: `activity_${Date.now()}`,
            timestamp: new Date().toISOString()
          },
          ...state.activities
        ].slice(0, 500) // Keep last 500 activities
      })),

      getActivitiesForCandidate: (candidateId) => {
        return get().activities.filter(a => a.candidateId === candidateId);
      },

      getRecentActivities: (limit = 20) => {
        return get().activities.slice(0, limit);
      },
    }),
    {
      name: 'hireq-storage',
      onRehydrateStorage: () => (state) => {
        // Mark the store as hydrated when rehydration is complete
        state?.setIsHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        authToken: state.authToken,
        isAuthenticated: state.isAuthenticated,
        useRealApi: state.useRealApi,
        shortlistedIds: Array.from(state.shortlistedIds),
        // Persist candidate data
        resumes: state.resumes,
        filteredResumes: state.filteredResumes,
        jobDescription: state.jobDescription,
        interviews: state.interviews,
        // Multi-job data
        jobs: state.jobs,
        currentJobId: state.currentJobId,
        candidateJobAssignments: state.candidateJobAssignments,
        // Notes, Tags & Activities
        candidateNotes: state.candidateNotes,
        candidateTags: state.candidateTags,
        availableTags: state.availableTags,
        activities: state.activities,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        // Convert Array back to Set when loading
        shortlistedIds: new Set(persistedState?.shortlistedIds || []),
        // Ensure arrays are initialized
        jobs: persistedState?.jobs || [],
        candidateJobAssignments: persistedState?.candidateJobAssignments || [],
        // Ensure objects are initialized
        candidateNotes: persistedState?.candidateNotes || {},
        candidateTags: persistedState?.candidateTags || {},
        availableTags: persistedState?.availableTags || currentState.availableTags,
        activities: persistedState?.activities || [],
      }),
    }
  )
);
