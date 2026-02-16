/**
 * API Client wrapper that provides both mock and real API functionality.
 * 
 * This allows the frontend to work with both mock data (for development)
 * and real backend API (for production).
 */

import * as mockApi from './mockApi';
import * as realApi from './api';
import { Resume, Interview, JobDescription } from '@/store/useStore';

// Configuration
const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';

/**
 * Parse a resume file
 */
export async function parseResume(file: File): Promise<Partial<Resume>> {
  if (USE_REAL_API) {
    try {
      const response = await realApi.uploadResume(file);
      return {
        id: response.id,
        name: response.parsed_data.name,
        email: response.parsed_data.email,
        phone: response.parsed_data.phone,
        skills: response.parsed_data.skills,
        education: response.parsed_data.education,
        experience: response.parsed_data.experience,
        score: 0,
      };
    } catch (error) {
      console.error('Real API failed, falling back to mock:', error);
    }
  }
  
  return mockApi.parseResume(file);
}

/**
 * Parse job description to extract keywords
 */
export async function parseJobDescription(description: string): Promise<string[]> {
  if (USE_REAL_API) {
    try {
      const response = await realApi.createJobDescription({
        title: 'Temporary',
        description,
      });
      return response.required_skills;
    } catch (error) {
      console.error('Real API failed, falling back to mock:', error);
    }
  }
  
  return mockApi.parseJobDescription(description);
}

/**
 * Screen candidates against job description
 */
export async function screenCandidates(
  resumes: Resume[],
  jobDescription: JobDescription
): Promise<Resume[]> {
  if (USE_REAL_API) {
    try {
      // First create job description
      const job = await realApi.createJobDescription({
        title: jobDescription.title,
        description: jobDescription.description,
        experience_required: jobDescription.experience,
      });
      
      // Then screen candidates
      const results = await realApi.screenCandidates(job.id);
      
      return results.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        skills: r.skills,
        education: r.education,
        experience: r.experience,
        score: r.score,
      }));
    } catch (error) {
      console.error('Real API failed, falling back to mock:', error);
    }
  }
  
  return mockApi.screenCandidates(resumes, jobDescription);
}

/**
 * Transcribe interview audio
 */
export async function transcribeInterview(file: File): Promise<string> {
  if (USE_REAL_API) {
    try {
      // This would need a resume ID in real implementation
      // For now, fall back to mock
      console.log('Interview transcription requires resume context');
    } catch (error) {
      console.error('Real API failed, falling back to mock:', error);
    }
  }
  
  return mockApi.transcribeInterview(file);
}

/**
 * Analyze interview transcript
 */
export async function analyzeInterview(transcript: string): Promise<{
  sentimentScore: number;
  confidenceScore: number;
}> {
  if (USE_REAL_API) {
    // Real API analysis is done server-side
    // This is just for compatibility
  }
  
  return mockApi.analyzeInterview(transcript);
}

/**
 * Generate candidate report
 */
export async function generateReport(
  candidateId: string,
  resume: Resume,
  interview?: Interview
) {
  if (USE_REAL_API) {
    try {
      const report = await realApi.getCandidateReport(candidateId);
      return {
        candidateId,
        resume,
        interview,
        finalScore: report.final_score,
        recommendation: report.recommendation,
        generatedAt: report.generated_at,
      };
    } catch (error) {
      console.error('Real API failed, falling back to mock:', error);
    }
  }
  
  return mockApi.generateReport(candidateId, resume, interview);
}

/**
 * Login user
 */
export async function login(email: string, password: string) {
  if (USE_REAL_API) {
    try {
      const response = await realApi.login(email, password);
      return {
        success: true,
        user: response.user,
        token: response.access_token,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }
  
  // Backend required for authentication
  return {
    success: false,
    error: 'Backend server is offline. Please try again later.',
  };
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  if (USE_REAL_API) {
    try {
      return await realApi.getDashboardStats();
    } catch (error) {
      console.error('Real API failed:', error);
    }
  }
  
  // Return empty stats for mock
  return {
    total_resumes: 0,
    total_screened: 0,
    total_interviews: 0,
    average_score: 0,
    excellent_matches: 0,
    good_matches: 0,
    fair_matches: 0,
    low_matches: 0,
    top_candidates: [],
    skills_distribution: [],
    score_distribution: [],
  };
}

/**
 * Cleanup orphaned screening results (from deleted resumes)
 */
export async function cleanupOrphanedScreeningResults() {
  if (USE_REAL_API) {
    try {
      return await realApi.cleanupOrphanedScreeningResults();
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }
  
  return { message: 'Cleanup not needed in mock mode', deleted_count: 0 };
}

/**
 * Download PDF report
 */
export async function downloadPdfReport(resumeId: string, jobId?: string) {
  if (USE_REAL_API) {
    try {
      const blob = await realApi.downloadReportPdf(resumeId, jobId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidate_report_${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('PDF download failed:', error);
      return false;
    }
  }
  
  // Mock - just show alert
  alert('PDF export is available when connected to the backend API');
  return false;
}

// Export configuration
export const isUsingRealApi = USE_REAL_API;

