# Frontend Briefs

---

## Vacancy Pipeline — Kanban View

**Date:** 2026-03-11
**Status:** Ready for implementation

### Context

Each vacancy has a pipeline of candidates moving through recruitment stages. This view is the primary tool for recruiters to manage that pipeline — see who is where, move candidates forward, and quickly access candidate details.

The Kanban is always scoped to **one vacancy**. It is accessed from the vacancy detail page (e.g. a "Pipeline" tab).

---

### Data model

The pipeline is backed by `ats.candidacies`. Each row is one candidate's position in one vacancy.

**Stages (in order):**

| Value | Label (NL) | Column shown by default |
|---|---|---|
| `new` | Nieuw | ✅ |
| `pre_screening` | Pre-screening | ✅ |
| `qualified` | Gekwalificeerd | ✅ |
| `interview_planned` | Interview gepland | ✅ |
| `interview_done` | Interview afgerond | ✅ |
| `offer` | Aanbod | ✅ |
| `placed` | Geplaatst | ✅ |
| `rejected` | Afgewezen | ❌ hidden by default |
| `withdrawn` | Teruggetrokken | ❌ hidden by default |

`rejected` and `withdrawn` are archive stages — not shown as columns by default. Accessible via a toggle ("Toon archief").

---

### Visual layout (wireframe)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Vacatures   Fullstack Developer — TechCorp                         [+ Kandidaat toevoegen]     │
│                                                          [ ] Toon archief      🔍 Zoek kandidaat │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  NIEUW (3)       PRE-SCREENING (5)   GEKWALIFICEERD (2)  INTERVIEW (1)   AANBOD (0)  GEPLAATST  │
│  ┌───────────┐   ┌───────────┐       ┌───────────┐       ┌───────────┐                          │
│  │ Jan Pieters│  │ Sara Leclercq│    │ Ahmed El K.│      │ Fatima B. │                          │
│  │ 📱 WhatsApp│  │ 🎙️ Voice   │      │ 🎙️ Voice   │      │ 📄 CV     │                          │
│  │ 2d in stage│  │ Score 78% │      │ Score 91% │       │ Score 85% │                          │
│  │           │   │ ✅ Geslaagd│      │ ✅ Geslaagd│       │ ✅ Geslaagd│                          │
│  └───────────┘   └───────────┘       └───────────┘       └───────────┘                          │
│  ┌───────────┐   ┌───────────┐       ┌───────────┐                                              │
│  │ Marie Dupont│  │ Pieter V.  │    │ Lena Mertens│                                             │
│  │ 📄 CV     │   │ Score 42% │      │ Score 88% │                                               │
│  │ 1d in stage│  │ ❌ Mislukt │      │ ✅ Geslaagd│                                              │
│  └───────────┘   └───────────┘       └───────────┘                                              │
│  ┌───────────┐   ...                                                                             │
│  │ + Toevoegen│                                                                                  │
│  └───────────┘                                                                                   │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Card design

Each card represents one candidacy. Compact but informative:

```
┌────────────────────────────────────┐
│  [Avatar] Sara Leclercq            │
│           🎙️ Voice  · 3d geleden   │
│  Score 78%  ✅ Geslaagd            │
└────────────────────────────────────┘
```

**Card fields:**
| Field | Source | Notes |
|---|---|---|
| Name | `candidates.full_name` | |
| Channel badge | `applications.channel` | 🎙️ Voice · 📱 WhatsApp · 📄 CV |
| Time in stage | `candidacies.stage_updated_at` | "2d geleden", "3u geleden" |
| Pre-screening score | `applications.qualified` + `pre_screening_answers` | Only if screening exists |
| Score % | Avg of answer scores | Shown if available |
| Pass/fail badge | `applications.qualified` | ✅ Geslaagd / ❌ Mislukt |

If no screening exists (e.g. manually added): show name + source badge only.

---

### Interactions

#### Drag card to new column
- Drag a card to a different stage column
- On drop: `PATCH /candidacies/{id} { "stage": "qualified" }`
- Optimistic update — move card immediately, revert on error
- Cannot drag into `rejected` or `withdrawn` while archive is hidden (those columns don't render)

#### Click card → candidate side panel
- Opens a slide-over panel (right side)
- Shows full candidate details: name, phone, screening summary, answers, documents
- Stage can also be changed from the panel via a dropdown

#### "+ Kandidaat toevoegen" (per column or top-right button)
- Opens a small popover: search existing candidates by name/phone, or enter a new candidate
- On confirm: `POST /candidacies` → card appears in the target column

#### Move to archive (reject / withdraw)
- Via card action menu (⋯): "Afwijzen" → moves to `rejected`, "Teruggetrokken" → `withdrawn`
- Card disappears from the board (archive hidden by default)

#### "Toon archief" toggle
- When ON: renders two extra columns at the right: "Afgewezen" and "Teruggetrokken"
- Cards in those columns are visually muted (greyed out)
- Can drag back out of archive to reactivate

---

### API calls

**List candidacies for a vacancy:**
```
GET /candidacies?vacancy_id={id}
```
Returns all candidacies with nested candidate info + latest application summary (score, channel, qualified).

**Move stage:**
```
PATCH /candidacies/{id}
{ "stage": "qualified" }
```

**Add candidate to vacancy pipeline:**
```
POST /candidacies
{
  "vacancy_id": "{id}",
  "candidate_id": "{id}",
  "stage": "new",
  "source": "manual"
}
```

**Create new candidate + add to pipeline (if not yet in system):**
```
POST /candidates
{ "full_name": "...", "phone": "...", "workspace_id": "..." }
→ then POST /candidacies with returned candidate_id
```

---

### Column behaviour

| Behaviour | Detail |
|---|---|
| Column header | Stage label + candidate count in parentheses |
| Empty column | Show dashed empty state: "Geen kandidaten" — do NOT hide the column |
| Column scroll | Each column scrolls independently (standard Kanban pattern) |
| Column width | Fixed width (~240px), board scrolls horizontally |
| Max visible columns | 7 active + up to 2 archive when toggle is ON |

---

### Empty states

| State | Behaviour |
|---|---|
| No candidacies for this vacancy | All columns empty, show onboarding nudge in "Nieuw" column: "Voeg je eerste kandidaat toe" + button |
| Candidate has no screening | Card shows name + source only, no score/badge |
| Archive columns empty | Show "Geen afgewezen kandidaten" in muted text |

---

### Navigation & routing

**Vacatures list → click row → opens vacancy detail, default tab: Pipeline**

The vacancy detail page has tabs. Pipeline is the default (landing) tab:

| Tab | Route | Default? |
|---|---|---|
| Pipeline | `/records/vacancies/{id}/pipeline` | ✅ Yes — land here on click |
| Pre-screening | `/records/vacancies/{id}/pre-screening` | |
| Instellingen | `/records/vacancies/{id}/settings` | |

Clicking a vacancy row in the Vacatures list navigates directly to `/records/vacancies/{id}/pipeline`.

The current Vacatures list view (table with Agents, Status, Bron, Synced, Recruiter columns) stays as-is — it's the index. Only the click target changes from whatever it opened before to `/pipeline`.

---

### Notes
- Mobile: collapse to a stage-filtered list view (one stage visible at a time, tabs to switch)
- The `candidacy_id` on `ats.applications` means you can always deep-link from a screening result back to the candidacy card

---

## Kandidaten — Pipeline View

**Date:** 2026-03-11
**Status:** Ready for implementation

### Context

The Kandidaten page shows all candidates across the workspace. Rather than a flat list, the default view is a **stage-based pipeline** showing where each candidate sits in the global funnel — either in the talent pool (no vacancy) or linked to a vacancy.

This is not a Kanban — it's a **grouped list** or **board-lite** view: candidates bucketed by their current stage, scannable at a glance.

---

### Default view: Stage columns (board-lite)

Same column structure as the vacancy Kanban but showing **all candidates workspace-wide**, grouped by their most relevant active candidacy stage.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Kandidaten                                          [+ Kandidaat toevoegen] │
│                                                                             │
│ [● Pipeline]  [ Lijst ]                    🔍 Zoek...   Filters ▼          │
│                                                                             │
│  NIEUW        PRE-SCREENING    GEKWALIFICEERD    INTERVIEW    AANBOD  ...   │
│  ┌─────────┐  ┌─────────┐     ┌─────────┐                                  │
│  │Jan P.   │  │Sara L.  │     │Ahmed K. │                                  │
│  │Talent   │  │Fullstack│     │Fullstack│                                  │
│  │pool     │  │Developer│     │Developer│                                  │
│  └─────────┘  └─────────┘     └─────────┘                                  │
│  ┌─────────┐  ...                                                           │
│  │Marie D. │                                                                │
│  │Talent   │                                                                │
│  │pool     │                                                                │
│  └─────────┘                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Card fields (compact):**
- Candidate name
- Vacancy title (or "Talent pool" if `vacancy_id = null`)
- Source badge

Clicking a card opens the candidate detail side panel.

**Drag is disabled** on this view — stage moves happen from the candidate detail panel or from within a vacancy's pipeline. This view is read-only for pipeline position.

---

### Toggle: Pipeline ↔ Lijst

A segmented control at the top switches between:
- **Pipeline** (default) — stage columns as above
- **Lijst** — the classic flat table (existing behaviour, keep as-is)

The active view is persisted in `localStorage` per user.

---

### Filters

| Filter | Options |
|---|---|
| Vacature | Multi-select from active vacancies + "Talent pool" |
| Stage | Multi-select from stage list |
| Bron | voice, whatsapp, cv, manual |
| Recruiter | Multi-select |

Filters apply to both Pipeline and Lijst views.

---

### API

Uses the same `GET /candidacies` endpoint, without `vacancy_id` filter:

```
GET /candidacies?workspace_id={id}
```

Returns all candidacies with nested candidate + vacancy title + latest application summary.

For candidates with **multiple active candidacies** (e.g. in two vacancies simultaneously): show the candidate once per candidacy — a candidate can appear in multiple columns if they're being considered for multiple roles.

---

### Notes
- Pipeline is the default landing view for `/records/kandidaten`
- Lijst view preserves whatever table columns currently exist
- "Talent pool" label shown on cards where `vacancy_id = null`

---

## Document Type Panel — Verificatie & Extractie

**Date:** 2026-03-11
**Status:** ⚠️ UPDATED — previous implementation is incorrect, rebuild required

### ⚠️ What changed vs the previous build

The previous implementation had a single "VERIFICATIE-INSTELLINGEN" section with:
- "Te extraheren velden" with a "+ Voeg veld toe" tag input
- "Controleer vervaldatum" toggle
- "Extra instructies voor de AI" textarea

**This is wrong. Throw it out and rebuild as follows:**

1. **"Te extraheren velden" moves to a separate "EXTRACTIE" section** — completely independent from verification
2. **Extraction fields are custom objects** (`name` + `description`), not tags from a fixed list
3. **"Controleer naam" toggle is added** alongside "Controleer vervaldatum" — both default ON
4. **The verificatie section is only**: toggle + scan mode + 2 check toggles + instructions textarea

---

### Context

The document type side panel needs **two independent sections**:

1. **Verificatie** — Does the AI check/validate this document when a candidate uploads it?
2. **Extractie** — What data fields should the AI pull out and pass to external systems?

These are separate concerns. A document can have extraction without verification, and vice versa. Configuration only lives on **top-level document types** (`parent_id == null`). Children inherit and do not show this UI.

---

### Data model

Fields returned by `GET /ontology/entities/{id}`:

| Field | Type | Description |
|---|---|---|
| `is_verifiable` | boolean | Whether AI verification is enabled |
| `scan_mode` | enum | `single` \| `front_back` \| `multi_page` |
| `verification_config` | object \| null | All verification + extraction settings |

**`verification_config` structure:**
```json
{
  "check_expiry": true,
  "check_name": true,
  "additional_instructions": "Controleer of het stempel leesbaar is.",
  "extract_fields": [
    { "name": "expiry_date", "description": "Datum waarop het document vervalt" },
    { "name": "license_category", "description": "Rijbewijscategorie vermeld op de voorkant" }
  ]
}
```

> `extract_fields` is an array of objects — each with a `name` (used as the key in external system mapping) and a `description` (instruction for the AI on what to look for).

---

### Visual layout (wireframe)

```
┌─────────────────────────────────────────────────┐
│ Arbeidskaart                               [×]  │
│ Certificaat                                     │
│                                                 │
│ Naam                                            │
│ [Arbeidskaart                              ]    │
│                                                 │
│ Categorie                                       │
│ [Certificaat                            ▼ ]    │
│                                                 │
│ Standaard aangevraagd bij kandidaten   [toggle] │
│                                                 │
│ ── VERIFICATIE ──────────────────────────────── │
│                                                 │
│ Verifieerbaar door AI                  [● ON]   │
│                                                 │
│ Scanmodus                                       │
│ [ 1 foto │ Voor- en achterkant │ Meer pag's ]   │
│                                                 │
│ Controleer vervaldatum                 [● ON]   │
│ Controleer naam                        [● ON]   │
│                                                 │
│ Instructies voor de AI              0/500       │
│ ┌─────────────────────────────────────────┐    │
│ │ bv. Controleer of het stempel...        │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ── EXTRACTIE ────────────────────────────────── │
│ Velden die de AI uitleest en doorstuurt         │
│ naar externe systemen                           │
│                                                 │
│  expiry_date                            [🗑]   │
│  Datum waarop het document vervalt              │
│                                                 │
│  license_category                       [🗑]   │
│  Rijbewijscategorie op de voorkant              │
│                                                 │
│ + Veld toevoegen                                │
│                                                 │
│ ── SUBTYPES (4) ─────────────────────────────── │
│ ⠿ Vrijstelling Arbeidskaart                    │
│ ⠿ Arbeidskaart A                               │
│ ⠿ Arbeidskaart B                               │
│ ⠿ Arbeidskaart C                               │
│ + Voeg subtype toe                              │
│                                                 │
│ 🗑 Documenttype verwijderen                     │
└─────────────────────────────────────────────────┘
```

Key points from the wireframe:
- **VERIFICATIE** and **EXTRACTIE** are two separate labeled sections
- VERIFICATIE: toggle → scan mode → 2 check toggles → instructions textarea
- EXTRACTIE: list of rows (name bold, description muted) + "+ Veld toevoegen"
- EXTRACTIE is always visible on top-level docs, regardless of `is_verifiable`

---

### API calls

**Save changes (partial, fire on each change):**
```
PATCH /ontology/entities/{id}
Content-Type: application/json

{ "is_verifiable": true }
{ "scan_mode": "front_back" }
{ "verification_config": { "check_expiry": true, "check_name": true, "additional_instructions": "...", "extract_fields": [...] } }
```
All fields optional — only send what changed. Always merge `verification_config` client-side before patching (never send partial sub-object).

**Fetch field presets (optional, for suggestions when adding extraction fields):**
```
GET /ontology/verification-schema
```
Returns `extract_fields` as a list of suggested presets (`key`, `label`, `description`). Use these to pre-fill the add-field form. User can ignore them and type their own.

---

### Section 1 — Verificatie

**Show:** always on top-level doc types. Hidden on children (`parent_id != null`).

#### 1a. Verifieerbaar door AI — Toggle
- **Default:** off
- **On enable:** show 1b, 1c, 1d below
- **On disable:** collapse 1b–1d, but do not clear the config (preserve settings for when re-enabled)
- **Save:** `PATCH { is_verifiable: true/false }`

#### 1b. Scanmodus — Segmented control
**Show:** only when `is_verifiable = true`

| Value | Label |
|---|---|
| `single` | 1 foto |
| `front_back` | Voor- en achterkant |
| `multi_page` | Meerdere pagina's |

- **Default:** `single`
- **Save:** `PATCH { scan_mode: "..." }`

#### 1c. Controles — Two toggles, both default ON when `is_verifiable` is first enabled

| Toggle | Key | Description |
|---|---|---|
| Controleer vervaldatum | `check_expiry` | Markeer als ongeldig als de vervaldatum verstreken is |
| Controleer naam | `check_name` | Controleer of de naam op het document overeenkomt met de kandidaat |

- **Default:** both `true` when `is_verifiable` is turned on for the first time (i.e. `verification_config` is null)
- **Save:** `PATCH { verification_config: { ...existing, check_expiry: true/false } }`

#### 1d. Instructies voor de AI — Textarea
- **Label:** "Instructies voor de AI"
- **Placeholder:** "bv. Controleer of het document een officieel stempel bevat..."
- **Save:** on blur
- **Max length:** 500 chars — show counter below field
- **Stored as:** `verification_config.additional_instructions`

---

### Section 2 — Extractie

**Show:** always on top-level doc types, regardless of `is_verifiable`. Hidden on children.

**Purpose:** Define what data the AI should extract from this document and map to external systems (e.g. Prato Flex fields).

#### Layout
- Section header: "Extractie" with a small subtext: "Velden die de AI uitlaast en doorstuurt naar externe systemen"
- A list of configured fields, each showing: `name` (bold) + `description` (muted)
- A "+ Veld toevoegen" button at the bottom

#### Add field — inline form or small popover
Two inputs:
- **Naam** — the field key used in external system mapping (e.g. `expiry_date`, `license_category`). Text input, required.
- **Omschrijving voor de AI** — what the AI should look for on the document. Text input, required.

**Presets:** optionally show a dropdown of suggestions from `GET /ontology/verification-schema → extract_fields`. Selecting a preset pre-fills both inputs. User can edit freely.

**On confirm:** append to `verification_config.extract_fields`, save: `PATCH { verification_config: { ...existing, extract_fields: [..., { name, description }] } }`

#### Edit field
- Click on a field row to edit name + description inline
- On confirm: update in array, PATCH

#### Delete field
- Trash icon on hover
- No confirm dialog needed — just remove from array, PATCH

---

### Save strategy

| Field | When to save |
|---|---|
| `is_verifiable` | Immediately on toggle |
| `scan_mode` | Immediately on change |
| `check_expiry`, `check_name` | Immediately on toggle |
| `additional_instructions` | On blur |
| `extract_fields` | After add / edit / delete |

Always merge `verification_config` client-side — read the current object, update only the changed key, PATCH the full object.

---

### Empty / null states

| State | Behaviour |
|---|---|
| `verification_config: null` + `is_verifiable` turned ON | Default `check_expiry: true`, `check_name: true`, `scan_mode: "single"` |
| `verification_config: null` + `is_verifiable` OFF | Show toggle only, rest collapsed |
| `extract_fields: []` | Show empty state: "Nog geen velden toegevoegd" + "+ Veld toevoegen" button |
| Child doc type (`parent_id != null`) | Hide both sections entirely |

---

## Document Type Panel — Subtype Management

**Date:** 2026-03-11
**Status:** Ready for implementation

### Context

The panel already lists subtypes (children). These need to be editable inline — rename, reorder, and delete existing ones, plus add new ones.

Children are document types with a `parent_id`. They do **not** have `verification_config` or `scan_mode` — those are controlled by the parent.

---

### API calls

All use the same ontology CRUD endpoints:

**Add a subtype:**
```
POST /ontology/entities?workspace_id={id}
{
  "slug": "arbeidskaart_d",
  "name": "Arbeidskaart D",
  "category": "certificate",
  "parent_id": "{parent_id}"
}
```
`slug` must be unique within the workspace. Suggest auto-generating from `name` (lowercase, spaces → underscores) but allow the user to override.

**Rename a subtype:**
```
PATCH /ontology/entities/{child_id}
{ "name": "Arbeidskaart D (herzien)" }
```

**Reorder subtypes:**
```
PATCH /ontology/entities/{child_id}
{ "sort_order": 3 }
```
Fire one PATCH per row when order changes (drag & drop).

**Delete a subtype (soft delete):**
```
DELETE /ontology/entities/{child_id}
```
Soft-deletes — sets `is_active = false`. Row disappears from the list (default responses exclude inactive).

---

### UI to implement (in the subtypes list)

#### Add row
- An "+ Subtype toevoegen" button at the bottom of the list
- Inline input that appears as a new row — just a name field
- On confirm (Enter / blur): auto-generate slug, POST, add to list
- On cancel (Escape): discard

#### Edit row
- Click on a subtype name to make it editable inline
- On confirm (Enter / blur): PATCH `{ name }`, update in list
- On cancel (Escape): revert

#### Reorder
- Drag handle on each row
- On drop: PATCH `{ sort_order }` for affected rows

#### Delete row
- Trash icon on hover (or in a row actions menu)
- Confirm dialog: "Weet je zeker dat je '[name]' wil verwijderen?"
- On confirm: DELETE, remove from list

---

### Constraints
- Slug is auto-generated and not shown to the user (internal only)
- `category` of the child inherits from the parent — don't expose it in the UI
- Children do not have `is_verifiable`, `scan_mode`, or `verification_config` — those live on the parent only
