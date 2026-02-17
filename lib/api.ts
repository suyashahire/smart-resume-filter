/**
 * API Client for HireQ
 * 
 * This module handles all communication with the backend API.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Token storage
let authToken: string | null = null;

/**
 * Set the authentication token
 */
export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Get the authentication token
 */
export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add auth token if available
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Add content-type for JSON requests
  if (options.body && typeof options.body === 'string') {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text);
}

// ==================== Authentication ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    account_status?: string;
    created_at: string;
    last_login: string | null;
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/login/json', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(response.access_token);
  return response;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: 'hr_manager' | 'candidate' = 'hr_manager'
): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });

  // Only set token if account is approved (candidates get tokens immediately)
  if (response.access_token) {
    setAuthToken(response.access_token);
  }
  return response;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    setAuthToken(null);
  }
}

export async function getCurrentUser(): Promise<AuthResponse['user']> {
  return apiRequest('/auth/me');
}

// ==================== Resumes ====================

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: string;
  experience: string;
  summary?: string;
  linkedin?: string;
  github?: string;
  years_of_experience?: number;
}

export interface ResumeResponse {
  id: string;
  file_name: string;
  is_parsed: boolean;
  parsed_data: ParsedResumeData;
  created_at: string;
}

export async function uploadResume(file: File): Promise<ResumeResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/resumes/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function uploadMultipleResumes(files: File[]): Promise<ResumeResponse[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/resumes/upload/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function getResumes(): Promise<ResumeResponse[]> {
  return apiRequest('/resumes');
}

export async function getResume(id: string): Promise<ResumeResponse> {
  return apiRequest(`/resumes/${id}`);
}

export async function deleteResume(id: string): Promise<void> {
  await apiRequest(`/resumes/${id}`, { method: 'DELETE' });
}

export async function downloadResume(id: string): Promise<Blob> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/resumes/${id}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download resume');
  }

  return response.blob();
}

// ==================== Job Descriptions ====================

export interface JobDescriptionCreate {
  title: string;
  description: string;
  experience_required?: string;
  education_required?: string;
  location?: string;
  salary_range?: string;
  job_type?: string;
}

export interface JobDescriptionResponse {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_required: string;
  education_required: string;
  location?: string;
  salary_range?: string;
  job_type: string;
  is_active: boolean;
  candidates_screened: number;
  created_at: string;
}

export interface ResumeWithScore {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: string;
  experience: string;
  score: number;
  skill_matches: string[];
}

export async function createJobDescription(data: JobDescriptionCreate): Promise<JobDescriptionResponse> {
  return apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getJobDescriptions(): Promise<JobDescriptionResponse[]> {
  return apiRequest('/jobs', { cache: 'no-store' });
}

export async function getJobDescription(id: string): Promise<JobDescriptionResponse> {
  return apiRequest(`/jobs/${id}`);
}

export async function updateJobDescription(id: string, data: Partial<JobDescriptionCreate>): Promise<JobDescriptionResponse> {
  return apiRequest(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteJobDescription(id: string): Promise<void> {
  await apiRequest(`/jobs/${id}`, { method: 'DELETE' });
}

export async function screenCandidates(jobId: string, resumeIds?: string[]): Promise<ResumeWithScore[]> {
  return apiRequest(`/jobs/${jobId}/screen`, {
    method: 'POST',
    body: JSON.stringify({ resume_ids: resumeIds || [] }),
  });
}

export async function getScreeningResults(jobId: string): Promise<ResumeWithScore[]> {
  return apiRequest(`/jobs/${jobId}/results`);
}

// ==================== Interviews ====================

export interface SentimentAnalysis {
  overall_sentiment: string;
  sentiment_score: number;
  confidence_score: number;
  positive_phrases: string[];
  negative_phrases: string[];
  key_topics: string[];
  clarity_score: number;
  enthusiasm_score: number;
  professionalism_score: number;
}

export interface InterviewResponse {
  id: string;
  resume_id: string;
  file_name: string;
  transcript?: string;
  analysis: SentimentAnalysis;
  is_transcribed: boolean;
  is_analyzed: boolean;
  created_at: string;
}

export async function uploadInterview(resumeId: string, file: File): Promise<InterviewResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/interviews/upload?resume_id=${resumeId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function transcribeInterview(interviewId: string): Promise<InterviewResponse> {
  return apiRequest(`/interviews/${interviewId}/transcribe`, { method: 'POST' });
}

export async function analyzeInterview(interviewId: string): Promise<InterviewResponse> {
  return apiRequest(`/interviews/${interviewId}/analyze`, { method: 'POST' });
}

export async function processInterview(interviewId: string): Promise<InterviewResponse> {
  return apiRequest(`/interviews/${interviewId}/process`, { method: 'POST' });
}

export async function getInterviews(): Promise<InterviewResponse[]> {
  return apiRequest('/interviews');
}

export async function getInterview(id: string): Promise<InterviewResponse> {
  return apiRequest(`/interviews/${id}`);
}

export async function getInterviewByResume(resumeId: string): Promise<InterviewResponse> {
  return apiRequest(`/interviews/resume/${resumeId}`);
}

// ==================== Reports ====================

export interface CandidateReport {
  candidate_id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: string;
  experience: string;
  resume_score: number;
  sentiment_score?: number;
  confidence_score?: number;
  final_score: number;
  recommendation: string;
  skill_matches: string[];
  transcript?: string;
  job_title: string;
  has_interview: boolean;
  generated_at: string;
}

export interface DashboardStats {
  total_resumes: number;
  total_screened: number;
  total_interviews: number;
  average_score: number;
  excellent_matches: number;
  good_matches: number;
  fair_matches: number;
  low_matches: number;
  top_candidates: Array<{
    id: string;
    name: string;
    email: string;
    score: number;
  }>;
  skills_distribution: Array<{
    skill: string;
    count: number;
  }>;
  score_distribution: Array<{
    range: string;
    count: number;
  }>;
}

export async function getCandidateReport(resumeId: string, jobId?: string): Promise<CandidateReport> {
  const query = jobId ? `?job_id=${jobId}` : '';
  return apiRequest(`/reports/${resumeId}${query}`);
}

export async function downloadReportPdf(resumeId: string, jobId?: string): Promise<Blob> {
  const token = getAuthToken();
  const query = jobId ? `?job_id=${jobId}` : '';

  const response = await fetch(`${API_BASE_URL}/reports/${resumeId}/pdf${query}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }

  return response.blob();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest('/reports/dashboard/stats');
}

export async function cleanupOrphanedScreeningResults(): Promise<{ message: string; deleted_count: number }> {
  return apiRequest('/reports/cleanup/orphaned-screening-results', {
    method: 'DELETE',
  });
}

// ==================== Health Check ====================

export async function healthCheck(): Promise<{ status: string }> {
  return apiRequest('/health');
}

// ==================== Profile Management ====================

export async function updateProfile(data: { name?: string; email?: string }): Promise<{ message: string }> {
  return apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function deleteAccount(): Promise<{ message: string }> {
  return apiRequest('/auth/account', {
    method: 'DELETE',
  });
}

// ==================== Candidate Portal ====================

export interface CandidateApplication {
  id: string;
  candidate_id: string;
  job_id: string;
  job_title?: string;
  company?: string;
  resume_id?: string;
  status: string;
  status_history: Array<{
    from_status?: string;
    to_status: string;
    changed_at: string;
    note?: string;
  }>;
  screening_result_id?: string;
  applied_at: string;
  updated_at: string;
  score?: number;
  score_visible?: boolean;
  feedback?: string;
  feedback_at?: string;
}

export interface CandidateApplicationList {
  applications: CandidateApplication[];
  total: number;
}

export async function getOpenJobs(): Promise<JobDescriptionResponse[]> {
  return apiRequest('/candidate/jobs', { cache: 'no-store' });
}

export async function getJobDetail(id: string): Promise<JobDescriptionResponse> {
  return apiRequest(`/candidate/jobs/${id}`);
}

export async function applyToJob(jobId: string, resumeId?: string): Promise<CandidateApplication> {
  return apiRequest(`/candidate/jobs/${jobId}/apply`, {
    method: 'POST',
    body: JSON.stringify({ resume_id: resumeId }),
  });
}

export async function getCandidateApplications(): Promise<CandidateApplicationList> {
  return apiRequest('/candidate/applications');
}

export async function getApplicationDetail(id: string): Promise<CandidateApplication> {
  return apiRequest(`/candidate/applications/${id}`);
}

export async function withdrawApplication(id: string): Promise<{ message: string }> {
  return apiRequest(`/candidate/applications/${id}/withdraw`, {
    method: 'POST',
  });
}

export async function deleteApplication(id: string): Promise<{ message: string }> {
  return apiRequest(`/candidate/applications/${id}`, {
    method: 'DELETE',
  });
}

export async function getCandidateResume(): Promise<any> {
  return apiRequest('/candidate/resume');
}

export async function uploadCandidateResume(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/candidate/resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function getCandidateProfile(): Promise<any> {
  return apiRequest('/candidate/profile');
}

// ==================== Messaging ====================

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sent_at: string;
  read_at?: string;
  is_mine: boolean;
}

export interface ChatConversation {
  id: string;
  other_user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  job_id?: string;
  job_title?: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count: number;
  created_at: string;
}

export async function getConversations(): Promise<{ conversations: ChatConversation[]; total: number }> {
  return apiRequest('/messages/conversations');
}

export async function getConversationMessages(
  conversationId: string
): Promise<{ messages: ChatMessage[]; conversation_id: string; total: number }> {
  return apiRequest(`/messages/conversations/${conversationId}`);
}

export async function sendMessage(
  receiverId: string,
  content: string,
  jobId?: string
): Promise<ChatMessage> {
  return apiRequest('/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      receiver_id: receiverId,
      content,
      job_id: jobId,
    }),
  });
}

export async function markMessagesAsRead(conversationId: string): Promise<{ message: string }> {
  return apiRequest(`/messages/read/${conversationId}`, {
    method: 'POST',
  });
}

export async function getUnreadCount(): Promise<{ unread_count: number }> {
  return apiRequest('/messages/unread');
}

// ==================== Admin ====================

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  account_status: string;
  rejection_reason?: string;
  created_at: string;
  last_login?: string;
}

export async function getAllUsers(
  filters?: { role?: string; account_status?: string; search?: string }
): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.account_status) params.append('account_status', filters.account_status);
  if (filters?.search) params.append('search', filters.search);

  const query = params.toString();
  return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
}

export async function getPendingUsers(): Promise<AdminUser[]> {
  return apiRequest('/admin/users/pending');
}

export async function approveUser(userId: string): Promise<{ message: string }> {
  return apiRequest(`/admin/users/${userId}/approve`, {
    method: 'POST',
  });
}

export async function rejectUser(userId: string, reason: string): Promise<{ message: string }> {
  return apiRequest(`/admin/users/${userId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function getAdminStats(): Promise<{
  total_users: number;
  pending_approval: number;
  active_users: number;
  by_role: { hr_managers: number; candidates: number; admins: number };
}> {
  return apiRequest('/admin/stats');
}

// ==================== HR Feedback ====================

export async function sendCandidateFeedback(
  screeningId: string,
  feedback: string,
  showScore: boolean = true
): Promise<{ message: string }> {
  return apiRequest(`/reports/screening/${screeningId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ feedback, show_score: showScore }),
  });
}

// ==================== Resume Insights ====================

export async function getResumeInsights(resumeId: string): Promise<{
  match_score: number;
  keyword_coverage: number;
  formatting_health: number;
}> {
  return apiRequest(`/insights/${resumeId}`);
}

