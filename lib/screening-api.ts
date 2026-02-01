/**
 * Outbound Screening API
 * 
 * API client for initiating outbound voice calls and WhatsApp conversations
 * with candidates directly from the dashboard.
 */

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
