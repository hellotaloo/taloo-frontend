# Pre-Screening API

This document describes the API endpoints for saving and managing generated pre-screening questions for vacancies.

## Database Schema

```
vacancies
    │
    └── pre_screenings (1:1)
            │
            └── pre_screening_questions (1:many)
                    │
applications ───────┘ (references pre_screening_id)
        │
        └── application_answers (references pre_screening_question_id)
```

### Tables

#### `pre_screenings`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| vacancy_id | UUID | Foreign key to vacancies (unique, 1:1) |
| intro | TEXT | Introduction message for candidates |
| knockout_failed_action | TEXT | Message when candidate fails knockout |
| final_action | TEXT | Action after successful completion |
| status | TEXT | 'draft', 'active', or 'archived' |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### `pre_screening_questions`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| pre_screening_id | UUID | Foreign key to pre_screenings |
| question_type | TEXT | 'knockout' or 'qualification' |
| position | INTEGER | Order within type (0-indexed) |
| question_text | TEXT | The actual question |
| is_approved | BOOLEAN | Whether user approved this question |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

## Data Structures

### TypeScript Types

```typescript
interface PreScreeningQuestion {
  id: string;              // Database UUID
  question_type: 'knockout' | 'qualification';
  position: number;
  question_text: string;
  is_approved: boolean;
}

interface PreScreening {
  id: string;              // Pre-screening UUID
  vacancy_id: string;
  intro: string;
  knockout_questions: PreScreeningQuestion[];
  knockout_failed_action: string;
  qualification_questions: PreScreeningQuestion[];
  final_action: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;      // ISO 8601
  updated_at: string;      // ISO 8601
}

interface Vacancy {
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
  has_pre_screening: boolean;  // True if pre-screening exists
}
```

---

## Endpoints

### 1. Save Pre-Screening Configuration

```
PUT /vacancies/{vacancy_id}/pre-screening
```

Creates or updates the pre-screening configuration for a vacancy. Inserts questions into the `pre_screening_questions` table. Sets vacancy status to `agent_created`.

**Request Body:**
```json
{
  "intro": "Hallo! Leuk dat je solliciteert. Ben je klaar voor een paar korte vragen?",
  "knockout_questions": [
    { "id": "ko_1", "question": "Ben je in het bezit van een geldige Belgische werkvergunning?" },
    { "id": "ko_2", "question": "Kan je werken in een 2-ploegensysteem?" }
  ],
  "knockout_failed_action": "Helaas voldoe je niet aan de basisvereisten. Interesse in andere matches?",
  "qualification_questions": [
    { "id": "qual_1", "question": "Welke ervaring heb je met productiemachines?" },
    { "id": "qual_2", "question": "Kan je een voorbeeld geven van hoe je een storing hebt opgelost?" }
  ],
  "final_action": "Perfect! We plannen een gesprek met de recruiter.",
  "approved_ids": ["ko_1", "ko_2", "qual_1"]
}
```

**Note:** The `id` field in questions (e.g., "ko_1") is only used to match `approved_ids`. The database generates its own UUIDs for each question.

**Response (200):**
```json
{
  "status": "success",
  "message": "Pre-screening configuration saved",
  "pre_screening_id": "8db32ea5-9691-458f-b600-8a5e5a5b1c70",
  "vacancy_id": "5779f190-6d45-4007-8719-bbc63dfc2944",
  "vacancy_status": "agent_created"
}
```

**Errors:**
- `400` - Invalid vacancy ID format
- `404` - Vacancy not found

---

### 2. Get Pre-Screening Configuration

```
GET /vacancies/{vacancy_id}/pre-screening
```

Retrieves the pre-screening configuration including all questions.

**Response (200):**
```json
{
  "id": "8db32ea5-9691-458f-b600-8a5e5a5b1c70",
  "vacancy_id": "5779f190-6d45-4007-8719-bbc63dfc2944",
  "intro": "Hallo! Leuk dat je solliciteert.",
  "knockout_questions": [
    {
      "id": "58130b5b-35c5-4a46-ad97-5337ec3fdf73",
      "question_type": "knockout",
      "position": 0,
      "question_text": "Heb je een Belgische werkvergunning?",
      "is_approved": true
    },
    {
      "id": "ea78a8ae-b3b3-4910-91d5-bce0c01a9c24",
      "question_type": "knockout",
      "position": 1,
      "question_text": "Kan je in ploegen werken?",
      "is_approved": false
    }
  ],
  "knockout_failed_action": "Helaas voldoe je niet aan de vereisten.",
  "qualification_questions": [
    {
      "id": "1c76abde-e34e-417b-8265-175ece65b6b5",
      "question_type": "qualification",
      "position": 0,
      "question_text": "Welke ervaring heb je?",
      "is_approved": false
    }
  ],
  "final_action": "We plannen een gesprek.",
  "status": "active",
  "created_at": "2026-01-30T13:59:43.290146Z",
  "updated_at": "2026-01-30T13:59:43.290146Z"
}
```

**Errors:**
- `400` - Invalid vacancy ID format
- `404` - No pre-screening found for this vacancy

---

### 3. Delete Pre-Screening Configuration

```
DELETE /vacancies/{vacancy_id}/pre-screening
```

Deletes the pre-screening and all its questions. Resets vacancy status to `new`.

**Response (200):**
```json
{
  "status": "success",
  "message": "Pre-screening configuration deleted",
  "vacancy_id": "5779f190-6d45-4007-8719-bbc63dfc2944",
  "vacancy_status": "new"
}
```

**Errors:**
- `400` - Invalid vacancy ID format
- `404` - No pre-screening found for this vacancy

---

## Frontend Integration

### API Client (`lib/pre-screening-api.ts`)

```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// Types
export interface PreScreeningQuestionInput {
  id: string;      // Client ID for matching approved_ids
  question: string;
}

export interface PreScreeningQuestion {
  id: string;      // Database UUID
  question_type: 'knockout' | 'qualification';
  position: number;
  question_text: string;
  is_approved: boolean;
}

export interface PreScreeningInput {
  intro: string;
  knockout_questions: PreScreeningQuestionInput[];
  knockout_failed_action: string;
  qualification_questions: PreScreeningQuestionInput[];
  final_action: string;
  approved_ids: string[];
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

// Save pre-screening to vacancy
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

// Get pre-screening for vacancy
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

// Delete pre-screening
export async function deletePreScreening(vacancyId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/vacancies/${vacancyId}/pre-screening`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete pre-screening');
  }
}
```

---

## UI Integration Flow

### Page: Pre-Screening Generator (`/interviews/generate/[id]`)

```tsx
// 1. Load vacancy and check for existing pre-screening
const vacancy = await getVacancy(vacancyId);
const existingPreScreening = await getPreScreening(vacancyId);

if (existingPreScreening) {
  // Show existing config with edit option
  setPreScreening(existingPreScreening);
  setIsEditing(true);
} else {
  // Show generate button
  setShowGenerateUI(true);
}

// 2. After AI generation, map to save format
const handleSave = async () => {
  try {
    // Map from AI output format to API format
    const config: PreScreeningInput = {
      intro: generatedInterview.intro,
      knockout_questions: generatedInterview.knockout_questions.map(q => ({
        id: q.id,
        question: q.question
      })),
      knockout_failed_action: generatedInterview.knockout_failed_action,
      qualification_questions: generatedInterview.qualification_questions.map(q => ({
        id: q.id,
        question: q.question
      })),
      final_action: generatedInterview.final_action,
      approved_ids: generatedInterview.approved_ids || [],
    };

    const result = await savePreScreening(vacancyId, config);
    
    toast.success('Pre-screening opgeslagen!');
    router.push('/interviews');
  } catch (error) {
    toast.error(error.message);
  }
};
```

### Page: Vacancy List (`/interviews`)

```tsx
// Show status badges based on has_pre_screening
{vacancy.has_pre_screening ? (
  <Badge variant="success">Pre-screening klaar</Badge>
) : (
  <Badge variant="outline">Nieuw</Badge>
)}

// Filter vacancies
const newVacancies = vacancies.filter(v => !v.has_pre_screening);
const configuredVacancies = vacancies.filter(v => v.has_pre_screening);
```

---

## Workflow States

| Vacancy Status | has_pre_screening | Description |
|----------------|-------------------|-------------|
| `new` | `false` | Fresh vacancy, needs pre-screening generation |
| `in_progress` | `false` | Generation started but not saved |
| `agent_created` | `true` | Pre-screening saved, ready for candidates |
| `archived` | `true/false` | No longer active |

---

## Connecting to Interview Generation

The interview generator agent (`/interview/generate`) stores its output in session state. After generation, the frontend should:

1. Call `/interview/generate` (SSE) to generate questions
2. Let user review/edit questions in UI
3. Call `PUT /vacancies/{id}/pre-screening` to persist to database

The session-based generation endpoints remain for the interactive editing flow:
- `POST /interview/generate` - Generate new questions (SSE)
- `POST /interview/feedback` - Process user feedback (SSE)
- `GET /interview/session/{session_id}` - Get current session state
- `POST /interview/reorder` - Reorder questions in session
- `POST /interview/delete` - Delete question from session

---

## Testing

```bash
# Reset demo data
curl -X POST "http://localhost:8080/demo/reset"

# Get a vacancy ID
VACANCY_ID=$(curl -s "http://localhost:8080/vacancies" | python3 -c "import sys,json; print(json.load(sys.stdin)['vacancies'][0]['id'])")

# Save pre-screening
curl -X PUT "http://localhost:8080/vacancies/$VACANCY_ID/pre-screening" \
  -H "Content-Type: application/json" \
  -d '{
    "intro": "Hallo!",
    "knockout_questions": [{"id": "ko_1", "question": "Heb je werkvergunning?"}],
    "knockout_failed_action": "Helaas.",
    "qualification_questions": [{"id": "qual_1", "question": "Ervaring?"}],
    "final_action": "We bellen je.",
    "approved_ids": ["ko_1"]
  }'

# Get pre-screening
curl "http://localhost:8080/vacancies/$VACANCY_ID/pre-screening"

# Check vacancy status
curl "http://localhost:8080/vacancies/$VACANCY_ID"

# Delete pre-screening
curl -X DELETE "http://localhost:8080/vacancies/$VACANCY_ID/pre-screening"
```
