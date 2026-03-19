import { authFetch } from './api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export interface InterviewQuestion {
  id: string;
  question: string;
  ideal_answer?: string;
  vacancy_snippet?: string;  // Text from vacancy this question relates to
  is_modified?: boolean;
  change_status?: 'new' | 'updated' | 'unchanged';
}

export interface Interview {
  intro: string;
  knockout_questions: InterviewQuestion[];
  knockout_failed_action: string;
  qualification_questions: InterviewQuestion[];
  final_action: string;
  approved_ids: string[];
}

export interface SSEEvent {
  type: 'status' | 'thinking' | 'complete' | 'error';
  status?: 'thinking' | 'tool_call';
  message?: string;
  content?: string;
  interview?: Interview;
  session_id?: string;
}

export type StatusCallback = (event: SSEEvent) => void;

export async function generateInterview(
  vacancyId: string,
  onEvent: StatusCallback,
  sessionId?: string
): Promise<{ interview: Interview; sessionId: string; message: string }> {
  const response = await authFetch(`${BACKEND_URL}/interview/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vacancy_id: vacancyId,
      session_id: sessionId
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate interview');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  let interview: Interview | null = null;
  let finalSessionId = sessionId || '';
  let finalMessage = '';

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const event: SSEEvent = JSON.parse(data);
          onEvent(event);

          if (event.type === 'complete') {
            interview = event.interview || null;
            finalSessionId = event.session_id || finalSessionId;
            finalMessage = event.message || '';
          }
        } catch (e) {
          console.error('Failed to parse SSE event:', e);
        }
      }
    }
  }

  if (!interview) throw new Error('No interview generated');
  return { interview, sessionId: finalSessionId, message: finalMessage };
}

/**
 * Reorder questions instantly (no agent call).
 * Use for drag-and-drop reordering.
 */
export async function reorderQuestions(
  sessionId: string,
  knockoutOrder?: string[],
  qualificationOrder?: string[]
): Promise<Interview> {
  const response = await authFetch(`${BACKEND_URL}/interview/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      knockout_order: knockoutOrder,
      qualification_order: qualificationOrder,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to reorder questions');
  }

  const data = await response.json();
  return data.interview;
}

/**
 * Add a question instantly (no agent call).
 * Use for manually adding knockout or qualification questions.
 * New questions are appended to the end of the list.
 */
export async function addQuestion(
  sessionId: string,
  questionType: 'knockout' | 'qualification',
  question: string,
  idealAnswer?: string
): Promise<{ added: string; question: InterviewQuestion; interview: Interview }> {
  const response = await authFetch(`${BACKEND_URL}/interview/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question_type: questionType,
      question,
      ideal_answer: idealAnswer,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add question');
  }

  const data = await response.json();
  return {
    added: data.added,
    question: data.question,
    interview: data.interview,
  };
}

/**
 * Delete a question instantly (no agent call).
 * Use for removing knockout or qualification questions.
 */
export async function deleteQuestion(
  sessionId: string,
  questionId: string
): Promise<{ deleted: string; interview: Interview }> {
  const response = await authFetch(`${BACKEND_URL}/interview/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question_id: questionId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete question');
  }

  const data = await response.json();
  return {
    deleted: data.deleted,
    interview: data.interview,
  };
}

export async function sendFeedback(
  sessionId: string,
  userMessage: string,
  onEvent: StatusCallback
): Promise<{ interview: Interview; message: string }> {
  const requestId = `sf-${Date.now()}`;
  console.log(`[sendFeedback ${requestId}] Starting request for session: ${sessionId} at ${new Date().toISOString()}`);
  
  const response = await authFetch(`${BACKEND_URL}/interview/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message: userMessage }),
  });

  if (!response.ok) throw new Error('Failed to send feedback');

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let interview: Interview | null = null;
  let responseMessage = '';
  let buffer = ''; // Buffer for partial lines across chunks

  if (!reader) throw new Error('No response body');

  let chunkCount = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log(`[sendFeedback ${requestId}] Stream ended at ${new Date().toISOString()}. Chunks received: ${chunkCount}, Interview received: ${!!interview}, Buffer remaining: "${buffer}"`);
      break;
    }

    chunkCount++;
    // Append new chunk to buffer
    const chunkText = decoder.decode(value, { stream: true });
    console.log(`[sendFeedback ${requestId}] Chunk ${chunkCount} raw:`, JSON.stringify(chunkText));
    buffer += chunkText;
    
    // Process complete lines from the buffer
    const lines = buffer.split('\n');
    // Keep the last (potentially incomplete) line in the buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // Skip empty lines
      if (!trimmedLine.startsWith('data: ')) {
        console.log(`[sendFeedback ${requestId}] Non-data line:`, JSON.stringify(trimmedLine));
        continue;
      }
      
      const data = trimmedLine.slice(6);
      if (data === '[DONE]') {
        console.log(`[sendFeedback ${requestId}] Received [DONE]`);
        continue;
      }

      try {
        const event: SSEEvent = JSON.parse(data);
        console.log(`[sendFeedback ${requestId}] Received event: ${event.type}`);
        onEvent(event);
        if (event.type === 'complete') {
          interview = event.interview || null;
          responseMessage = event.message || '';
        }
      } catch (e) {
        console.error(`[sendFeedback ${requestId}] Failed to parse SSE event:`, data, e);
      }
    }
  }

  // Process any remaining data in the buffer
  if (buffer.trim().startsWith('data: ')) {
    const data = buffer.trim().slice(6);
    if (data !== '[DONE]') {
      try {
        const event: SSEEvent = JSON.parse(data);
        console.log(`[sendFeedback ${requestId}] Received final event from buffer: ${event.type}`);
        onEvent(event);
        if (event.type === 'complete') {
          interview = event.interview || null;
          responseMessage = event.message || '';
        }
      } catch (e) {
        console.error(`[sendFeedback ${requestId}] Failed to parse final SSE event:`, data, e);
      }
    }
  }

  if (!interview) {
    console.error(`[sendFeedback ${requestId}] No interview in response - this will trigger retry`);
    throw new Error('No interview returned');
  }
  
  console.log(`[sendFeedback ${requestId}] Success`);
  return { interview, message: responseMessage };
}

// =============================================================================
// Vacancy API
// =============================================================================

import { Vacancy, Application, ApplicationAnswer, AnswerRating } from './types';

// Backend response types (snake_case)
interface BackendRecruiterSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  team?: string;
  role?: string;
  avatar_url?: string;
}

interface BackendClientSummary {
  id: string;
  name: string;
  location?: string;
  industry?: string;
  logo?: string;
}

interface BackendVacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  status: 'new' | 'draft' | 'in_progress' | 'agent_created' | 'screening_active' | 'archived' | 'concept' | 'open' | 'on_hold' | 'filled' | 'closed';
  created_at: string;
  archived_at: string | null;
  source: 'salesforce' | 'bullhorn' | 'manual' | null;
  source_id: string | null;
  has_screening: boolean;
  is_online: boolean | null;
  channels: {
    voice: boolean;
    whatsapp: boolean;
    cv: boolean;
  };
  agents?: Array<{
    type: string;
    status: 'online' | 'offline' | null;
    total_screenings?: number | null;
    qualified_count?: number | null;
    qualification_rate?: number | null;
    last_activity_at?: string | null;
  }>;
  // Recruiter and client
  recruiter_id?: string;
  recruiter?: BackendRecruiterSummary;
  client_id?: string;
  client?: BackendClientSummary;
  // Stats fields
  candidates_count: number;
  completed_count: number;
  qualified_count: number;
  last_activity_at: string | null;
  // Publishing
  published_at: string | null;
}

const DEFAULT_AGENT_STATUS = { exists: false, status: null as 'online' | 'offline' | null };

/** Transform list-based agents response into the object shape the frontend expects. */
function transformAgents(agentsList?: BackendVacancy['agents']) {
  const result = {
    prescreening: { ...DEFAULT_AGENT_STATUS },
    preonboarding: { ...DEFAULT_AGENT_STATUS },
    insights: { ...DEFAULT_AGENT_STATUS },
  };

  if (!agentsList || !Array.isArray(agentsList)) return result;

  for (const agent of agentsList) {
    const mapped = {
      exists: true,
      status: agent.status,
      total_screenings: agent.total_screenings ?? undefined,
      qualified_count: agent.qualified_count ?? undefined,
      qualification_rate: agent.qualification_rate ?? undefined,
      last_activity_at: agent.last_activity_at ?? undefined,
    };

    if (agent.type === 'prescreening') result.prescreening = mapped;
    else if (agent.type === 'document_collection') result.preonboarding = mapped;
    else if (agent.type === 'insights') result.insights = mapped;
  }

  return result;
}

// Conversion helper
function convertVacancy(v: BackendVacancy): Vacancy {
  return {
    id: v.id,
    title: v.title,
    company: v.company,
    location: v.location,
    description: v.description,
    status: v.status,
    createdAt: v.created_at,
    archivedAt: v.archived_at,
    source: v.source,
    sourceId: v.source_id,
    hasScreening: v.has_screening ?? false,
    isOnline: v.is_online ?? null,
    channels: v.channels ?? { voice: false, whatsapp: false, cv: false },
    agents: transformAgents(v.agents),
    recruiterId: v.recruiter_id,
    recruiter: v.recruiter,
    clientId: v.client_id,
    client: v.client,
    candidatesCount: v.candidates_count ?? 0,
    completedCount: v.completed_count ?? 0,
    qualifiedCount: v.qualified_count ?? 0,
    lastActivityAt: v.last_activity_at,
    publishedAt: v.published_at,
  };
}

// =============================================================================
// Dashboard Stats API
// =============================================================================

export interface DashboardStats {
  totalPrescreenings: number;
  totalPrescreeningsThisWeek: number;
  completedCount: number;
  completionRate: number;
  qualifiedCount: number;
  qualificationRate: number;
  channelBreakdown: {
    voice: number;
    whatsapp: number;
    cv: number;
  };
}

interface BackendDashboardStats {
  total_prescreenings: number;
  total_prescreenings_this_week: number;
  completed_count: number;
  completion_rate: number;
  qualified_count: number;
  qualification_rate: number;
  channel_breakdown: {
    voice: number;
    whatsapp: number;
    cv: number;
  };
}

/**
 * Fetch dashboard-level aggregate statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await authFetch(`${BACKEND_URL}/stats`);

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
  }

  const data: BackendDashboardStats = await response.json();
  
  return {
    totalPrescreenings: data.total_prescreenings,
    totalPrescreeningsThisWeek: data.total_prescreenings_this_week,
    completedCount: data.completed_count,
    completionRate: data.completion_rate,
    qualifiedCount: data.qualified_count,
    qualificationRate: data.qualification_rate,
    channelBreakdown: data.channel_breakdown,
  };
}

/**
 * Fetch all vacancies with optional filtering
 */
export async function getVacancies(params?: {
  status?: string;
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<{ vacancies: Vacancy[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.source) searchParams.set('source', params.source);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const url = `${BACKEND_URL}/vacancies${searchParams.toString() ? '?' + searchParams : ''}`;
  const response = await authFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch vacancies: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    vacancies: (data.items as BackendVacancy[]).map(convertVacancy),
    total: data.total,
  };
}

/**
 * Fetch a single vacancy by ID
 */
export async function getVacancy(vacancyId: string): Promise<Vacancy> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Vacancy not found');
    }
    throw new Error('Failed to fetch vacancy');
  }

  const data = await response.json();
  return convertVacancy(data);
}

// =============================================================================
// Agent Vacancy API (Pre-screening & Pre-onboarding views)
// =============================================================================

import type { AgentVacancy, AgentDashboardStats } from './types';

/**
 * Fetch all non-archived vacancies with prescreening agent status and stats.
 * Returns unified AgentVacancy[] with agent_status field.
 */
export async function getPreScreeningVacancies(
  params?: { limit?: number; offset?: number }
): Promise<{ vacancies: AgentVacancy[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/agents/prescreening/vacancies${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch pre-screening vacancies: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all non-archived vacancies with document collection agent status and stats.
 * Returns unified AgentVacancy[] with agent_status field.
 */
export async function getPreOnboardingVacancies(
  params?: { limit?: number; offset?: number }
): Promise<{ vacancies: AgentVacancy[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/agents/preonboarding/vacancies${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch pre-onboarding vacancies: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch aggregate dashboard stats for the pre-screening overview page.
 */
export async function getPreScreeningStats(): Promise<AgentDashboardStats> {
  const response = await authFetch(`${BACKEND_URL}/agents/prescreening/stats`);

  if (!response.ok) {
    throw new Error(`Failed to fetch pre-screening stats: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch aggregate dashboard stats for the document collection overview page.
 */
export async function getPreOnboardingStats(): Promise<AgentDashboardStats> {
  const response = await authFetch(`${BACKEND_URL}/agents/preonboarding/stats`);

  if (!response.ok) {
    throw new Error(`Failed to fetch pre-onboarding stats: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// Navigation Counts API
// =============================================================================

export interface NavigationCounts {
  prescreening: {
    active: number;
    stuck: number;
  };
  preonboarding: {
    active: number;
    stuck: number;
  };
  activities?: {
    active: number;
    stuck: number;
  };
  vacancies?: {
    active: number;
    archived: number;
  };
  candidates?: {
    total: number;
    archived: number;
  };
}

/**
 * Fetch lightweight navigation counts for sidebar badges.
 * Single request instead of fetching full vacancy lists.
 */
export async function getNavigationCounts(): Promise<NavigationCounts> {
  const response = await authFetch(`${BACKEND_URL}/agents/counts`);

  if (!response.ok) {
    throw new Error(`Failed to fetch navigation counts: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// Applications API
// =============================================================================

// Backend response types for applications
interface BackendQuestionAnswer {
  question_id: string;
  question_text: string;
  question_type: 'knockout' | 'qualification';
  answer: string;
  passed: boolean | null;
  score?: number;
  rating?: AnswerRating;
  motivation?: string;
}

interface BackendApplication {
  id: string;
  vacancy_id: string;
  candidate_name: string;
  channel: 'voice' | 'whatsapp';
  status: 'active' | 'processing' | 'completed' | 'abandoned';
  qualified: boolean;
  open_questions_score?: number;
  knockout_passed?: number;
  knockout_total?: number;
  open_questions_total?: number;
  summary?: string;
  started_at: string;
  completed_at: string | null;
  interaction_seconds: number;
  answers: BackendQuestionAnswer[];
  synced: boolean;
  synced_at: string | null;
  interview_slot?: string | null;
  is_test?: boolean;
}

function convertApplication(a: BackendApplication): Application {
  return {
    id: a.id,
    vacancyId: a.vacancy_id,
    candidateName: a.candidate_name,
    channel: a.channel,
    status: a.status,
    qualified: a.qualified,
    openQuestionsScore: a.open_questions_score,
    knockoutPassed: a.knockout_passed,
    knockoutTotal: a.knockout_total,
    openQuestionsTotal: a.open_questions_total,
    summary: a.summary,
    startedAt: a.started_at,
    completedAt: a.completed_at,
    interactionSeconds: a.interaction_seconds,
    answers: a.answers.map((ans): ApplicationAnswer => ({
      questionId: ans.question_id,
      questionText: ans.question_text,
      questionType: ans.question_type,
      answer: ans.answer,
      passed: ans.passed,
      score: ans.score,
      rating: ans.rating,
      motivation: ans.motivation,
    })),
    synced: a.synced,
    syncedAt: a.synced_at,
    interviewSlot: a.interview_slot,
    isTest: a.is_test ?? false,
  };
}

/**
 * Fetch applications (pre-screening results) for a vacancy
 */
export async function getApplications(
  vacancyId: string,
  params?: {
    qualified?: boolean;
    status?: 'active' | 'processing' | 'completed' | 'abandoned';
    synced?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{ applications: Application[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.qualified !== undefined) {
    searchParams.set('qualified', params.qualified.toString());
  }
  if (params?.status !== undefined) {
    searchParams.set('status', params.status);
  }
  if (params?.synced !== undefined) {
    searchParams.set('synced', params.synced.toString());
  }
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const url = `${BACKEND_URL}/vacancies/${vacancyId}/applications${searchParams.toString() ? '?' + searchParams : ''}`;
  const response = await authFetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }

  const data = await response.json();
  return {
    applications: data.applications.map(convertApplication),
    total: data.total,
  };
}

// =============================================================================
// Pre-Screening API (Database Persistence)
// =============================================================================

// Input types (for saving)
export interface PreScreeningQuestionInput {
  id: string;      // Client ID for matching approved_ids
  question: string;
  ideal_answer?: string;
  vacancy_snippet?: string;  // Text from vacancy this question relates to
}

export interface PreScreeningInput {
  intro: string;
  knockout_questions: PreScreeningQuestionInput[];
  knockout_failed_action: string;
  qualification_questions: PreScreeningQuestionInput[];
  final_action: string;
  approved_ids: string[];
}

// Response types (from database)
export interface PreScreeningQuestion {
  id: string;      // Database UUID
  question_type: 'knockout' | 'qualification';
  position: number;
  question_text: string;
  ideal_answer?: string;
  vacancy_snippet?: string;  // Text from vacancy this question relates to
  is_approved: boolean;
}

export interface PreScreening {
  id: string;
  vacancy_id: string;
  intro: string;
  knockout_questions: PreScreeningQuestion[];
  knockout_failed_action: string;
  qualification_questions: PreScreeningQuestion[];
  final_action: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  // Session fields for AI editing (auto-created by backend)
  session_id?: string;
  interview?: Interview;
  // Publishing fields
  published_at?: string | null;
  is_online: boolean;
  elevenlabs_agent_id?: string | null;
  whatsapp_agent_id?: string | null;
}

export interface SavePreScreeningResponse {
  status: string;
  message: string;
  pre_screening_id: string;
  vacancy_id: string;
  vacancy_status: string;
}

/**
 * Save pre-screening configuration to a vacancy.
 * Creates or updates the pre-screening and inserts questions into pre_screening_questions table.
 * Sets vacancy status to `agent_created`.
 */
export async function savePreScreening(
  vacancyId: string,
  config: PreScreeningInput
): Promise<SavePreScreeningResponse> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to save pre-screening');
  }

  return response.json();
}

/**
 * Get pre-screening configuration for a vacancy.
 * Returns null if no pre-screening exists.
 */
export async function getPreScreening(vacancyId: string): Promise<PreScreening | null> {
  let response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening`);

  // Retry once after a short delay — the pre-screening may still be finalizing
  if (response.status >= 500) {
    await new Promise(r => setTimeout(r, 1500));
    response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening`);
  }

  if (response.status === 404) {
    return null; // No pre-screening exists yet
  }

  if (!response.ok) {
    throw new Error('Failed to fetch pre-screening');
  }

  return response.json();
}

/**
 * Delete pre-screening configuration for a vacancy.
 * Resets vacancy status to `new`.
 */
export async function deletePreScreening(vacancyId: string): Promise<void> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete pre-screening');
  }
}

// =============================================================================
// Pre-Screening Publishing API
// =============================================================================

export interface PublishPreScreeningRequest {
  enable_voice?: boolean;
  enable_whatsapp?: boolean;
  enable_cv?: boolean;
}

export interface PublishPreScreeningResponse {
  status: 'success';
  published_at: string;
  elevenlabs_agent_id?: string;
  whatsapp_agent_id?: string;
  is_online: boolean;
  message: string;
}

export interface UpdateStatusRequest {
  is_online: boolean;
}

export interface UpdateStatusResponse {
  status: 'success';
  is_online: boolean;
  message: string;
  elevenlabs_agent_id?: string;
  whatsapp_agent_id?: string;
}

// Extended types for individual channel control
export interface UpdateChannelStatusRequest {
  is_online?: boolean;
  voice_enabled?: boolean;
  whatsapp_enabled?: boolean;
  cv_enabled?: boolean;
}

export interface UpdateChannelStatusResponse {
  status: 'success';
  is_online: boolean;
  channels: {
    voice: boolean;
    whatsapp: boolean;
    cv: boolean;
  };
  message: string;
  elevenlabs_agent_id?: string;
  whatsapp_agent_id?: string;
}

/**
 * Publish a pre-screening and create AI agents.
 * Publishing automatically sets the pre-screening online.
 */
export async function publishPreScreening(
  vacancyId: string,
  options: PublishPreScreeningRequest = {}
): Promise<PublishPreScreeningResponse> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enable_voice: options.enable_voice ?? true,
      enable_whatsapp: options.enable_whatsapp ?? true,
      enable_cv: options.enable_cv ?? true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to publish pre-screening' }));
    throw new Error(error.detail || 'Failed to publish pre-screening');
  }

  return response.json();
}

/**
 * Update the online/offline status of a published pre-screening.
 * Use for temporarily pausing agents without republishing.
 */
export async function updatePreScreeningStatus(
  vacancyId: string,
  isOnline: boolean
): Promise<UpdateStatusResponse> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_online: isOnline }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to update status' }));
    throw new Error(error.detail || 'Failed to update status');
  }

  return response.json();
}

/**
 * Update individual channel status for a published pre-screening.
 * Allows toggling Voice and WhatsApp channels independently.
 * 
 * Note: Requires backend support for channel-specific toggles.
 * See app/docs/BACKEND_BRIEF_CHANNEL_TOGGLES.md for API specification.
 */
export async function updateChannelStatus(
  vacancyId: string,
  options: UpdateChannelStatusRequest
): Promise<UpdateChannelStatusResponse> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to update channel status' }));
    throw new Error(error.detail || 'Failed to update channel status');
  }

  return response.json();
}

// =============================================================================
// Interview Analysis API
// =============================================================================

export type Verdict = 'excellent' | 'good' | 'needs_work' | 'poor';
export type DropOffRisk = 'low' | 'medium' | 'high';

export interface AnalysisSummary {
  completionRate: number;
  avgTimeSeconds: number;
  verdict: Verdict;
  verdictHeadline: string;
  verdictDescription: string;
  oneLiner: string;
}

export interface AnalysisQuestionResult {
  questionId: string;
  completionRate: number;
  avgTimeSeconds: number;
  dropOffRisk: DropOffRisk;
  clarityScore: number;
  tip: string | null;
}

export interface AnalysisFunnelStep {
  step: string;
  candidates: number;
}

export interface InterviewAnalysisResponse {
  summary: AnalysisSummary;
  questions: AnalysisQuestionResult[];
  funnel: AnalysisFunnelStep[];
}

/**
 * Fetch interview analysis for a vacancy's pre-screening.
 * Returns null if no analysis is available yet (404).
 */
export async function getInterviewAnalysis(
  vacancyId: string
): Promise<InterviewAnalysisResponse | null> {
  const response = await authFetch(
    `${BACKEND_URL}/vacancies/${vacancyId}/pre-screening/analysis`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch interview analysis');
  }

  return response.json();
}

// =============================================================================
// Interview Simulation API
// =============================================================================

import type { 
  SimulationPersona, 
  SimulationRequest, 
  SimulationSSEEvent,
  Simulation,
  SimulationListResponse,
} from './types';

export type SimulationEventCallback = (event: SimulationSSEEvent) => void;

/**
 * Run an interview simulation with a virtual candidate.
 * Returns an SSE stream that delivers messages in real-time.
 * 
 * @param vacancyId - The vacancy UUID to simulate
 * @param onEvent - Callback for each SSE event (start, agent, candidate, complete, error)
 * @param options - Optional persona and candidate name
 */
export async function runSimulation(
  vacancyId: string,
  onEvent: SimulationEventCallback,
  options?: SimulationRequest,
  signal?: AbortSignal
): Promise<void> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      persona: options?.persona ?? 'qualified',
      custom_persona: options?.custom_persona ?? null,
      candidate_name: options?.candidate_name,
      is_playground: options?.is_playground ?? false,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to start simulation' }));
    throw new Error(error.detail || 'Failed to start simulation');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    // Process complete lines from the buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine.startsWith('data: ')) continue;
      
      const data = trimmedLine.slice(6);
      if (data === '[DONE]') continue;

      try {
        const event: SimulationSSEEvent = JSON.parse(data);
        onEvent(event);
      } catch (e) {
        console.error('Failed to parse simulation SSE event:', e);
      }
    }
  }

  // Process any remaining data in the buffer
  if (buffer.trim().startsWith('data: ')) {
    const data = buffer.trim().slice(6);
    if (data !== '[DONE]') {
      try {
        const event: SimulationSSEEvent = JSON.parse(data);
        onEvent(event);
      } catch (e) {
        console.error('Failed to parse final simulation SSE event:', e);
      }
    }
  }
}

/**
 * List all simulations for a vacancy.
 */
export async function listSimulations(
  vacancyId: string,
  params?: {
    persona?: SimulationPersona;
    limit?: number;
    offset?: number;
  }
): Promise<SimulationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.persona) searchParams.set('persona', params.persona);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const url = `${BACKEND_URL}/vacancies/${vacancyId}/simulations${searchParams.toString() ? '?' + searchParams : ''}`;
  const response = await authFetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch simulations');
  }

  return response.json();
}

/**
 * Get detailed simulation including full conversation.
 */
export async function getSimulation(
  vacancyId: string,
  simulationId: string
): Promise<Simulation> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/simulations/${simulationId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Simulation not found');
    }
    throw new Error('Failed to fetch simulation');
  }

  return response.json();
}

/**
 * Delete a simulation.
 */
export async function deleteSimulation(
  vacancyId: string,
  simulationId: string
): Promise<{ status: string; id: string }> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/simulations/${simulationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete simulation');
  }

  return response.json();
}

/**
 * Trigger a manual RTS sync to pull the latest vacancies from the
 * connected recruitment tracking system (Salesforce, Bullhorn, etc.).
 */
export async function triggerRtsSync(): Promise<{ status: string; synced: number }> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/sync`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to trigger RTS sync');
  }

  return response.json();
}

// =============================================================================
// Pre-Screening Config API (Global Settings)
// =============================================================================

export interface PreScreeningVoiceSettings {
  model_id: string;
  voice_id: string;
  stability: number;
  similarity_boost: number;
}

export interface PreScreeningDefaultChannels {
  voice: boolean;
  whatsapp: boolean;
  cv: boolean;
}

export interface PreScreeningGeneralSettings {
  intro_message: string | null;
  success_message: string | null;
  max_unrelated_answers: number;
  require_review: boolean;
  default_channels: PreScreeningDefaultChannels;
}

export interface PreScreeningPlanningSettings {
  planning_mode: string;
  schedule_days_ahead: number;
  schedule_start_offset: number;
}

export interface PreScreeningInterviewSettings {
  require_consent: boolean;
}

export interface PreScreeningEscalationSettings {
  allow_escalation: boolean;
}

export interface PreScreeningSettings {
  voice: PreScreeningVoiceSettings;
  general: PreScreeningGeneralSettings;
  planning: PreScreeningPlanningSettings;
  interview: PreScreeningInterviewSettings;
  escalation: PreScreeningEscalationSettings;
}

export interface PreScreeningConfig {
  id: string;
  config_type: string;
  version: number;
  settings: PreScreeningSettings;
}

export interface PreScreeningConfigUpdate {
  settings: {
    voice?: Partial<PreScreeningVoiceSettings>;
    general?: Partial<PreScreeningGeneralSettings>;
    planning?: Partial<PreScreeningPlanningSettings>;
    interview?: Partial<PreScreeningInterviewSettings>;
    escalation?: Partial<PreScreeningEscalationSettings>;
  };
}

/**
 * Fetch the global pre-screening agent configuration.
 */
export async function getPreScreeningConfig(): Promise<PreScreeningConfig> {
  const response = await authFetch(`${BACKEND_URL}/pre-screening/config`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch config' }));
    throw new Error(error.detail || 'Failed to fetch pre-screening config');
  }

  return response.json();
}

/**
 * Update the global pre-screening agent configuration.
 * All fields are optional — only sends changed values.
 */
export async function updatePreScreeningConfig(
  updates: PreScreeningConfigUpdate
): Promise<PreScreeningConfig> {
  const response = await authFetch(`${BACKEND_URL}/pre-screening/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to update config' }));
    throw new Error(error.detail || 'Failed to update pre-screening config');
  }

  return response.json();
}

/**
 * Get the current auto-generate toggle state for pre-screening.
 */
export async function getAutoGenerate(): Promise<{ auto_generate: boolean }> {
  const response = await authFetch(`${BACKEND_URL}/pre-screening/auto-generate`);

  if (!response.ok) {
    return { auto_generate: true }; // Default to enabled
  }

  return response.json();
}

/**
 * Toggle auto-generate for pre-screening on/off.
 */
export async function setAutoGenerate(enabled: boolean): Promise<{ auto_generate: boolean }> {
  const response = await authFetch(`${BACKEND_URL}/pre-screening/auto-generate?enabled=${enabled}`, {
    method: 'PUT',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to update auto-generate' }));
    throw new Error(error.detail || 'Failed to update auto-generate setting');
  }

  return response.json();
}
