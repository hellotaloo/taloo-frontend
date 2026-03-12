# Brief: Standardize List API Response Format

**Priority:** High
**Effort:** Small (backend) + Small (frontend follow-up)
**Author:** Frontend team
**Date:** 2026-03-12

---

## Problem

The frontend currently handles **3 different response shapes** from list endpoints because the backend is inconsistent. This forces defensive parsing in every API call, creates fragile code, and makes it impossible to build a generic data-fetching layer.

### Current situation in `lib/api.ts`

**`GET /candidates`** — the frontend doesn't know what shape it'll get:

```typescript
const data = await response.json();

// Shape 1: raw array
if (Array.isArray(data)) {
  return { items: data, total: data.length, ... };
}

// Shape 2: { items: [...] }
// Shape 3: { candidates: [...] }
return {
  items: data.items || data.candidates || [],
  total: data.total || (data.items || data.candidates || []).length,
  ...
};
```

**`GET /vacancies`** — same problem, different keys:

```typescript
if (Array.isArray(data)) {
  return { vacancies: data.map(normalize), ... };
}
// Could be data.vacancies or data.items
const raw = data.vacancies || data.items || [];
```

**`GET /vacancies`** also requires frontend normalization of the `agents` field:

```typescript
const normalizeVacancy = (v) => ({
  ...v,
  agents: v.agents || { prescreening: { exists: false, status: null }, ... },
});
```

The backend sometimes omits `agents` entirely, forcing the frontend to add defaults.

---

## Proposed Standard

All list endpoints should return the **same envelope**:

```typescript
interface PaginatedResponse<T> {
  items: T[];     // Always "items", never "candidates" or "vacancies"
  total: number;  // Total count (for pagination)
  limit: number;  // Requested limit
  offset: number; // Requested offset
}
```

### Affected endpoints

| Endpoint | Current response key | Should be |
|----------|---------------------|-----------|
| `GET /candidates` | inconsistent (array / `items` / `candidates`) | `{ items, total, limit, offset }` |
| `GET /vacancies` | `{ vacancies, total, limit, offset }` | `{ items, total, limit, offset }` |
| `GET /monitoring` | unknown | `{ items, total, limit, offset }` |
| `GET /candidacies` | `{ items, total }` | `{ items, total, limit, offset }` (already correct) |

### Additional fix: always include `agents` on vacancies

The `agents` field should **always** be present on vacancy responses — never `null` or missing. Default to:

```json
{
  "prescreening": { "exists": false, "status": null },
  "preonboarding": { "exists": false, "status": null },
  "insights": { "exists": false, "status": null }
}
```

This removes the need for frontend normalization.

---

## API Contract update needed

The current contract (`docs/API_CONTRACT.md`) defines `VacanciesListResponse` with a `vacancies` key:

```typescript
interface VacanciesListResponse {
  vacancies: VacancyResponse[];
  total: number;
  limit: number;
  offset: number;
}
```

This should change to:

```typescript
interface VacanciesListResponse {
  items: VacancyResponse[];
  total: number;
  limit: number;
  offset: number;
}
```

The `GET /candidates` endpoint doesn't document a wrapper at all — it should be added.

---

## Frontend follow-up

Once the backend ships the standardized format, the frontend cleanup is straightforward:

1. Remove the 3-shape parsing in `getCandidates()` (~15 lines → 1 line)
2. Remove the 2-shape parsing in `getVacanciesFromAPI()` (~15 lines → 1 line)
3. Remove `normalizeVacancy()` helper (~10 lines)
4. Rename `VacanciesListResponse.vacancies` → `.items` in `lib/types.ts`

Total: ~40 lines of defensive code removed.

---

## Not in scope

- Adding server-side filtering/search (separate brief)
- Pagination UI (separate task)
- Response caching (frontend concern)
