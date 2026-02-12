import {
  Vacancy,
  Question,
  ChatMessage,
  Agent,
  APICandidateListItem,
  APICandidateDetail,
  APICandidateStatus,
  APIAvailabilityStatus,
  APIVacancyListItem,
  APIVacancyDetail,
  VacancyStatus,
  VacancySource,
  GlobalActivity,
  GlobalActivitiesResponse,
  ActivityActorType,
  ActivityChannel,
} from './types';

const API_BASE = '/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Vacancies API
export async function getVacancies(): Promise<Vacancy[]> {
  const response = await fetch(`${API_BASE}/vacancies`);
  if (!response.ok) throw new Error('Failed to fetch vacancies');
  return response.json();
}

export async function getVacancy(id: string): Promise<Vacancy> {
  const response = await fetch(`${API_BASE}/vacancies/${id}`);
  if (!response.ok) throw new Error('Failed to fetch vacancy');
  return response.json();
}

// Questions API
export async function extractQuestions(vacancyId: string): Promise<Question[]> {
  const response = await fetch(`${API_BASE}/extract-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vacancyId }),
  });
  if (!response.ok) throw new Error('Failed to extract questions');
  return response.json();
}

// Feedback API
export async function sendFeedback(
  vacancyId: string,
  message: string,
  questions: Question[]
): Promise<{ message: ChatMessage; updatedQuestions: Question[] }> {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vacancyId, message, questions }),
  });
  if (!response.ok) throw new Error('Failed to send feedback');
  return response.json();
}

// Agent API
export async function createAgent(
  vacancyId: string,
  questions: Question[]
): Promise<Agent> {
  const response = await fetch(`${API_BASE}/create-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vacancyId, questions }),
  });
  if (!response.ok) throw new Error('Failed to create agent');
  return response.json();
}

export async function testAgent(agentId: string, phoneNumber: string): Promise<{ success: boolean }> {
  // This would trigger a test call/message to the phone number
  await delay(1000);
  return { success: true };
}

// Candidates API
export interface GetCandidatesParams {
  limit?: number;
  offset?: number;
  status?: APICandidateStatus;
  availability?: APIAvailabilityStatus;
  search?: string;
  sort_by?: 'status' | 'name' | 'last_activity' | 'rating' | 'availability';
  sort_order?: 'asc' | 'desc';
}

export interface CandidatesListResponse {
  items: APICandidateListItem[];
  total: number;
  limit: number;
  offset: number;
}

export async function getCandidates(params: GetCandidatesParams = {}): Promise<CandidatesListResponse> {
  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  if (params.status) searchParams.set('status', params.status);
  if (params.availability) searchParams.set('availability', params.availability);
  if (params.search) searchParams.set('search', params.search);
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.sort_order) searchParams.set('sort_order', params.sort_order);

  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/candidates${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch candidates');
  }

  const data = await response.json();

  // Handle both array response and paginated response
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      limit: params.limit || 50,
      offset: params.offset || 0,
    };
  }

  // If response has 'items' property, use it; otherwise assume the data itself is the list
  return {
    items: data.items || data.candidates || [],
    total: data.total || (data.items || data.candidates || []).length,
    limit: data.limit || params.limit || 50,
    offset: data.offset || params.offset || 0,
  };
}

export async function getCandidate(candidateId: string): Promise<APICandidateDetail> {
  const response = await fetch(`${BACKEND_URL}/candidates/${candidateId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch candidate');
  }
  return response.json();
}

export async function updateCandidateStatus(
  candidateId: string,
  status: APICandidateStatus
): Promise<{ status: string; candidate_id: string; new_status: APICandidateStatus }> {
  const response = await fetch(`${BACKEND_URL}/candidates/${candidateId}/status?status=${status}`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to update candidate status');
  }
  return response.json();
}

export async function updateCandidateRating(
  candidateId: string,
  rating: number
): Promise<{ status: string; candidate_id: string; new_rating: number }> {
  const response = await fetch(`${BACKEND_URL}/candidates/${candidateId}/rating?rating=${rating}`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to update candidate rating');
  }
  return response.json();
}

// Vacancies API (from backend)
export interface GetVacanciesParams {
  limit?: number;
  offset?: number;
  status?: VacancyStatus;
  source?: VacancySource;
}

export interface VacanciesListResponse {
  vacancies: APIVacancyListItem[];
  total: number;
  limit: number;
  offset: number;
}

export async function getVacanciesFromAPI(params: GetVacanciesParams = {}): Promise<VacanciesListResponse> {
  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  if (params.status) searchParams.set('status', params.status);
  if (params.source) searchParams.set('source', params.source);

  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/vacancies${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch vacancies');
  }

  const data = await response.json();

  // Default agents object for vacancies that don't have it yet
  const defaultAgents = {
    prescreening: { exists: false, status: null },
    preonboarding: { exists: false, status: null },
    insights: { exists: false, status: null },
  };

  // Normalize vacancy to ensure agents field exists
  const normalizeVacancy = (v: APIVacancyListItem): APIVacancyListItem => ({
    ...v,
    agents: v.agents || defaultAgents,
  });

  // Handle both array response and paginated response
  if (Array.isArray(data)) {
    return {
      vacancies: data.map(normalizeVacancy),
      total: data.length,
      limit: params.limit || 50,
      offset: params.offset || 0,
    };
  }

  const rawVacancies = data.vacancies || data.items || [];
  return {
    vacancies: rawVacancies.map(normalizeVacancy),
    total: data.total || rawVacancies.length,
    limit: data.limit || params.limit || 50,
    offset: data.offset || params.offset || 0,
  };
}

export async function getVacancyDetail(vacancyId: string): Promise<APIVacancyDetail> {
  const response = await fetch(`${BACKEND_URL}/vacancies/${vacancyId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vacancy');
  }
  const data = await response.json();

  // Ensure agents field exists
  return {
    ...data,
    agents: data.agents || {
      prescreening: { exists: false, status: null },
      preonboarding: { exists: false, status: null },
      insights: { exists: false, status: null },
    },
    timeline: data.timeline || [],
  };
}

// Activities API
export interface GetActivitiesParams {
  actor_type?: ActivityActorType;
  event_type?: string[];
  channel?: ActivityChannel;
  limit?: number;
  offset?: number;
}

export async function getActivities(params: GetActivitiesParams = {}): Promise<GlobalActivitiesResponse> {
  const searchParams = new URLSearchParams();

  if (params.actor_type) searchParams.set('actor_type', params.actor_type);
  if (params.event_type && params.event_type.length > 0) {
    params.event_type.forEach(type => searchParams.append('event_type', type));
  }
  if (params.channel) searchParams.set('channel', params.channel);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/activities${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }

  return response.json();
}

// ElevenLabs Agent API
export interface UpdateAgentConfigParams {
  agentId: string;
  voiceId: string;
  modelId: string;
  stability?: number;
  similarityBoost?: number;
}

export async function updateElevenLabsAgentConfig(params: UpdateAgentConfigParams): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/elevenlabs/agent/${params.agentId}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice_id: params.voiceId,
      model_id: params.modelId,
      stability: params.stability,
      similarity_boost: params.similarityBoost,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update agent config: ${error}`);
  }
}

// Save voice config to database
export interface SaveVoiceConfigParams {
  agentId: string;
  voiceId: string;
  modelId: string;
  stability?: number;
  similarityBoost?: number;
}

export interface VoiceConfigResponse {
  id: string;
  agent_id: string;
  voice_id: string;
  model_id: string;
  stability?: number;
  similarity_boost?: number;
  created_at: string;
  updated_at: string;
}

export async function saveElevenLabsVoiceConfig(params: SaveVoiceConfigParams): Promise<VoiceConfigResponse> {
  const response = await fetch(`${BACKEND_URL}/elevenlabs/voice-config/${params.agentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice_id: params.voiceId,
      model_id: params.modelId,
      stability: params.stability,
      similarity_boost: params.similarityBoost,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to save voice config: ${error}`);
  }

  return response.json();
}

export async function getElevenLabsVoiceConfig(agentId: string): Promise<VoiceConfigResponse | null> {
  const response = await fetch(`${BACKEND_URL}/elevenlabs/voice-config/${agentId}`);

  if (response.status === 404) {
    return null; // No config saved yet
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get voice config: ${error}`);
  }

  return response.json();
}
