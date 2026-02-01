const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export interface InterviewQuestion {
  id: string;
  question: string;
  ideal_answer?: string;
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
  vacancyText: string,
  onEvent: StatusCallback,
  sessionId?: string
): Promise<{ interview: Interview; sessionId: string; message: string }> {
  const response = await fetch(`${BACKEND_URL}/interview/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      vacancy_text: vacancyText,
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
  const response = await fetch(`${BACKEND_URL}/interview/reorder`, {
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
  const response = await fetch(`${BACKEND_URL}/interview/add`, {
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
  const response = await fetch(`${BACKEND_URL}/interview/delete`, {
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
  
  const response = await fetch(`${BACKEND_URL}/interview/feedback`, {
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

import { Vacancy, Application, ApplicationAnswer } from './types';

// Backend response types (snake_case)
interface BackendVacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  status: 'new' | 'draft' | 'in_progress' | 'agent_created' | 'screening_active' | 'archived';
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
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch vacancies: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle different response formats
  const vacanciesArray = data.vacancies || data.items || (Array.isArray(data) ? data : []);
  
  if (!Array.isArray(vacanciesArray)) {
    console.error('Unexpected vacancies response format:', data);
    throw new Error('Invalid response format from vacancies API');
  }

  return {
    vacancies: vacanciesArray.map(convertVacancy),
    total: data.total ?? vacanciesArray.length,
  };
}

/**
 * Fetch a single vacancy by ID
 */
export async function getVacancy(vacancyId: string): Promise<Vacancy> {
  const response = await fetch(`${BACKEND_URL}/vacancies/${vacancyId}`);

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
// Applications API
// =============================================================================

// Backend response types for applications
interface BackendQuestionAnswer {
  question_id: string;
  question_text: string;
  answer: string;
  passed: boolean | null;
  score?: number;
  rating?: 'excellent' | 'good' | 'average' | 'poor';
  motivation?: string;
}

interface BackendApplication {
  id: string;
  vacancy_id: string;
  candidate_name: string;
  channel: 'voice' | 'whatsapp';
  status: 'active' | 'processing' | 'completed';
  qualified: boolean;
  overall_score?: number;
  knockout_passed?: number;
  knockout_total?: number;
  qualification_count?: number;
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
    overallScore: a.overall_score,
    knockoutPassed: a.knockout_passed,
    knockoutTotal: a.knockout_total,
    qualificationCount: a.qualification_count,
    summary: a.summary,
    startedAt: a.started_at,
    completedAt: a.completed_at,
    interactionSeconds: a.interaction_seconds,
    answers: a.answers.map((ans): ApplicationAnswer => ({
      questionId: ans.question_id,
      questionText: ans.question_text,
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
    status?: 'active' | 'processing' | 'completed';
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
  const response = await fetch(url);

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
  const response = await fetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening`, {
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
  const response = await fetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening`);

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
  const response = await fetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening`, {
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
  const response = await fetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening/publish`, {
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
  const response = await fetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening/status`, {
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
  const response = await fetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening/status`, {
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
