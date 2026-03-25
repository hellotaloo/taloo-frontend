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
  APIClient,
  VacancyStatus,
  VacancySource,
  GlobalActivity,
  GlobalActivitiesResponse,
  ActivityActorType,
  ActivityChannel,
  VacancyAgents,
  AgentStatusInfo,
} from './types';

const API_BASE = '/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get auth headers for API requests.
 * Includes Authorization and X-Workspace-ID headers if available.
 */
export function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }

  const token = localStorage.getItem('access_token');
  const workspaceId = localStorage.getItem('workspace_id');

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(workspaceId && { 'X-Workspace-ID': workspaceId }),
  };
}

/**
 * Authenticated fetch wrapper.
 * Automatically adds auth headers and handles 401 responses.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 - redirect to login
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('workspace_id');
    localStorage.removeItem('user');
    localStorage.removeItem('workspaces');
    window.location.href = '/login';
  }

  return response;
}

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

  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch candidates');
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export interface ClientsListResponse {
  items: APIClient[];
  total: number;
  limit: number;
  offset: number;
}

export async function getClients(params: { limit?: number; offset?: number; search?: string } = {}): Promise<ClientsListResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  if (params.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/clients${queryString ? `?${queryString}` : ''}`;

  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }

  return response.json();
}

export async function getCandidate(candidateId: string): Promise<APICandidateDetail> {
  const response = await authFetch(`${BACKEND_URL}/candidates/${candidateId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch candidate');
  }
  return response.json();
}

export async function updateCandidateStatus(
  candidateId: string,
  status: APICandidateStatus
): Promise<{ status: string; candidate_id: string; new_status: APICandidateStatus }> {
  const response = await authFetch(`${BACKEND_URL}/candidates/${candidateId}/status?status=${status}`, {
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
  const response = await authFetch(`${BACKEND_URL}/candidates/${candidateId}/rating?rating=${rating}`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to update candidate rating');
  }
  return response.json();
}

// Candidate Attributes (per candidate)
export interface PutCandidateAttributeBody {
  attribute_type_id: string;
  value: string;
  source: string;
}

export async function putCandidateAttribute(
  candidateId: string,
  body: PutCandidateAttributeBody
): Promise<void> {
  const response = await authFetch(`${BACKEND_URL}/candidates/${candidateId}/attributes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to save attribute');
  }
}

export async function deleteCandidateAttribute(
  candidateId: string,
  attributeId: string
): Promise<void> {
  const response = await authFetch(
    `${BACKEND_URL}/candidates/${candidateId}/attributes/${attributeId}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    throw new Error('Failed to delete attribute');
  }
}

// Transform list-based agents API response into the object shape the frontend expects
interface AgentListItem {
  type: string;
  status: 'online' | 'offline' | null;
  total_screenings?: number | null;
  qualified_count?: number | null;
  qualification_rate?: number | null;
  last_activity_at?: string | null;
}

function transformAgentsList(agentsList: unknown): VacancyAgents {
  const defaultAgent: AgentStatusInfo = { exists: false, status: null };
  const result: VacancyAgents = {
    prescreening: { ...defaultAgent },
    preonboarding: { ...defaultAgent },
    insights: { ...defaultAgent },
  };

  if (!Array.isArray(agentsList)) return result;

  for (const agent of agentsList as AgentListItem[]) {
    const mapped: AgentStatusInfo = {
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

// Vacancies API (from backend)
export interface GetVacanciesParams {
  limit?: number;
  offset?: number;
  status?: VacancyStatus;
  source?: VacancySource;
}

export interface VacanciesListResponse {
  items: APIVacancyListItem[];
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

  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch vacancies');
  }

  const data = await response.json();

  // Transform list-based agents into object shape for each vacancy
  if (data.items) {
    data.items = data.items.map((item: APIVacancyListItem & { agents: unknown }) => {
      if (Array.isArray(item.agents)) {
        return { ...item, agents: transformAgentsList(item.agents) };
      }
      return item;
    });
  }

  return data;
}

export async function getVacancyDetail(vacancyId: string): Promise<APIVacancyDetail> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vacancy');
  }
  const data = await response.json();

  // Transform list-based agents into object shape
  const agents = transformAgentsList(data.agents);

  return {
    ...data,
    agents,
    timeline: data.timeline || [],
  };
}

// Workstation sheet API
export interface WorkstationSheetParam {
  param_key: string;
  param_value: string;
  notes: string | null;
  updated_at: string | null;
}

export async function patchVacancy(
  vacancyId: string,
  data: { start_date?: string | null }
): Promise<{ id: string; start_date: string | null }> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update vacancy');
  return response.json();
}

export async function getWorkstationSheet(vacancyId: string): Promise<WorkstationSheetParam[]> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/workstation-sheet`);
  if (!response.ok) throw new Error('Failed to fetch workstation sheet');
  return response.json();
}

export async function setWorkstationSheetParam(
  vacancyId: string,
  paramKey: string,
  paramValue: string,
  notes?: string
): Promise<void> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/workstation-sheet/${paramKey}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ param_value: paramValue, notes }),
  });
  if (!response.ok) throw new Error('Failed to set workstation sheet param');
}

export async function deleteWorkstationSheetParam(vacancyId: string, paramKey: string): Promise<void> {
  const response = await authFetch(`${BACKEND_URL}/vacancies/${vacancyId}/workstation-sheet/${paramKey}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete workstation sheet param');
}

// Medical risk options
export interface MedicalRiskOption {
  id: string;
  name: string;
}

export async function getMedicalRisks(search?: string): Promise<MedicalRiskOption[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await authFetch(`${BACKEND_URL}/werkpostfiche/medical-risks${params}`);
  if (!response.ok) throw new Error('Failed to fetch medical risks');
  return response.json();
}

// Monitoring API (event log - formerly /activities)
export interface GetActivitiesParams {
  actor_type?: ActivityActorType;
  event_type?: string[];
  channel?: ActivityChannel;
  since?: string;
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
  if (params.since) searchParams.set('since', params.since);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/monitoring${queryString ? `?${queryString}` : ''}`;

  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }

  return response.json();
}

// Activity Tasks API (workflow task monitoring)
export interface WorkflowStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
}

export interface TaskRow {
  id: string;
  candidate_id: string | null;
  vacancy_id: string | null;
  application_id: string | null;
  collection_id: string | null;
  candidate_name: string | null;
  vacancy_title: string | null;
  workflow_type: string;
  workflow_type_label: string;
  current_step: string;
  current_step_label: string;
  step_detail: string | null;
  status: string;
  is_stuck: boolean;
  updated_at: string;
  time_ago: string;
  workflow_steps: WorkflowStep[];
  // SLA timing fields
  timeout_at: string | null;
  time_remaining: string | null;
  time_remaining_seconds: number | null;
  // Duration for completed workflows
  duration: string | null;
  duration_seconds: number | null;
}

export interface TasksResponse {
  tasks: TaskRow[];
  total: number;
  stuck_count: number;
}

export interface GetActivityTasksParams {
  status?: 'active' | 'completed' | 'all';
  stuck_only?: boolean;
  limit?: number;
  offset?: number;
}

export async function getActivityTasks(params: GetActivityTasksParams = {}): Promise<TasksResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.stuck_only) searchParams.set('stuck_only', 'true');
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/api/activities/tasks${queryString ? `?${queryString}` : ''}`;

  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch activity tasks');
  }

  return response.json();
}

// Complete a stuck task
export interface CompleteTaskParams {
  completed_by: string;
  notes?: string;
}

export interface CompleteTaskResponse {
  success: boolean;
  task_id: string;
  new_status: string;
  new_step: string;
  completed_by: string;
  completed_at: string;
  message: string;
}

export async function completeTask(taskId: string, params: CompleteTaskParams): Promise<CompleteTaskResponse> {
  const response = await authFetch(`${BACKEND_URL}/api/activities/tasks/${taskId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to complete task');
  }

  return response.json();
}

// Delete a task
export async function deleteTask(taskId: string): Promise<void> {
  const response = await authFetch(`${BACKEND_URL}/api/activities/tasks/${taskId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
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
  const response = await authFetch(`${BACKEND_URL}/elevenlabs/agent/${params.agentId}/config`, {
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
  const response = await authFetch(`${BACKEND_URL}/elevenlabs/voice-config/${params.agentId}`, {
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
  const response = await authFetch(`${BACKEND_URL}/elevenlabs/voice-config/${agentId}`);

  if (response.status === 404) {
    return null; // No config saved yet
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get voice config: ${error}`);
  }

  return response.json();
}

// System Status API
export interface ServiceStatusItem {
  name: string;
  slug: string;
  status: 'online' | 'offline' | 'degraded' | 'not_configured' | 'unknown';
  description: string;
}

export interface IntegrationStatusItem {
  name: string;
  slug: string;
  status: 'online' | 'offline' | 'degraded' | 'not_configured' | 'unknown';
  description: string;
  last_checked_at: string | null;
}

export interface SystemStatusResponse {
  overall: 'online' | 'degraded' | 'offline';
  services: ServiceStatusItem[];
  integrations: IntegrationStatusItem[];
}

export async function getSystemStatus(): Promise<SystemStatusResponse> {
  const response = await authFetch(`${BACKEND_URL}/health/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch system status');
  }
  return response.json();
}
