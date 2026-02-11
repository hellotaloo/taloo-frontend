// Vacancy types
// Legacy status values (used in existing frontend code)
export type LegacyVacancyStatus = 'new' | 'draft' | 'in_progress' | 'agent_created' | 'screening_active' | 'archived';
// New API status values (lifecycle-based)
export type APIVacancyStatus = 'concept' | 'open' | 'on_hold' | 'filled' | 'closed';
// Combined for transition period - includes both for backward compatibility
export type VacancyStatus = LegacyVacancyStatus | APIVacancyStatus;
export type VacancySource = 'salesforce' | 'bullhorn' | 'manual';

export interface VacancyChannels {
  voice: boolean;
  whatsapp: boolean;
  cv: boolean;
}

export type AgentStatus = 'online' | 'offline' | null;

export interface AgentStatusInfo {
  exists: boolean;           // Agent is configured/generated
  status: AgentStatus;       // online, offline, or null if doesn't exist
}

export interface VacancyAgents {
  prescreening: AgentStatusInfo;
  preonboarding: AgentStatusInfo;
  insights: AgentStatusInfo;
}

export interface RecruiterSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  team?: string;
  role?: string;
  avatar_url?: string;
}

export interface ClientSummary {
  id: string;
  name: string;
  location?: string;
  industry?: string;
  logo?: string;
}

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  status: VacancyStatus;
  createdAt: string;
  archivedAt?: string | null;
  source?: VacancySource | null;
  sourceId?: string | null;
  hasScreening: boolean;        // True if pre-screening exists
  hasOnboarding?: boolean;      // True if pre-onboarding exists
  job_type?: JobType;           // Job type for document requirements
  isOnline: boolean | null;     // null=draft, true=online, false=offline
  channels: VacancyChannels;    // Active channels for this pre-screening
  agents?: VacancyAgents;       // Which AI agents are enabled
  // Recruiter and client
  recruiterId?: string;
  recruiter?: RecruiterSummary;
  clientId?: string;
  client?: ClientSummary;
  // Stats fields
  candidatesCount: number;      // Total applications (excluding test conversations)
  completedCount: number;       // Applications with status='completed'
  qualifiedCount: number;       // Applications with qualified=true
  lastActivityAt?: string | null; // Most recent application activity timestamp
}

// Question types
export type QuestionType = 'knockout' | 'qualifying';
export type AnswerType = 'yes_no' | 'multiple_choice' | 'open';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  answerType: AnswerType;
  options?: QuestionOption[];
  required: boolean;
  order: number;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Agent types
export interface Agent {
  id: string;
  vacancyId: string;
  status: 'active' | 'inactive';
  phoneNumber?: string;
  createdAt: string;
}

// Flow diagram types
export interface FlowNode {
  id: string;
  type: 'question' | 'decision' | 'start' | 'end';
  data: {
    label: string;
    questionType?: QuestionType;
    endType?: 'rejected' | 'complete';
  };
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// Interview types
export type InterviewChannel = 'voice' | 'whatsapp' | 'cv';
export type InterviewStatus = 'started' | 'completed' | 'abandoned';

// CV Application types
export interface CVApplicationRequest {
  pdf_base64: string;
  candidate_name: string;
  candidate_phone?: string;
  candidate_email?: string;
}

export interface CVQuestionAnswer {
  question_id: string;
  question_text: string;
  answer: string | null;
  passed: boolean | null;  // true=answered, null=needs clarification, false=failed
  score: number | null;
  rating: string | null;
  motivation?: string | null;
}

export interface CVApplicationResponse {
  id: string;
  vacancy_id: string;
  candidate_name: string;
  channel: 'cv';
  status: 'completed';
  qualified: boolean;
  started_at: string;
  completed_at: string;
  interaction_seconds: number;
  answers: CVQuestionAnswer[];
  synced: boolean;
  knockout_passed: number;
  knockout_total: number;
  qualification_count: number;
  summary: string;
  meeting_slots?: string[];  // Available meeting slots for qualified candidates
}

export interface CVAnalysisResult {
  applicationId: string;
  summary: string;
  needsClarification: boolean;
  answeredQuestions: CVQuestionAnswer[];
  clarificationQuestions: CVQuestionAnswer[];
  meetingSlots: string[];  // Available meeting slots for booking
}

export interface Interview {
  id: string;
  vacancyId: string;
  agentId: string;
  channel: InterviewChannel;
  status: InterviewStatus;
  startedAt: string;
  completedAt?: string;
  questionsAnswered: number;
  totalQuestions: number;
  qualified: boolean;
  knockoutPassed: boolean;
}

// Application types (pre-screening results)
export type AnswerRating = 'excellent' | 'good' | 'average' | 'poor';
export type ApplicationStatus = 'active' | 'processing' | 'completed';

export interface ApplicationAnswer {
  questionId: string;
  questionText: string;
  questionType: 'knockout' | 'qualification';
  answer: string;
  passed: boolean | null;
  score?: number;
  rating?: AnswerRating;
  motivation?: string;
}

export interface Application {
  id: string;
  vacancyId: string;
  candidateName: string;
  channel: 'voice' | 'whatsapp' | 'cv';
  status: ApplicationStatus;
  qualified: boolean;
  overallScore?: number;
  knockoutPassed?: number;
  knockoutTotal?: number;
  qualificationCount?: number;
  summary?: string;
  startedAt: string;
  completedAt?: string | null;
  interactionSeconds: number;
  answers: ApplicationAnswer[];
  synced: boolean;
  syncedAt?: string | null;
  interviewSlot?: string | null;
  isTest?: boolean;
}

// Metrics types
export interface InterviewMetrics {
  totalInterviews: number;
  completedInterviews: number;
  completionRate: number;
  qualifiedCandidates: number;
  qualificationRate: number;
  channelBreakdown: {
    voice: number;
    whatsapp: number;
  };
  weeklyTrend: { date: string; count: number }[];
  popularVacancies: { vacancyId: string; title: string; count: number }[];
}

// Finetune types
export type FinetuneAgent = 'general' | 'pre-screening' | 'interview-generator';
export type FinetuneCategory = 'checks' | 'strictness' | 'red-flags' | 'depth' | 'tone' | 'style' | 'focus' | 'difficulty' | 'avoid' | 'output' | 'brand';

export interface FinetuneInstruction {
  id: string;
  agent: FinetuneAgent;
  category: FinetuneCategory;
  instruction: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// =============================================================================
// Interview Simulation Types
// =============================================================================

export type SimulationPersona = 
  | 'qualified' 
  | 'borderline' 
  | 'unqualified' 
  | 'rushed' 
  | 'enthusiastic' 
  | 'custom';

export interface SimulationRequest {
  persona?: SimulationPersona;
  custom_persona?: string | null;
  candidate_name?: string;
}

export interface SimulationQAPair {
  question: string;
  answer: string;
  turn: number;
}

export interface SimulationMessage {
  role: 'agent' | 'candidate';
  message: string;
  turn: number;
}

// SSE Event types from simulation endpoint
export interface SimulationStartEvent {
  type: 'start';
  message: string;
  candidate_name: string;
}

export interface SimulationAgentEvent {
  type: 'agent';
  message: string;
  turn: number;
}

export interface SimulationCandidateEvent {
  type: 'candidate';
  message: string;
  turn: number;
}

export interface SimulationCompleteEvent {
  type: 'complete';
  simulation_id: string;
  outcome: 'completed' | 'max_turns_reached';
  qa_pairs: SimulationQAPair[];
  total_turns: number;
}

export interface SimulationErrorEvent {
  type: 'error';
  message: string;
}

export type SimulationSSEEvent = 
  | SimulationStartEvent 
  | SimulationAgentEvent 
  | SimulationCandidateEvent 
  | SimulationCompleteEvent 
  | SimulationErrorEvent;

export interface Simulation {
  id: string;
  vacancy_id: string;
  persona: SimulationPersona;
  custom_persona?: string | null;
  candidate_name: string;
  qa_pairs: SimulationQAPair[];
  conversation?: SimulationMessage[];
  outcome: 'completed' | 'max_turns_reached';
  total_turns: number;
  created_at: string;
}

export interface SimulationListResponse {
  simulations: Simulation[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// Pre-Onboarding Types
// =============================================================================

// Job types
export type JobType = 'jobstudent' | 'arbeider' | 'bediende' | 'flex';
export type NationalityStatus = 'belg' | 'niet-belg';

// Document types
export type DocumentType =
  | 'id_card'
  | 'driver_license'
  | 'work_permit'
  | 'medical_certificate'
  | 'certificate_diploma'
  | 'bank_account';

// Pre-onboarding config
export interface PreOnboardingConfig {
  id: string;
  vacancy_id: string;
  job_type: JobType;
  required_documents: DocumentType[];
  status: 'draft' | 'active' | 'archived';
  is_online: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

// Document collection status
export interface DocumentCollectionStatus {
  document_type: DocumentType;
  collected: boolean;
  verified: boolean;
  uploaded_at?: string;
}

// Document collection request
export interface PreOnboardingRequest {
  id: string;
  vacancy_id: string;
  application_id: string;
  conversation_id?: string | null;
  candidate_name: string;
  candidate_lastname: string;
  whatsapp_number: string;
  nationality?: NationalityStatus;
  documents_required: DocumentType[];
  documents_collected: DocumentCollectionStatus[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

// =============================================================================
// Client Types (for Overviews)
// =============================================================================

export interface APIClient {
  id: string;
  name: string;
  location?: string;
  industry?: string;
  logo?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Source integration fields
  source?: string;
  source_url?: string;
  synced_at?: string;
  // Computed fields (may be added by frontend or API)
  active_vacancies?: number;
  total_candidates?: number;
}

// Legacy Customer type (for backwards compatibility with mock data)
export interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  activeVacancies: number;
  totalCandidates: number;
  createdAt: string;
  lastActivityAt: string;
}

// =============================================================================
// Candidate Profile Types (for Overviews - Candidate-Centric)
// =============================================================================

export type CandidateStatus = 'new' | 'qualified' | 'placed' | 'inactive';
export type ShiftPreference = 'day' | 'evening' | 'night' | 'weekend' | 'flexible';
export type AvailabilityStatus = 'immediate' | '1_week' | '2_weeks' | 'specific_date' | 'not_available';

export interface LinkedVacancy {
  vacancyId: string;
  vacancyTitle: string;
  company: string;
  applicationStatus: 'applied' | 'screening' | 'submitted' | 'placed' | 'rejected';
  score?: number | null;  // Pre-screening score (0-100)
  appliedAt: string;
}

// Interaction event types for candidate timeline
export type InteractionEventType =
  | 'registered'
  | 'applied'
  | 'prescreening_started'
  | 'prescreening_completed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'submitted_to_client'
  | 'placed'
  | 'rejected'
  | 'withdrawn'
  | 'note_added';

export interface InteractionEvent {
  id: string;
  type: InteractionEventType;
  title: string;
  description?: string;
  vacancyId?: string;
  vacancyTitle?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: CandidateStatus;

  // Availability & Preferences
  availability: AvailabilityStatus;
  availableFrom?: string;  // ISO date if specific_date
  shiftPreference: ShiftPreference[];

  // Skills & Qualifications
  skills: string[];  // e.g., ['Reachtruck', 'Excel', 'Nederlands']
  certifications: string[];  // e.g., ['VCA', 'Rijbewijs B', 'Rijbewijs C']

  // Performance
  rating: number | null;  // 1-5 stars, null if no placements yet

  // Linked vacancies (one candidate → multiple vacancies)
  linkedVacancies: LinkedVacancy[];

  // Interaction history (timeline)
  interactions: InteractionEvent[];

  // Timestamps
  createdAt: string;
  lastActivityAt: string;
}

// =============================================================================
// Vacancy Profile Types (for Overviews - Vacancy-Centric)
// =============================================================================

export type CandidateApplicationStatus = 'applied' | 'screening' | 'submitted' | 'placed' | 'rejected';

export interface LinkedCandidate {
  candidateId: string;
  candidateName: string;
  email: string;
  phone: string;
  applicationStatus: CandidateApplicationStatus;
  score?: number | null;  // Pre-screening score (0-100)
  appliedAt: string;
  channel: 'voice' | 'whatsapp' | 'cv';
}

// Vacancy event types for vacancy timeline
export type VacancyEventType =
  | 'created'
  | 'screening_configured'
  | 'published'
  | 'unpublished'
  | 'candidate_applied'
  | 'candidate_qualified'
  | 'candidate_submitted'
  | 'candidate_placed'
  | 'candidate_rejected'
  | 'note_added'
  | 'archived';

export interface VacancyEvent {
  id: string;
  type: VacancyEventType;
  title: string;
  description?: string;
  candidateId?: string;
  candidateName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface VacancyProfile extends Vacancy {
  // Linked candidates (one vacancy → multiple candidates)
  linkedCandidates: LinkedCandidate[];

  // Vacancy history (timeline)
  events: VacancyEvent[];
}

// =============================================================================
// API Response Types (Candidates)
// =============================================================================

// API status types - different from frontend display types
export type APICandidateStatus = 'new' | 'qualified' | 'active' | 'placed' | 'inactive';
export type APIAvailabilityStatus = 'available' | 'unavailable' | 'unknown';

export interface APICandidateSkill {
  id: string;
  skill_name: string;
  skill_code?: string;
  skill_category?: string;  // skills, education, certificates, personality
  score?: number;           // 0.0-1.0
  evidence?: string;
  source: string;           // cv_analysis, manual, screening, import
  created_at: string;
}

export interface APICandidateListItem {
  id: string;
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  source?: string;
  status: APICandidateStatus;
  status_updated_at?: string;
  availability: APIAvailabilityStatus;
  available_from?: string;  // YYYY-MM-DD
  rating?: number;          // 0.0-5.0
  created_at: string;
  updated_at: string;
  skills: APICandidateSkill[];
  vacancy_count: number;
  last_activity?: string;
  source_url?: string;
  synced_at?: string;
  is_test?: boolean;
}

export interface APICandidatesResponse {
  items: APICandidateListItem[];
  total: number;
  limit: number;
  offset: number;
}

// API detail response includes applications
export interface APICandidateApplicationSummary {
  id: string;
  vacancy_id: string;
  vacancy_title: string;
  vacancy_company: string;
  channel: string;
  status: string;
  qualified?: boolean;
  started_at: string;
  completed_at?: string;
}

export interface APICandidateDetail extends APICandidateListItem {
  applications: APICandidateApplicationSummary[];
  timeline?: APIActivityResponse[];
}

// =============================================================================
// API Response Types (Vacancies)
// =============================================================================

export interface APIChannelsResponse {
  voice: boolean;
  whatsapp: boolean;
  cv: boolean;
}

export interface APIAgentStatusResponse {
  exists: boolean;                        // Agent is configured/generated
  status: 'online' | 'offline' | null;    // online, offline, or null if doesn't exist
}

export interface APIAgentsResponse {
  prescreening: APIAgentStatusResponse;   // Pre-screening AI agent
  preonboarding: APIAgentStatusResponse;  // Pre-onboarding AI agent (document collection)
  insights: APIAgentStatusResponse;        // Insights AI agent (analytics)
}

export interface APIRecruiterSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  team?: string;
  role?: string;
  avatar_url?: string;
}

export interface APIVacancyListItem {
  id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  status: VacancyStatus;
  created_at: string;
  archived_at?: string;
  source?: VacancySource;
  source_id?: string;
  source_url?: string;              // URL to view record in source system (Salesforce/Bullhorn)
  has_screening: boolean;
  is_online?: boolean;
  channels: APIChannelsResponse;
  agents: APIAgentsResponse;
  candidates_count: number;
  completed_count: number;
  qualified_count: number;
  last_activity_at?: string;
  // Additional fields for vacancy table display
  start_date?: string;      // Expected start date
  shift?: string;           // Shift/schedule info (e.g., "Day shift", "3-ploegen")
  sla_days?: number;        // SLA in days
  urgency?: 'low' | 'medium' | 'high' | 'urgent';  // Urgency level
  // Recruiter assignment
  recruiter_id?: string;           // UUID - foreign key to recruiters table
  recruiter?: APIRecruiterSummary; // Full recruiter info (if assigned)
  // Sync info
  synced_at?: string;              // Last sync timestamp from source (Salesforce/Bullhorn)
}

export interface APIVacanciesResponse {
  vacancies: APIVacancyListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Activity timeline (shared between candidates and vacancies)
export interface APIActivityResponse {
  id: string;
  candidate_id?: string;
  application_id?: string;
  vacancy_id?: string;
  event_type: string;  // screening_started, qualified, disqualified, interview_scheduled, etc.
  channel?: string;    // voice, whatsapp, cv, web
  actor_type: string;  // candidate, agent, recruiter, system
  actor_id?: string;
  metadata: Record<string, unknown>;
  summary?: string;    // Human-readable description in Dutch
  created_at: string;
}

export interface APIVacancyDetail extends APIVacancyListItem {
  timeline: APIActivityResponse[];
}
