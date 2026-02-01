# Interview Simulator API

## Overview

The Interview Simulator allows recruiters to test their pre-screening configuration by running automated simulations with different candidate personas. This helps validate interview flows before going live.

## Key Features

- **Persona-based simulation**: Test with qualified, borderline, unqualified, rushed, or enthusiastic candidates
- **Real-time streaming**: Watch the conversation unfold in real-time via SSE
- **Q&A extraction**: Automatically extracts question-answer pairs from conversations
- **History tracking**: All simulations are stored for later review

---

## Endpoints

### 1. Run Simulation

**POST** `/vacancies/{vacancy_id}/simulate`

Runs an automated interview simulation between the screening agent and a simulated candidate.

#### Request Body

```json
{
  "persona": "qualified",
  "custom_persona": null,
  "candidate_name": "Jan Peeters"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `persona` | string | No | Persona type (default: "qualified"). Options: `qualified`, `borderline`, `unqualified`, `rushed`, `enthusiastic`, `custom` |
| `custom_persona` | string | No | Custom persona description (only used when persona="custom") |
| `candidate_name` | string | No | Name for simulated candidate (random if not provided) |

#### Persona Descriptions

| Persona | Behavior |
|---------|----------|
| `qualified` | Ideal candidate who passes all questions, enthusiastic, has relevant experience |
| `borderline` | Uncertain candidate, asks clarifications, honest about limitations |
| `unqualified` | Fails one or more knockout questions (e.g., no work permit, can't work shifts) |
| `rushed` | Very short answers, no emojis, seems busy but qualifies |
| `enthusiastic` | Lots of emojis, detailed answers, very eager to start |
| `custom` | Use `custom_persona` field to describe the behavior |

#### Response (SSE Stream)

The endpoint returns a Server-Sent Events stream with the following event types:

```typescript
// Connection started
{ type: "start", message: string, candidate_name: string }

// Agent (interviewer) message
{ type: "agent", message: string, turn: number }

// Candidate (simulator) message  
{ type: "candidate", message: string, turn: number }

// Simulation completed
{ 
  type: "complete", 
  simulation_id: string,
  outcome: "completed" | "max_turns_reached",
  qa_pairs: Array<{ question: string, answer: string, turn: number }>,
  total_turns: number
}

// Error occurred
{ type: "error", message: string }
```

#### Example Usage (TypeScript)

```typescript
async function runSimulation(vacancyId: string, persona: string) {
  const response = await fetch(`/vacancies/${vacancyId}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const event = JSON.parse(line.slice(6));
        
        switch (event.type) {
          case 'agent':
            console.log('🤖 Agent:', event.message);
            break;
          case 'candidate':
            console.log('👤 Candidate:', event.message);
            break;
          case 'complete':
            console.log('✅ Complete:', event.outcome);
            console.log('Q&A Pairs:', event.qa_pairs);
            break;
          case 'error':
            console.error('❌ Error:', event.message);
            break;
        }
      }
    }
  }
}
```

---

### 2. List Simulations

**GET** `/vacancies/{vacancy_id}/simulations`

Returns a list of all simulations for a vacancy.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `persona` | string | - | Filter by persona type |
| `limit` | number | 20 | Maximum results (1-100) |
| `offset` | number | 0 | Pagination offset |

#### Response

```json
{
  "simulations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "vacancy_id": "123e4567-e89b-12d3-a456-426614174000",
      "persona": "qualified",
      "candidate_name": "Jan Peeters",
      "qa_pairs": [
        {
          "question": "Mag je wettelijk werken in België?",
          "answer": "Ja hoor, ik ben Belg 🇧🇪",
          "turn": 2
        }
      ],
      "outcome": "completed",
      "total_turns": 8,
      "created_at": "2026-02-01T14:30:00Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

---

### 3. Get Simulation Details

**GET** `/vacancies/{vacancy_id}/simulations/{simulation_id}`

Returns the full details of a simulation including the complete conversation.

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "vacancy_id": "123e4567-e89b-12d3-a456-426614174000",
  "persona": "qualified",
  "custom_persona": null,
  "candidate_name": "Jan Peeters",
  "qa_pairs": [
    {
      "question": "Mag je wettelijk werken in België?",
      "answer": "Ja hoor, ik ben Belg 🇧🇪",
      "turn": 2
    },
    {
      "question": "Kan je werken in een 2-ploegensysteem?",
      "answer": "Ja dat is geen probleem, ik heb dat eerder gedaan",
      "turn": 3
    }
  ],
  "conversation": [
    {
      "role": "agent",
      "message": "Hey Jan! 👋 Super leuk dat je solliciteert voor Operator Mengafdeling...",
      "turn": 0
    },
    {
      "role": "candidate",
      "message": "Hoi! Ja, ik ben klaar om te beginnen",
      "turn": 1
    },
    {
      "role": "agent",
      "message": "Top! Even een paar korte vragen. Mag je wettelijk werken in België?",
      "turn": 2
    },
    {
      "role": "candidate",
      "message": "Ja hoor, ik ben Belg 🇧🇪",
      "turn": 2
    }
  ],
  "outcome": "completed",
  "total_turns": 8,
  "created_at": "2026-02-01T14:30:00Z"
}
```

---

### 4. Delete Simulation

**DELETE** `/vacancies/{vacancy_id}/simulations/{simulation_id}`

Deletes a simulation record.

#### Response

```json
{
  "status": "deleted",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Frontend Integration Guide

### Recommended UI Flow

1. **Pre-screening config page**: Add a "Test Interview" button
2. **Persona selector**: Modal or dropdown to choose persona
3. **Simulation view**: Reuse existing chat widget to display the conversation
4. **Results panel**: Show extracted Q&A pairs after completion

### UI Component: Simulation Button

```tsx
interface SimulationButtonProps {
  vacancyId: string;
  disabled?: boolean;
}

function SimulationButton({ vacancyId, disabled }: SimulationButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [persona, setPersona] = useState('qualified');
  const [isRunning, setIsRunning] = useState(false);

  const personas = [
    { value: 'qualified', label: 'Gekwalificeerde kandidaat', icon: '✅' },
    { value: 'borderline', label: 'Twijfelgeval', icon: '🤔' },
    { value: 'unqualified', label: 'Niet gekwalificeerd', icon: '❌' },
    { value: 'rushed', label: 'Gehaaste kandidaat', icon: '⏱️' },
    { value: 'enthusiastic', label: 'Enthousiaste kandidaat', icon: '🎉' },
  ];

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)}
        disabled={disabled}
        variant="outline"
      >
        🧪 Test Interview
      </Button>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h3>Interview Simuleren</h3>
        <p>Kies een kandidaat-persona om het interview te testen:</p>
        
        <RadioGroup value={persona} onChange={setPersona}>
          {personas.map(p => (
            <Radio key={p.value} value={p.value}>
              {p.icon} {p.label}
            </Radio>
          ))}
        </RadioGroup>

        <Button onClick={() => startSimulation(vacancyId, persona)}>
          Start Simulatie
        </Button>
      </Modal>
    </>
  );
}
```

### UI Component: Simulation Chat View

```tsx
interface Message {
  role: 'agent' | 'candidate';
  message: string;
  turn: number;
}

interface SimulationChatProps {
  vacancyId: string;
  persona: string;
  onComplete: (result: SimulationResult) => void;
}

function SimulationChat({ vacancyId, persona, onComplete }: SimulationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);

  useEffect(() => {
    runSimulation();
  }, []);

  async function runSimulation() {
    const response = await fetch(`/vacancies/${vacancyId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n');
      
      for (const line of lines) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
        
        const event = JSON.parse(line.slice(6));

        if (event.type === 'agent' || event.type === 'candidate') {
          setMessages(prev => [...prev, {
            role: event.type,
            message: event.message,
            turn: event.turn
          }]);
        }

        if (event.type === 'complete') {
          setIsRunning(false);
          setQaPairs(event.qa_pairs);
          onComplete({
            simulationId: event.simulation_id,
            outcome: event.outcome,
            qaPairs: event.qa_pairs,
            totalTurns: event.total_turns
          });
        }
      }
    }
  }

  return (
    <div className="simulation-chat">
      <div className="chat-header">
        <span className={isRunning ? 'pulse' : ''}>
          {isRunning ? '🔴 Simulatie loopt...' : '✅ Simulatie voltooid'}
        </span>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <span className="avatar">
              {msg.role === 'agent' ? '🤖' : '👤'}
            </span>
            <div className="content">{msg.message}</div>
          </div>
        ))}
      </div>

      {!isRunning && qaPairs.length > 0 && (
        <div className="qa-summary">
          <h4>Vraag & Antwoord Samenvatting</h4>
          {qaPairs.map((qa, i) => (
            <div key={i} className="qa-pair">
              <div className="question">Q: {qa.question}</div>
              <div className="answer">A: {qa.answer}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Styling Suggestions

```css
.simulation-chat {
  max-width: 600px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.chat-header {
  background: #f5f5f5;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.messages {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.message {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.message.agent {
  justify-content: flex-start;
}

.message.candidate {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.message .content {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 16px;
}

.message.agent .content {
  background: #e3f2fd;
}

.message.candidate .content {
  background: #c8e6c9;
}

.qa-summary {
  background: #fff9c4;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.qa-pair {
  margin-bottom: 12px;
  padding: 8px;
  background: white;
  border-radius: 8px;
}

.qa-pair .question {
  font-weight: 500;
  color: #1565c0;
}

.qa-pair .answer {
  color: #2e7d32;
  margin-top: 4px;
}
```

---

## Database Migration

Run this migration in Supabase SQL Editor:

```sql
-- See: migrations/007_add_simulated_interviews.sql
```

---

## Error Handling

| Error | HTTP Status | Description |
|-------|-------------|-------------|
| Invalid vacancy ID | 400 | UUID format validation failed |
| Vacancy not found | 404 | Vacancy doesn't exist |
| Pre-screening not configured | 400 | No pre-screening for this vacancy |
| Invalid persona | 400 | Unknown persona type |
| Simulation not found | 404 | Simulation ID doesn't exist |

---

## Best Practices

1. **Test all personas**: Run at least qualified, borderline, and unqualified simulations before publishing
2. **Review Q&A pairs**: Use the extracted pairs to verify questions are being answered as expected
3. **Check conversation flow**: Ensure knockout failures are handled gracefully
4. **Iterate on questions**: Use simulation feedback to refine question wording
