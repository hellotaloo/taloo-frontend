// Vacancy types
export type VacancyStatus = 'new' | 'draft' | 'in_progress' | 'agent_created' | 'screening_active' | 'archived';
export type VacancySource = 'salesforce' | 'bullhorn' | 'manual';

export interface VacancyChannels {
  voice: boolean;
  whatsapp: boolean;
  cv: boolean;
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
  isOnline: boolean | null;     // null=draft, true=online, false=offline
  channels: VacancyChannels;    // Active channels for this pre-screening
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
