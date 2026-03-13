# Candidate Attributes — Frontend Brief

## Concept

Candidate attributes are structured facts about a candidate that flow between agents. Each attribute has a **type** (from a workspace-scoped catalog) and a **value** (per candidate). Types define the data format, allowed options, and which agent phase collects them.

The key use case: the pre-screening agent asks "Do you have a work permit?" and stores the answer. The document collection agent reads that answer and decides whether to request the actual work permit upload.

## Data Model

### Attribute Type (catalog entry)

```typescript
interface AttributeType {
  id: string
  workspace_id: string
  slug: string              // e.g. "work_permit_status"
  name: string              // e.g. "Werkvergunning status"
  description: string | null
  category: string          // "legal" | "transport" | "availability" | "financial" | "personal" | "general"
  data_type: string         // "text" | "boolean" | "date" | "select" | "multi_select" | "number"
  options: Option[] | null  // for select/multi_select: [{value, label}]
  icon: string | null       // lucide icon name
  is_default: boolean
  is_active: boolean
  sort_order: number
  collected_by: string | null           // "pre_screening" | "contract" | "document_collection" | null
  created_at: string
  updated_at: string
}

interface Option {
  value: string
  label: string   // Dutch (nl-BE)
}
```

### Candidate Attribute (value per candidate)

```typescript
interface CandidateAttribute {
  id: string
  candidate_id: string
  attribute_type_id: string
  attribute_type: AttributeType | null  // included when fetching
  value: string | null                  // stored as text, interpret by data_type
  source: string | null                 // "pre_screening" | "contract" | "manual" | "cv_analysis"
  source_session_id: string | null
  verified: boolean
  created_at: string
  updated_at: string
}
```

## API Endpoints

### Attribute Types Catalog (workspace-scoped)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/{workspace_id}/candidate-attribute-types` | List all types. Query: `category`, `collected_by`, `is_active` |
| POST | `/workspaces/{workspace_id}/candidate-attribute-types` | Create new type |
| PATCH | `/workspaces/{workspace_id}/candidate-attribute-types/{id}` | Update type |
| DELETE | `/workspaces/{workspace_id}/candidate-attribute-types/{id}` | Soft-delete type (204) |

### Candidate Attributes (per candidate)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/candidates/{candidate_id}/attributes` | List all attributes for candidate. Query: `category`, `source` |
| PUT | `/candidates/{candidate_id}/attributes` | Set single attribute (upsert) |
| PUT | `/candidates/{candidate_id}/attributes/bulk` | Bulk set multiple attributes |
| DELETE | `/candidates/{candidate_id}/attributes/{attribute_id}` | Remove attribute (204) |

### Candidate Detail (extended)

`GET /candidates/{candidate_id}` now includes an `attributes` array with flattened attribute summaries:

```json
{
  "id": "...",
  "full_name": "Jan Peeters",
  "attributes": [
    {
      "id": "...",
      "attribute_type_id": "...",
      "slug": "has_own_transport",
      "name": "Eigen vervoer",
      "category": "transport",
      "data_type": "boolean",
      "options": null,
      "icon": "car",
      "value": "true",
      "source": "pre_screening",
      "verified": false,
      "created_at": "2026-03-12T10:00:00Z"
    }
  ]
}
```

## Default Attribute Types (seeded per workspace)

| Slug | Name | Category | Data Type | Collected By |
|------|------|----------|-----------|-------------|
| `has_own_transport` | Eigen vervoer | transport | boolean | pre_screening |
| `available_from` | Beschikbaar vanaf | availability | date | pre_screening |
| `preferred_shifts` | Voorkeur shifts | availability | multi_select | pre_screening |
| `nationality` | Nationaliteit | legal | text | pre_screening |
| `national_register_nr` | Rijksregisternummer | personal | text | contract |
| `emergency_contact` | Noodcontact | personal | text | contract |

## Frontend Implementation Notes

### 1. Attribute Types Settings Page

Under workspace settings, add an "Attribute Types" management section (similar to Document Types).

- List attribute types grouped by `category`
- Allow create/edit/delete (soft-delete)
- For `select` and `multi_select` types: show an inline options editor with `value` + `label` fields
- Show the `collected_by` phase as a badge/tag
- Show the `collected_by` phase as a subtle indicator

### 2. Candidate Detail — Attributes Section

On the candidate detail page, add an "Attributes" section/tab.

- Group attributes by `category` (with category headers)
- Render values based on `data_type`:
  - `boolean` → toggle/check icon
  - `select` → show the matching label from `options`
  - `multi_select` → show tags for each selected value (value is stored as comma-separated string)
  - `date` → formatted date
  - `text` / `number` → plain display
- Show `source` as a subtle badge (e.g. "pre-screening", "handmatig")
- Show `verified` status indicator
- Allow manual editing of attribute values (PUT endpoint)

### 3. Value Interpretation

The `value` field is always stored as a `string`. Frontend must interpret based on `data_type`:

| data_type | Storage | Display |
|-----------|---------|---------|
| `text` | `"Jan Peeters"` | Plain text |
| `boolean` | `"true"` / `"false"` | Toggle / check icon |
| `date` | `"2026-04-01"` | Formatted date |
| `number` | `"42"` | Number |
| `select` | `"eu_citizen"` | Lookup label from `options` |
| `multi_select` | `"day,night"` | Split by `,`, lookup labels from `options` |

### 4. Agent Integration Flow

```
Pre-screening agent                    Document collection agent
        │                                        │
        │  asks questions                        │  reads candidate attributes
        │  ──────────►                           │  ◄──────────
        │  stores answers                        │  uses types_documents catalog
        │  PUT /candidates/{id}/attributes       │  GET /candidates/{id}/attributes
        │                                        │
        │  has_own_transport = "true"            │  → checks candidate_certificates
        │  available_from = "2026-04-01"         │  → requests missing uploads
```
