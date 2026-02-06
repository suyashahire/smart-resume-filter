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

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
  
  // Job Description
  jobDescription: JobDescription | null;
  setJobDescription: (jd: JobDescription) => void;
  
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
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      resumes: [],
      filteredResumes: [],
      jobDescription: null,
      interviews: [],
      user: null,
      authToken: null,
      isAuthenticated: false,
      isLoading: false,
      useRealApi: false,
      error: null,
      
      // Resume actions
      addResume: (resume) => set((state) => ({ 
        resumes: [...state.resumes, resume]
      })),
      
      removeResume: (id) => set((state) => ({
        resumes: state.resumes.filter(r => r.id !== id),
        filteredResumes: state.filteredResumes.filter(r => r.id !== id)
      })),
      
      setResumes: (resumes) => set({ resumes }),
      
      setFilteredResumes: (resumes) => set({ filteredResumes: resumes }),
      
      clearAllData: () => set({
        resumes: [],
        filteredResumes: [],
        jobDescription: null,
        interviews: []
      }),
      
      // Job Description actions
      setJobDescription: (jd) => set({ jobDescription: jd }),
      
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
        }
        set({ 
          user: null, 
          authToken: null,
          isAuthenticated: false,
          resumes: [],
          filteredResumes: [],
          jobDescription: null,
          interviews: [],
          error: null
        });
      },
      
      // API Configuration
      setUseRealApi: (use) => set({ useRealApi: use }),
      
      // UI state actions
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Error handling
      setError: (error) => set({ error }),
    }),
    {
      name: 'smart-resume-filter-storage',
      partialize: (state) => ({
        user: state.user,
        authToken: state.authToken,
        isAuthenticated: state.isAuthenticated,
        useRealApi: state.useRealApi,
      }),
    }
  )
);
