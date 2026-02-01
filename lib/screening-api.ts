/**
 * Outbound Screening API
 * 
 * API client for initiating outbound voice calls and WhatsApp conversations
 * with candidates directly from the dashboard.
 */

import type { 
  CVApplicationRequest, 
  CVApplicationResponse, 
  CVAnalysisResult, 
  CVQuestionAnswer 
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// =============================================================================
// Types
// =============================================================================

export type ScreeningChannel = 'voice' | 'whatsapp';

export interface OutboundScreeningRequest {
  vacancy_id: string;
  channel: ScreeningChannel;
  phone_number: string;    // E.164 format, e.g., "+31612345678"
  first_name?: string;     // Optional, used for personalization
  last_name?: string;      // Optional, used for personalization
  is_test?: boolean;       // Optional, marks conversation as test
}

export interface OutboundScreeningResponse {
  success: boolean;
  message: string;
  channel: ScreeningChannel;
  conversation_id: string | null;
  // Voice-specific
  call_sid: string | null;
  // WhatsApp-specific
  whatsapp_message_sid: string | null;
}

// =============================================================================
// API Function
// =============================================================================

/**
 * Initiate an outbound screening call or WhatsApp message to a candidate.
 * 
 * @param request - The outbound screening request parameters
 * @returns The response with conversation/call details
 * @throws Error with message from the API if the request fails
 */
export async function initiateOutboundScreening(
  request: OutboundScreeningRequest
): Promise<OutboundScreeningResponse> {
  const response = await fetch(`${API_BASE}/screening/outbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to initiate screening' }));
    throw new Error(error.detail || 'Failed to initiate screening');
  }

  return response.json();
}

// =============================================================================
// Phone Number Utilities
// =============================================================================

/**
 * Validate a phone number in E.164 format.
 * E.164 format: +[country code][subscriber number]
 * Example: +31612345678, +32471234567
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic E.164 validation: + followed by 7-15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  const normalized = phone.replace(/\s/g, '');
  return e164Regex.test(normalized.startsWith('+') ? normalized : `+${normalized}`);
}

/**
 * Format a phone number to E.164 format.
 * Removes spaces and ensures + prefix.
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all spaces
  const cleaned = phone.replace(/\s/g, '');
  // Ensure + prefix
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

// =============================================================================
// Error Message Mapping
// =============================================================================

/**
 * Map backend error messages to user-friendly Dutch messages.
 */
export function getScreeningErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'No pre-screening configured for this vacancy': 
      'Deze vacature heeft nog geen screening. Stel eerst vragen in.',
    'Pre-screening is not published yet': 
      'De screening is nog niet gepubliceerd.',
    'Pre-screening is offline': 
      'De screening staat offline. Zet hem eerst online.',
    'Voice agent not configured': 
      'Voice is niet geconfigureerd. Publiceer opnieuw met voice ingeschakeld.',
    'WhatsApp agent not configured': 
      'WhatsApp is niet geconfigureerd. Publiceer opnieuw met WhatsApp ingeschakeld.',
    'TWILIO_WHATSAPP_NUMBER not configured': 
      'WhatsApp is niet geconfigureerd op de server.',
    'Invalid phone number format':
      'Ongeldig telefoonnummer formaat. Gebruik internationaal formaat (bijv. +32471234567).',
  };

  return errorMap[error] || error;
}

// =============================================================================
// CV Application API
// =============================================================================

/**
 * Convert a File to base64 string (without the data URL prefix).
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

/**
 * Validate file type for CV upload.
 */
export function isValidCVFile(file: File): boolean {
  const validTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return validTypes.includes(file.type);
}

export interface CVFormData {
  file: File;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

/**
 * Submit a CV application for a vacancy.
 * 
 * @param vacancyId - The vacancy UUID
 * @param formData - The CV form data including file and candidate details
 * @returns The CV application response with analysis results
 * @throws Error with message if the request fails
 */
export async function submitCVApplication(
  vacancyId: string,
  formData: CVFormData
): Promise<CVApplicationResponse> {
  // Validate file type
  if (!isValidCVFile(formData.file)) {
    throw new Error('Ongeldig bestandstype. Upload een PDF, DOC of DOCX.');
  }

  // Convert file to base64
  const pdfBase64 = await fileToBase64(formData.file);

  // Build request body
  const requestBody: CVApplicationRequest = {
    pdf_base64: pdfBase64,
    candidate_name: `${formData.firstName} ${formData.lastName}`,
    candidate_email: formData.email,
    candidate_phone: formData.phone,
  };

  // Submit to API
  const response = await fetch(`${API_BASE}/vacancies/${vacancyId}/cv-application`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Er ging iets mis bij het verwerken van je CV.' }));
    throw new Error(getCVApplicationErrorMessage(response.status, error.detail));
  }

  return response.json();
}

/**
 * Check if a question needs clarification.
 * A question needs clarification when:
 * - passed is null (not answered definitively)
 * - AND score is null (no CV-based score)
 * - AND rating is null (no CV-based rating)
 * 
 * If a question has passed=null but has a score/rating, it was answered from the CV.
 */
function questionNeedsClarification(answer: CVQuestionAnswer): boolean {
  return answer.passed === null && answer.score === null && answer.rating === null;
}

/**
 * Parse CV application response into a more usable result format.
 */
export function parseCVResponse(response: CVApplicationResponse): CVAnalysisResult {
  // If qualified is true, the candidate passed - no clarification needed
  if (response.qualified) {
    return {
      applicationId: response.id,
      summary: response.summary,
      needsClarification: false,
      answeredQuestions: response.answers,
      clarificationQuestions: [],
      meetingSlots: response.meeting_slots || [],
    };
  }
  
  // Otherwise, find questions that actually need clarification
  const clarification = response.answers.filter(questionNeedsClarification);
  const answered = response.answers.filter(a => !questionNeedsClarification(a));
  
  return {
    applicationId: response.id,
    summary: response.summary,
    needsClarification: clarification.length > 0,
    answeredQuestions: answered,
    clarificationQuestions: clarification,
    meetingSlots: response.meeting_slots || [],
  };
}

/**
 * Get clarification questions from a CV application response.
 */
export function getClarificationQuestions(response: CVApplicationResponse): CVQuestionAnswer[] {
  if (response.qualified) return [];
  return response.answers.filter(questionNeedsClarification);
}

/**
 * Check if a CV application needs follow-up clarification.
 */
export function needsClarification(response: CVApplicationResponse): boolean {
  if (response.qualified) return false;
  return response.answers.some(questionNeedsClarification);
}

/**
 * Map CV application error status codes to user-friendly Dutch messages.
 */
export function getCVApplicationErrorMessage(status: number, detail?: string): string {
  const messages: Record<number, string> = {
    400: detail?.includes('Invalid vacancy') 
      ? 'Ongeldige vacature.' 
      : 'Ongeldige gegevens. Controleer je invoer.',
    404: detail?.includes('No pre-screening') 
      ? 'Deze vacature accepteert nog geen sollicitaties.' 
      : 'Vacature niet gevonden.',
    500: 'Er ging iets mis bij het analyseren van je CV. Probeer opnieuw.',
  };
  return messages[status] || detail || 'Er ging iets mis.';
}
