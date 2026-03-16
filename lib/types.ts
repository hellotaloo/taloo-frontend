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
  total_screenings?: number; // Total screenings/tasks completed
  qualified_count?: number;  // Number of qualified candidates
  qualification_rate?: number; // Percentage (0-100)
  last_activity_at?: string; // Last activity timestamp
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

// =============================================================================
// Agent Vacancy Types (unified for all agent overview pages)
// =============================================================================

export type AgentVacancyStatus = 'new' | 'generated' | 'published' | 'archived';

export interface AgentStatItem {
  key: string;
  label: string;
  value: number;
  description?: string | null;
  variant?: string | null;
  icon?: string | null;
  suffix?: string | null;
}

export interface AgentVacancy {
  id: string;
  title: string;
  company: string;
  location: string | null;
  status: string;
  created_at: string;
  agent_status: AgentVacancyStatus;
  agent_online: boolean | null;
  stats: AgentStatItem[];
  last_activity_at: string | null;
  recruiter: RecruiterSummary | null;
  client: ClientSummary | null;
}

export interface AgentDashboardStats {
  metrics: AgentStatItem[];
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
  // Publishing
  publishedAt?: string | null;  // When pre-screening was first published (null = never published)
  // Dates
  startDate?: string | null;    // Expected start date (ISO YYYY-MM-DD)
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
  open_questions_total: number;
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

// Application types (pre-screening results)
export type AnswerRating = 'excellent' | 'good' | 'average' | 'below_average' | 'weak';
export type ApplicationStatus = 'active' | 'processing' | 'completed' | 'abandoned';

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
  openQuestionsScore?: number;
  knockoutPassed?: number;
  knockoutTotal?: number;
  openQuestionsTotal?: number;
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
  is_playground?: boolean;
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
// Document Collection v2 Types (Workspace-Scoped)
// =============================================================================

export type CollectionStatus = 'active' | 'completed' | 'needs_review' | 'abandoned';
export type CollectionProgress = 'pending' | 'started' | 'in_progress';

export type CollectionGoal = 'collect_basic' | 'collect_and_sign' | 'document_renewal';

export interface DocumentCollectionResponse {
  id: string;
  config_id: string;
  workspace_id: string;
  vacancy_id?: string;
  vacancy_title?: string;
  application_id?: string;
  candidacy_stage?: CandidacyStage;
  goal: CollectionGoal;
  candidate_name: string;
  candidate_phone?: string;
  status: CollectionStatus;
  progress: CollectionProgress;
  channel: string;
  retry_count: number;
  message_count: number;
  documents_collected: number;
  documents_total: number;
  started_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface PaginatedCollectionsResponse {
  items: DocumentCollectionResponse[];
  total: number;
  limit: number;
  offset: number;
}

export type UploadStatus = 'pending' | 'verified' | 'rejected' | 'needs_review';
export type DocumentStatus = 'pending' | 'asked' | 'received' | 'verified' | 'failed' | 'skipped';

export interface CollectionMessageResponse {
  role: 'user' | 'agent' | 'system';
  message: string;
  created_at: string;
}

export interface CollectionUploadResponse {
  id: string;
  document_type_id?: string;
  document_side: 'front' | 'back' | 'single';
  verification_passed?: boolean;
  status: UploadStatus;
  uploaded_at: string;
}

export interface DocumentTypeResponse {
  id: string;
  workspace_id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  requires_front_back: boolean;
  is_verifiable: boolean;
  icon?: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// --- Collection item status (unified: documents + attributes + tasks) ---

export type CollectionItemType = 'document' | 'attribute' | 'task';

export interface CollectionItemStatusResponse {
  slug: string;
  name: string;
  type: CollectionItemType;
  priority: 'required' | 'recommended' | 'conditional';
  status: DocumentStatus;
  value?: string | Record<string, string>;  // For attributes: simple string or structured fields
  upload_id?: string;          // For documents: upload reference
  verification_passed?: boolean;
  uploaded_at?: string;
  scheduled_at?: string;       // For tasks: when the task is scheduled to execute
  group?: string;              // Visual grouping key (e.g. "identity")
}

// --- Workflow progress steps ---

export interface WorkflowStepResponse {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
}

// --- Full detail response ---

export interface DocumentCollectionFullDetailResponse extends DocumentCollectionResponse {
  candidacy_id?: string;
  candidate_id?: string;
  summary?: string;            // Plan summary for recruiter (Dutch)
  deadline_note?: string;      // e.g. "Start op 24 maart"
  collection_items: CollectionItemStatusResponse[];
  conversation_steps?: { step: number; type: string; description: string; completed: boolean; current: boolean }[];
  workflow_steps: WorkflowStepResponse[];
  messages: CollectionMessageResponse[];
  uploads: CollectionUploadResponse[];
  documents_required: DocumentTypeResponse[];
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

export interface APICandidateVacancyLink {
  id: string;
  title: string;
  company?: string;
  is_open_application: boolean;
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
  vacancies: APICandidateVacancyLink[];
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

// Candidacy summary (embedded in candidate detail)
export interface CandidacyApplicationBrief {
  id: string;
  channel: string;
  status: string;
  qualified?: boolean;
  open_questions_score?: number;
  knockout_passed: number;
  knockout_total: number;
  completed_at?: string;
}

export interface CandidacySummary {
  id: string;
  vacancy_id?: string;
  stage: CandidacyStage;
  source?: string;
  stage_updated_at: string;
  created_at: string;
  vacancy_title?: string;
  vacancy_company?: string;
  is_open_application: boolean;
  latest_application?: CandidacyApplicationBrief;
  screening_result?: ScreeningResult | null;
  document_collection?: DocumentCollectionSummary | null;
}

// Agent artifact types (embedded in candidacy)
export interface ScreeningResult {
  application_id: string;
  channel: string;
  status: string;
  qualified: boolean;
  summary?: string;
  interaction_seconds: number;
  knockout_passed: number;
  knockout_total: number;
  open_questions_score?: number;
  open_questions_total: number;
  completed_at?: string;
  answers: ScreeningAnswer[];
}

export interface ScreeningAnswer {
  question_id: string;
  question_text: string;
  question_type: 'knockout' | 'qualification';
  answer?: string;
  passed?: boolean;
  score?: number;
  rating?: AnswerRating;
  motivation?: string;
}

export interface DocumentCollectionSummary {
  collection_id: string;
  status: string;
  progress: string;
  documents_collected: number;
  documents_total: number;
  documents: DocumentCollectionItem[];
}

export interface DocumentCollectionItem {
  document_type_id: string;
  document_type_name: string;
  icon?: string;
  status: string;
  uploaded_at?: string;
}

// Document summary (embedded in candidate detail)
export interface DocumentSummary {
  id: string;
  document_type_id: string;
  document_type_name: string;
  document_type_slug?: string;
  document_number?: string;
  expiration_date?: string;
  status: string;
  verification_passed?: boolean;
  storage_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Attribute summary (embedded in candidate detail)
export interface AttributeSummary {
  id: string;
  attribute_type_id: string;
  slug: string;
  name: string;
  category: string;
  data_type: string;
  options?: { value: string; label: string }[];
  icon?: string;
  value?: string;
  source?: string;
  verified: boolean;
  created_at: string;
}

export interface APICandidateDetail extends APICandidateListItem {
  applications: APICandidateApplicationSummary[];
  candidacies: CandidacySummary[];
  attributes: AttributeSummary[];
  documents: DocumentSummary[];
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
  candidate_name?: string;  // Name of the candidate (for vacancy timelines)
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

// Applicant summary (lightweight candidate info for vacancy detail)
export interface APIApplicantSummary {
  id: string;
  name: string;
  phone?: string;
  channel: 'voice' | 'whatsapp' | 'cv';
  status: 'active' | 'processing' | 'completed';
  qualified: boolean;
  score?: number;        // Average qualification score (0-100)
  started_at: string;
  completed_at?: string;
}

export interface APIVacancyDetail extends APIVacancyListItem {
  timeline: APIActivityResponse[];
  applicants?: APIApplicantSummary[];  // Candidates who did pre-screening
}

// =============================================================================
// Activities Types (Global Activity Feed)
// =============================================================================

// Event types from API contract
export type ActivityEventType =
  // Screening lifecycle
  | 'screening_started'
  | 'screening_completed'
  | 'screening_abandoned'
  // Messages
  | 'message_sent'
  | 'message_received'
  // Voice calls
  | 'call_initiated'
  | 'call_completed'
  | 'call_failed'
  // Documents
  | 'document_uploaded'
  | 'document_verified'
  | 'document_rejected'
  | 'cv_uploaded'
  | 'cv_analyzed'
  // Application status
  | 'status_changed'
  | 'qualified'
  | 'disqualified'
  // Interview scheduling
  | 'interview_scheduled'
  | 'interview_confirmed'
  | 'interview_cancelled'
  | 'interview_rescheduled'
  | 'interview_completed'
  | 'interview_no_show'
  // Recruiter actions
  | 'note_added'
  | 'application_viewed'
  | 'candidate_contacted'
  // System events
  | 'application_synced';

export type ActivityActorType = 'agent' | 'candidate' | 'recruiter' | 'system';
export type ActivityChannel = 'whatsapp' | 'voice' | 'cv' | 'web';

export interface GlobalActivity {
  id: string;
  candidate_id: string;
  candidate_name?: string;
  application_id?: string;
  vacancy_id?: string;
  vacancy_title?: string;
  vacancy_company?: string;
  event_type: string;
  channel?: ActivityChannel;
  actor_type: ActivityActorType;
  actor_id?: string;
  metadata: Record<string, unknown>;
  summary?: string;
  created_at: string;
}

export interface GlobalActivitiesResponse {
  items: GlobalActivity[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// Generic Paginated Response
// =============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// Ontology Types
// =============================================================================

/** An available entity type from GET /ontology */
export interface OntologyTypeInfo {
  type: string;
  label: string;
  description: string;
  total: number;
  categories: string[];
}

/** GET /ontology response */
export interface OntologyOverview {
  types: OntologyTypeInfo[];
}

/** A single stat from GET /ontology/stats */
export interface OntologyStatItem {
  key: string;
  label: string;
  value: number;
  icon: string;
}

/** GET /ontology/stats response */
export interface OntologyStatsResponse {
  stats: OntologyStatItem[];
  document_categories: string[];
  attribute_categories: string[];
}

// ─── Integrations & Sync ─────────────────────────────────────────────────────

export interface Integration {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

export interface SyncWithEntry {
  id: string;
  integration_id: string;
  integration_slug: string;
  integration_name: string;
  external_id: string | null;
  external_metadata: Record<string, unknown> | null;
}

/** A child entity nested under a parent */
export interface OntologyChildEntity {
  id: string;
  slug: string;
  name: string;
  category: string;
  sort_order: number;
  metadata: Record<string, unknown>;
  sync_with?: SyncWithEntry[];
}

export type ScanMode = 'single' | 'front_back' | 'multi_page';

export interface ExtractField {
  name: string;
  description: string;
}

export interface VerificationConfig {
  check_expiry?: boolean;
  check_name?: boolean;
  additional_instructions?: string;
  extract_fields: ExtractField[];
}

export interface VerificationSchemaField {
  key: string;
  label: string;
  description: string;
  type: string;
}

export interface VerificationSchema {
  extract_fields: VerificationSchemaField[];
  config_fields: VerificationSchemaField[];
}

/** A parent entity from GET /ontology/entities */
export interface OntologyEntity {
  id: string;
  type: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  parent_id: string | null;
  is_verifiable: boolean;
  scan_mode: ScanMode;
  verification_config: VerificationConfig | null;
  ai_hint: string | null;
  metadata: Record<string, unknown>;
  children: OntologyChildEntity[];
  children_count: number;
  sync_with?: SyncWithEntry[];
}

/** GET /ontology/entities response */
export interface OntologyEntitiesResponse {
  type: string;
  items: OntologyEntity[];
  total: number;
  categories: string[];
}

// =============================================================================
// Candidate Attribute Types
// =============================================================================

export type AttributeCategory = 'legal' | 'transport' | 'availability' | 'financial' | 'personal' | 'general';
export type AttributeDataType = 'text' | 'boolean' | 'date' | 'select' | 'multi_select' | 'number' | 'structured';
export type AttributeCollectedBy = 'pre_screening' | 'contract' | 'document_collection';

export interface AttributeOption {
  value: string;
  label: string;
}

export interface AttributeFieldDefinition {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string | null;
  options?: string[] | null;
}

export interface AttributeType {
  id: string;
  workspace_id: string;
  slug: string;
  name: string;
  description: string | null;
  category: AttributeCategory;
  data_type: AttributeDataType;
  options: AttributeOption[] | null;
  fields: AttributeFieldDefinition[] | null;
  icon: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  collected_by: AttributeCollectedBy | null;
  ai_hint: string | null;
  sync_with?: SyncWithEntry[];
  created_at: string;
  updated_at: string;
}

export interface AttributeTypesResponse {
  items: AttributeType[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// ATS — Candidacy Types
// =============================================================================

export type CandidacyStage =
  | 'new'
  | 'pre_screening'
  | 'qualified'
  | 'interview_planned'
  | 'interview_done'
  | 'offer'
  | 'placed'
  | 'rejected'
  | 'withdrawn';

export interface CandidacyCandidate {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

export interface CandidacyVacancy {
  id: string;
  title: string;
  company: string | null;
  is_open_application?: boolean;
}

export interface CandidacyApplicationSummary {
  id: string;
  channel: 'voice' | 'whatsapp' | 'cv';
  qualified: boolean | null;
  open_questions_score: number | null; // 0–100
  knockout_passed: number;
  knockout_total: number;
  completed_at: string | null;
  interview_scheduled_at: string | null;
}

export interface LinkedVacancy {
  candidacy_id: string;
  vacancy_id: string;
  vacancy_title: string;
  stage: CandidacyStage;
}

export interface Candidacy {
  id: string;
  vacancy_id: string | null; // null = talent pool
  candidate_id: string;
  stage: CandidacyStage;
  source: string | null; // 'voice' | 'whatsapp' | 'cv' | 'manual' | 'import'
  stage_updated_at: string;
  created_at: string;
  updated_at: string;
  candidate: CandidacyCandidate;
  vacancy: CandidacyVacancy | null;
  latest_application: CandidacyApplicationSummary | null;
  linked_vacancies?: LinkedVacancy[];
  recruiter_verification: boolean;
  recruiter_verification_reason: string | null;
  contract_url: string | null;
}

export interface CandidaciesResponse {
  items: Candidacy[];
  total: number;
}

// ---------------------------------------------------------------------------
// Placements
// ---------------------------------------------------------------------------

export type PlacementRegime = 'full' | 'flex' | 'day';

export interface PlacementCreate {
  candidate_id: string;
  vacancy_id: string;
  client_id?: string;
  start_date?: string; // YYYY-MM-DD
  regime: PlacementRegime;
  contract_id?: string;
  create_contract?: boolean;
}
