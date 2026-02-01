# CV Application API - Frontend Integration Guide

Endpoint for creating job applications from uploaded CVs. The CV is analyzed against the vacancy's interview questions, and unanswered questions become clarification questions for follow-up.

## Overview

| Endpoint | Purpose |
|----------|---------|
| `POST /vacancies/{vacancy_id}/cv-application` | Upload CV, analyze, and create application |

---

## User Flow

```
┌─────────────────────────┐
│  1. Upload CV Form      │
│  - PDF/DOC/DOCX file    │
│  - First name, Last name│
│  - Email                │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  2. Loading State       │
│  "CV uploaden &         │
│   verwerken..."         │
│  (5-15 seconds)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  3. Result Screen       │
│  - All questions answered│
│    → Direct confirmation │
│  - Clarification needed  │
│    → Ask for follow-up   │
│    (WhatsApp / Call)     │
└─────────────────────────┘
```

---

## Endpoint: Create CV Application

```
POST /vacancies/{vacancy_id}/cv-application
Content-Type: application/json
```

### Request Body

```typescript
interface CVApplicationRequest {
  pdf_base64: string;        // Base64-encoded PDF/DOC/DOCX file
  candidate_name: string;    // Full name (e.g., "Kevin De Smet")
  candidate_phone?: string;  // Optional phone number
  candidate_email?: string;  // Optional email address
}
```

### Example Request

```json
{
  "pdf_base64": "JVBERi0xLjQKJeLjz9...",
  "candidate_name": "Kevin De Smet",
  "candidate_phone": "+32471234567",
  "candidate_email": "kevin.desmet@email.com"
}
```

### Response

```typescript
interface CVApplicationResponse {
  id: string;                    // Application UUID
  vacancy_id: string;
  candidate_name: string;
  channel: "cv";
  status: "completed";
  qualified: boolean;            // True if all knockout questions passed AND no clarification needed
  started_at: string;            // ISO 8601 datetime
  completed_at: string;
  interaction_seconds: number;   // Always 0 for CV applications
  answers: QuestionAnswer[];
  synced: boolean;
  knockout_passed: number;       // Count of knockout questions answered from CV
  knockout_total: number;        // Total knockout questions
  qualification_count: number;   // Count of qualification questions
  summary: string;               // AI-generated candidate profile summary
}

interface QuestionAnswer {
  question_id: string;           // e.g., "ko_1", "qual_2"
  question_text: string;         // The interview question
  question_type: "knockout" | "qualification";  // Type of question
  answer: string | null;         // CV evidence OR clarification question text
  passed: boolean | null;        // true=answered, null=needs clarification, false=failed
  score: number | null;          // 0-100 score (always set for both knockout and qualification)
  rating: string | null;         // "excellent", "good", "average", or "poor"
  motivation: string | null;     // AI-generated explanation for the score (mainly for qualification)
}
```

### Example Response

```json
{
  "id": "1878e0ea-bbef-4d66-a431-6710d1729600",
  "vacancy_id": "81e7f133-9594-41e0-a548-c93536bce031",
  "candidate_name": "Kevin De Smet",
  "channel": "cv",
  "status": "completed",
  "qualified": false,
  "started_at": "2026-02-01T18:40:28.197Z",
  "completed_at": "2026-02-01T18:40:28.197Z",
  "interaction_seconds": 0,
  "answers": [
    {
      "question_id": "ko_1",
      "question_text": "Mag je wettelijk werken in België?",
      "question_type": "knockout",
      "answer": "Nationaliteit: Belg. Geen werkvergunning vereist.",
      "passed": true,
      "score": 100,
      "rating": "excellent",
      "motivation": null
    },
    {
      "question_id": "ko_2",
      "question_text": "Ben je beschikbaar voor weekendwerk?",
      "question_type": "knockout",
      "answer": "Ben je beschikbaar voor weekendwerk?",
      "passed": null,
      "score": null,
      "rating": null,
      "motivation": null
    },
    {
      "question_id": "qual_1",
      "question_text": "Hoeveel jaar ervaring heb je?",
      "question_type": "qualification",
      "answer": "8+ jaar ervaring als productieoperator in industriële omgeving.",
      "passed": null,
      "score": 80,
      "rating": "good",
      "motivation": "De kandidaat heeft ruime ervaring in industriële productie. Voor een hogere score zou meer specifieke ervaring met de gevraagde taken nodig zijn."
    }
  ],
  "synced": false,
  "knockout_passed": 1,
  "knockout_total": 2,
  "qualification_count": 3,
  "summary": "Kevin De Smet is een gemotiveerde productieoperator met 8+ jaar ervaring in industriële productieomgevingen."
}
```

---

## Determining If Follow-up Is Needed

Check if any questions need clarification:

```typescript
function needsClarification(response: CVApplicationResponse): boolean {
  return response.answers.some(a => a.passed === null);
}

function getClarificationQuestions(response: CVApplicationResponse): string[] {
  return response.answers
    .filter(a => a.passed === null)
    .map(a => a.answer || a.question_text);
}
```

---

## Frontend Implementation

### 1. File Upload & Conversion

```typescript
async function fileToBase64(file: File): Promise<string> {
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

// Validate file type
function isValidCVFile(file: File): boolean {
  const validTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return validTypes.includes(file.type);
}
```

### 2. Form Submission

```typescript
interface CVFormData {
  file: File;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

async function submitCVApplication(
  vacancyId: string,
  formData: CVFormData
): Promise<CVApplicationResponse> {
  // Validate file
  if (!isValidCVFile(formData.file)) {
    throw new Error('Ongeldig bestandstype. Upload een PDF, DOC of DOCX.');
  }

  // Convert to base64
  const pdfBase64 = await fileToBase64(formData.file);

  // Submit to API
  const response = await fetch(`/vacancies/${vacancyId}/cv-application`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdf_base64: pdfBase64,
      candidate_name: `${formData.firstName} ${formData.lastName}`,
      candidate_email: formData.email,
      candidate_phone: formData.phone,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Er ging iets mis bij het verwerken van je CV.');
  }

  return response.json();
}
```

### 3. React Component Example

```tsx
import { useState } from 'react';

type Step = 'form' | 'loading' | 'result';

interface ResultState {
  applicationId: string;
  needsClarification: boolean;
  clarificationCount: number;
  summary: string;
}

function CVApplicationForm({ vacancyId }: { vacancyId: string }) {
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: CVFormData) => {
    setStep('loading');
    setError(null);

    try {
      const response = await submitCVApplication(vacancyId, formData);
      
      const clarificationQuestions = response.answers.filter(a => a.passed === null);
      
      setResult({
        applicationId: response.id,
        needsClarification: clarificationQuestions.length > 0,
        clarificationCount: clarificationQuestions.length,
        summary: response.summary,
      });
      setStep('result');
    } catch (err) {
      setError(err.message);
      setStep('form');
    }
  };

  if (step === 'loading') {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <h2 className="text-xl font-semibold mt-4">CV uploaden & verwerken</h2>
        <p className="text-gray-500 mt-2">Even geduld, we analyseren je CV...</p>
      </div>
    );
  }

  if (step === 'result' && result) {
    if (result.needsClarification) {
      return <ClarificationScreen 
        applicationId={result.applicationId}
        questionCount={result.clarificationCount}
      />;
    }
    return <SuccessScreen summary={result.summary} />;
  }

  return <UploadForm onSubmit={handleSubmit} error={error} />;
}
```

### 4. Clarification Screen

```tsx
interface ClarificationScreenProps {
  applicationId: string;
  questionCount: number;
}

function ClarificationScreen({ applicationId, questionCount }: ClarificationScreenProps) {
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'call'>('whatsapp');
  const [phone, setPhone] = useState('');

  const handleContactRequest = async () => {
    // TODO: Call endpoint to initiate WhatsApp/voice follow-up
    // This will be the next phase of implementation
    console.log('Request contact:', { applicationId, contactMethod, phone });
  };

  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckIcon className="w-6 h-6 text-green-600" />
      </div>
      
      <h2 className="text-xl font-semibold mt-4">
        Op basis van je CV hebben we nog een paar vragen
      </h2>
      
      <p className="text-gray-500 mt-2 max-w-md mx-auto">
        Mag Izzy, onze digitale assistent, contact met je opnemen? 
        Bij een match kun je binnen 3 dagen een gesprek inplannen met de recruiter.
      </p>

      {/* Contact method toggle */}
      <div className="flex gap-2 justify-center mt-6">
        <button
          onClick={() => setContactMethod('whatsapp')}
          className={`px-4 py-2 rounded-full border ${
            contactMethod === 'whatsapp' ? 'border-gray-900' : 'border-gray-300'
          }`}
        >
          <WhatsAppIcon className="inline w-4 h-4 mr-2" />
          WhatsApp
        </button>
        <button
          onClick={() => setContactMethod('call')}
          className={`px-4 py-2 rounded-full border ${
            contactMethod === 'call' ? 'border-gray-900' : 'border-gray-300'
          }`}
        >
          <PhoneIcon className="inline w-4 h-4 mr-2" />
          Bellen
        </button>
      </div>

      {/* Phone input */}
      <div className="mt-4 max-w-xs mx-auto">
        <div className="flex items-center border rounded-lg px-3 py-2">
          <span className="text-gray-500 mr-2">🇧🇪 +32</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="471 23 45 67"
            className="flex-1 outline-none"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center mt-6">
        <button className="px-6 py-2 border rounded-lg">
          Nee, bedankt
        </button>
        <button
          onClick={handleContactRequest}
          className="px-6 py-2 bg-lime-300 rounded-lg font-medium"
        >
          {contactMethod === 'whatsapp' ? 'WhatsApp mij' : 'Bel mij'}
        </button>
      </div>
    </div>
  );
}
```

---

## Error Handling

| Status | Detail | User Message |
|--------|--------|--------------|
| 400 | Invalid vacancy ID format | "Ongeldige vacature." |
| 404 | Vacancy not found | "Vacature niet gevonden." |
| 404 | No pre-screening found | "Deze vacature accepteert nog geen sollicitaties." |
| 400 | No interview questions | "De interviewvragen zijn nog niet geconfigureerd." |
| 500 | CV analysis failed | "Er ging iets mis bij het analyseren van je CV. Probeer opnieuw." |

```typescript
function getErrorMessage(status: number, detail: string): string {
  const messages: Record<number, string> = {
    400: 'Ongeldige gegevens. Controleer je invoer.',
    404: 'Vacature niet gevonden of nog niet beschikbaar.',
    500: 'Er ging iets mis. Probeer het later opnieuw.',
  };
  return messages[status] || 'Er ging iets mis.';
}
```

---

## TypeScript Types

```typescript
// Request
interface CVApplicationRequest {
  pdf_base64: string;
  candidate_name: string;
  candidate_phone?: string;
  candidate_email?: string;
}

// Response
interface CVApplicationResponse {
  id: string;
  vacancy_id: string;
  candidate_name: string;
  channel: 'cv';
  status: 'completed';
  qualified: boolean;
  started_at: string;
  completed_at: string;
  interaction_seconds: number;
  answers: QuestionAnswer[];
  synced: boolean;
  knockout_passed: number;
  knockout_total: number;
  qualification_count: number;
  summary: string;
}

interface QuestionAnswer {
  question_id: string;
  question_text: string;
  question_type: "knockout" | "qualification";
  answer: string | null;
  passed: boolean | null;
  score: number | null;
  rating: "excellent" | "good" | "average" | "poor" | null;
  motivation: string | null;
}

// Helper type for result state
interface CVAnalysisResult {
  applicationId: string;
  summary: string;
  needsClarification: boolean;
  answeredQuestions: QuestionAnswer[];
  clarificationQuestions: QuestionAnswer[];
}

function parseCVResponse(response: CVApplicationResponse): CVAnalysisResult {
  const answered = response.answers.filter(a => a.passed !== null);
  const clarification = response.answers.filter(a => a.passed === null);
  
  return {
    applicationId: response.id,
    summary: response.summary,
    needsClarification: clarification.length > 0,
    answeredQuestions: answered,
    clarificationQuestions: clarification,
  };
}
```

---

## Notes

1. **Processing Time**: CV analysis typically takes 5-15 seconds depending on document size and complexity.

2. **File Size**: While there's no hard limit, recommend compressing PDFs > 10MB for faster processing.

3. **Supported Formats**: PDF is fully supported. DOC/DOCX support depends on backend conversion (currently PDF only).

4. **Language**: All responses are in Dutch (Vlaams nl-BE).

5. **Qualified Status**: `qualified=true` only when ALL knockout questions are answered AND no clarification is needed.

6. **Answer Interpretation**:
   - `passed=true`: Question answered from CV (answer contains CV evidence)
   - `passed=null`: Needs clarification (answer contains the clarification question)
   - `passed=false`: Knockout question failed (rare for CV, usually null)
