const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export interface InterviewQuestion {
  id: string;
  question: string;
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

export async function sendFeedback(
  sessionId: string,
  userMessage: string,
  onEvent: StatusCallback
): Promise<{ interview: Interview; message: string }> {
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
            responseMessage = event.message || '';
          }
        } catch (e) {
          console.error('Failed to parse SSE event:', e);
        }
      }
    }
  }

  if (!interview) throw new Error('No interview returned');
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
  status: 'new' | 'in_progress' | 'agent_created' | 'archived';
  created_at: string;
  archived_at: string | null;
  source: 'salesforce' | 'bullhorn' | 'manual' | null;
  source_id: string | null;
  has_pre_screening?: boolean;
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
    hasPreScreening: v.has_pre_screening ?? false,
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
}

interface BackendApplication {
  id: string;
  vacancy_id: string;
  candidate_name: string;
  channel: 'voice' | 'whatsapp';
  completed: boolean;
  qualified: boolean;
  started_at: string;
  completed_at: string | null;
  interaction_seconds: number;
  answers: BackendQuestionAnswer[];
  synced: boolean;
  synced_at: string | null;
}

function convertApplication(a: BackendApplication): Application {
  return {
    id: a.id,
    vacancyId: a.vacancy_id,
    candidateName: a.candidate_name,
    channel: a.channel,
    completed: a.completed,
    qualified: a.qualified,
    startedAt: a.started_at,
    completedAt: a.completed_at,
    interactionSeconds: a.interaction_seconds,
    answers: a.answers.map((ans): ApplicationAnswer => ({
      questionId: ans.question_id,
      questionText: ans.question_text,
      answer: ans.answer,
      passed: ans.passed,
    })),
    synced: a.synced,
    syncedAt: a.synced_at,
  };
}

/**
 * Fetch applications (pre-screening results) for a vacancy
 */
export async function getApplications(
  vacancyId: string,
  params?: {
    qualified?: boolean;
    completed?: boolean;
    synced?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{ applications: Application[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.qualified !== undefined) {
    searchParams.set('qualified', params.qualified.toString());
  }
  if (params?.completed !== undefined) {
    searchParams.set('completed', params.completed.toString());
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
