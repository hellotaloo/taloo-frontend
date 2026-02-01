# Frontend Integration: Outbound Screening

Guide for implementing outbound voice calls and WhatsApp conversations in the frontend.

## Overview

The outbound screening feature allows recruiters to initiate screening conversations with candidates directly from the dashboard. A single API endpoint handles both channels:

- **Voice**: Triggers an automated phone call to the candidate
- **WhatsApp**: Sends an initial WhatsApp message to start the conversation

## API Endpoint

```
POST /screening/outbound
```

### Request

```typescript
interface OutboundScreeningRequest {
  vacancy_id: string;      // UUID of the vacancy
  channel: 'voice' | 'whatsapp';
  phone_number: string;    // E.164 format, e.g., "+31612345678"
  first_name?: string;     // Optional, used for personalization
  last_name?: string;      // Optional, used for personalization
}
```

### Response

```typescript
interface OutboundScreeningResponse {
  success: boolean;
  message: string;
  channel: 'voice' | 'whatsapp';
  conversation_id: string | null;
  // Voice-specific
  call_sid: string | null;
  // WhatsApp-specific
  whatsapp_message_sid: string | null;
}
```

## Implementation

### TypeScript Service

```typescript
// services/screening.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://taloo-agent-182581851450.europe-west1.run.app';

export type ScreeningChannel = 'voice' | 'whatsapp';

export interface OutboundScreeningRequest {
  vacancy_id: string;
  channel: ScreeningChannel;
  phone_number: string;
  first_name?: string;
  last_name?: string;
}

export interface OutboundScreeningResponse {
  success: boolean;
  message: string;
  channel: ScreeningChannel;
  conversation_id: string | null;
  call_sid: string | null;
  whatsapp_message_sid: string | null;
}

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
    const error = await response.json();
    throw new Error(error.detail || 'Failed to initiate screening');
  }

  return response.json();
}
```

### React Component Example

```tsx
// components/OutboundScreeningButton.tsx

import { useState } from 'react';
import { initiateOutboundScreening, ScreeningChannel } from '@/services/screening';
import { Phone, MessageCircle, Loader2 } from 'lucide-react';

interface Props {
  vacancyId: string;
  firstName?: string;
  lastName?: string;
  candidatePhone: string;
}

export function OutboundScreeningButton({ vacancyId, firstName, lastName, candidatePhone }: Props) {
  const [loading, setLoading] = useState<ScreeningChannel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInitiate = async (channel: ScreeningChannel) => {
    setLoading(channel);
    setError(null);
    setSuccess(null);

    try {
      const result = await initiateOutboundScreening({
        vacancy_id: vacancyId,
        channel,
        phone_number: candidatePhone,
        first_name: firstName,
        last_name: lastName,
      });

      if (result.success) {
        setSuccess(
          channel === 'voice'
            ? 'Telefoongesprek gestart! De kandidaat wordt nu gebeld.'
            : 'WhatsApp bericht verzonden!'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => handleInitiate('voice')}
          disabled={loading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading === 'voice' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Phone className="w-4 h-4" />
          )}
          Bel kandidaat
        </button>

        <button
          onClick={() => handleInitiate('whatsapp')}
          disabled={loading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading === 'whatsapp' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          WhatsApp
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}
    </div>
  );
}
```

### Modal with Phone Input

```tsx
// components/OutboundScreeningModal.tsx

import { useState } from 'react';
import { initiateOutboundScreening, ScreeningChannel } from '@/services/screening';

interface Props {
  vacancyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (conversationId: string) => void;
}

export function OutboundScreeningModal({ vacancyId, isOpen, onClose, onSuccess }: Props) {
  const [channel, setChannel] = useState<ScreeningChannel>('whatsapp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Normalize phone number
    let phone = phoneNumber.trim();
    if (!phone.startsWith('+')) {
      phone = `+${phone}`;
    }

    try {
      const result = await initiateOutboundScreening({
        vacancy_id: vacancyId,
        channel,
        phone_number: phone,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });

      if (result.success && result.conversation_id) {
        onSuccess?.(result.conversation_id);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Start screening</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Kanaal</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 ${
                  channel === 'whatsapp'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                📱 WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel('voice')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 ${
                  channel === 'voice'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                📞 Telefoon
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Telefoonnummer *
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+31612345678"
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              In internationaal formaat (bijv. +31612345678)
            </p>
          </div>

          {/* Candidate Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Voornaam
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jan"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Achternaam
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Janssen"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Bezig...' : 'Start screening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## Error Handling

The API returns specific error messages that you should handle in the UI:

| Error Message | User-Friendly Message |
|---------------|----------------------|
| `No pre-screening configured for this vacancy` | Deze vacature heeft nog geen screening. Stel eerst vragen in. |
| `Pre-screening is not published yet` | De screening is nog niet gepubliceerd. |
| `Pre-screening is offline` | De screening staat offline. Zet hem eerst online. |
| `Voice agent not configured` | Voice is niet geconfigureerd. Publiceer opnieuw met voice aan. |
| `WhatsApp agent not configured` | WhatsApp is niet geconfigureerd. Publiceer opnieuw met WhatsApp aan. |
| `TWILIO_WHATSAPP_NUMBER not configured` | WhatsApp is niet geconfigureerd op de server. |

```typescript
// Error handling utility
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
  };

  return errorMap[error] || error;
}
```

## Phone Number Validation

Validate phone numbers before sending to the API:

```typescript
export function isValidPhoneNumber(phone: string): boolean {
  // Basic E.164 validation
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  const normalized = phone.replace(/\s/g, '');
  return e164Regex.test(normalized.startsWith('+') ? normalized : `+${normalized}`);
}

export function formatPhoneNumber(phone: string): string {
  // Remove spaces and ensure + prefix
  const cleaned = phone.replace(/\s/g, '');
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}
```

## UI States

### Pre-Screening Status Check

Before showing the outbound buttons, check if the vacancy has a published, online pre-screening:

```typescript
// From GET /vacancies/{id} response
interface Vacancy {
  id: string;
  title: string;
  has_screening: boolean;
  channels: {
    voice: boolean;
    whatsapp: boolean;
  };
}

// Show buttons based on available channels
{vacancy.channels.voice && (
  <button onClick={() => handleInitiate('voice')}>
    📞 Bel kandidaat
  </button>
)}

{vacancy.channels.whatsapp && (
  <button onClick={() => handleInitiate('whatsapp')}>
    📱 WhatsApp
  </button>
)}

{!vacancy.has_screening && (
  <p className="text-gray-500">
    Configureer eerst een pre-screening voor deze vacature
  </p>
)}
```

### Loading States

Show appropriate loading states during the API call:

```tsx
<button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="animate-spin" />
      {channel === 'voice' ? 'Bellen...' : 'Verzenden...'}
    </>
  ) : (
    <>
      {channel === 'voice' ? '📞 Bel kandidaat' : '📱 WhatsApp'}
    </>
  )}
</button>
```

### Success Feedback

After successful initiation, show appropriate feedback:

- **Voice**: "De kandidaat wordt nu gebeld. Het gesprek wordt automatisch gevoerd."
- **WhatsApp**: "WhatsApp bericht verzonden! De kandidaat kan nu reageren."

Optionally redirect to the conversation view:

```typescript
if (result.success && result.conversation_id) {
  // For WhatsApp, you can redirect to the conversation
  router.push(`/vacancies/${vacancyId}/conversations/${result.conversation_id}`);
}
```

## Testing

### Test Phone Numbers

For testing, use your own verified phone numbers:

- Voice calls will ring your phone immediately
- WhatsApp messages will appear in your WhatsApp

### Sandbox Testing

Use Twilio's WhatsApp sandbox for development:
1. Send "join <sandbox-code>" to the Twilio sandbox number
2. Your number is now connected to the sandbox
3. Outbound messages will work

## Sequence Diagram

```
┌──────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│ Frontend │     │   API   │     │ Twilio/ │     │Candidate │
│          │     │         │     │ElevenLabs│    │          │
└────┬─────┘     └────┬────┘     └────┬────┘     └────┬─────┘
     │                │               │               │
     │ POST /screening/outbound       │               │
     │ {vacancy_id, channel, phone}   │               │
     │───────────────>│               │               │
     │                │               │               │
     │                │ Initiate call/message         │
     │                │──────────────>│               │
     │                │               │               │
     │                │    OK         │               │
     │                │<──────────────│               │
     │                │               │               │
     │ {success: true, conversation_id}               │
     │<───────────────│               │               │
     │                │               │  Ring/Message │
     │                │               │──────────────>│
     │                │               │               │
     │ Show success   │               │               │
     │ message        │               │               │
     │                │               │               │
```

## Related Endpoints

- `GET /vacancies` - List vacancies with `channels.voice` and `channels.whatsapp` availability
- `GET /vacancies/{id}/conversations` - List conversations for a vacancy
- `GET /screening/conversations/{id}` - Get conversation details and messages
