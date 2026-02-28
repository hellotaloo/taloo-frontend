# Frontend Brief: Embeddable Application Widget

## Overview

Taloo provides an embeddable JavaScript widget that clients add to their own website. Candidates click a button and a pop-up opens with the Taloo application form (CV upload, WhatsApp, Voice call). No authentication is required — the widget works entirely on public endpoints.

---

## Architecture

```
Client's Website                         Taloo Frontend
┌──────────────────────┐                ┌──────────────────────────┐
│                      │                │                          │
│  <script taloo-      │  loads from    │  /taloo-widget.js        │
│   widget.js>         │ ◄──────────── │  (vanilla JS, no deps)   │
│                      │                │                          │
│  <button data-taloo- │   click →      │                          │
│   vacancy-id="...">  │   opens        │  /apply/{vacancyId}      │
│                      │   iframe ────► │  (public Next.js page)   │
│  ┌────────────────┐  │                │                          │
│  │  iframe modal  │  │  postMessage   │  ApplicationForm         │
│  │  (overlay)     │ ◄──────────────► │  (shared component)      │
│  └────────────────┘  │                │                          │
└──────────────────────┘                └──────────────────────────┘
```

Three parts:

| Part | Path | Description |
|------|------|-------------|
| Widget Script | `public/taloo-widget.js` | Vanilla JS — finds trigger buttons, opens iframe modal |
| Public Page | `app/(public)/apply/[vacancyId]/page.tsx` | Standalone page that renders the application form |
| Shared Form | `components/blocks/application-form/` | Extracted from `TriggerInterviewDialog`, used by both dashboard and widget |

---

## Client Integration

### Minimal Setup

```html
<script src="https://app.taloo.ai/taloo-widget.js" defer></script>
<button data-taloo-vacancy-id="abc-123-def-456">Solliciteer nu</button>
```

That's it. The script auto-discovers buttons with `data-taloo-vacancy-id` and attaches click handlers.

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-taloo-vacancy-id` | Yes | The vacancy UUID |
| `data-taloo-source` | No | Source identifier. Default: `"widget"`. Set to `"test"` for test mode |

### Multiple Buttons

```html
<button data-taloo-vacancy-id="vacancy-1">Apply for Job 1</button>
<button data-taloo-vacancy-id="vacancy-2">Apply for Job 2</button>
```

Each button opens the form for its specific vacancy. Only one modal can be open at a time.

### Programmatic API

```javascript
// Open widget from code
TalooWidget.open('vacancy-uuid', { source: 'widget' });

// Close programmatically
TalooWidget.close();

// Re-scan DOM after dynamic button insertion (e.g., SPA navigation)
TalooWidget.refresh();
```

### Events

```javascript
// Listen for successful application submission
document.addEventListener('taloo:success', function (e) {
  console.log('Method:', e.detail.method);           // 'email' | 'whatsapp' | 'phone'
  console.log('Application ID:', e.detail.applicationId);
});
```

---

## Source & Test Mode

The `source` attribute controls whether applications are marked as test or real:

| Source | `is_test` | Use case |
|--------|-----------|----------|
| `"widget"` (default) | `false` | Real candidates on client websites |
| `"test"` | `true` | Dashboard "Sollicitatie testen" button |

The flow: `data-taloo-source` → query param `?source=test` → `ApplicationForm source="test"` → API call with `is_test: true`.

---

## Key Files

| File | Purpose |
|------|---------|
| `public/taloo-widget.js` | Vanilla JS embed script (no build step) |
| `app/(public)/apply/[vacancyId]/page.tsx` | Public page — fetches vacancy, renders form, handles postMessage |
| `app/(public)/apply/[vacancyId]/layout.tsx` | Metadata (browser tab title) |
| `components/blocks/application-form/application-form.tsx` | Shared form component (CV, WhatsApp, Voice) |
| `components/blocks/application-form/index.ts` | Barrel export |
| `components/blocks/channel-management/trigger-interview-dialog.tsx` | Dashboard dialog — thin wrapper around ApplicationForm |
| `next.config.ts` | CORS + CSP headers for cross-origin embedding |

---

## API Endpoints Used (No Auth Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/vacancies/{vacancyId}` | Fetch vacancy info (title, channels, isOnline) |
| POST | `/screening/outbound` | Initiate WhatsApp/Voice screening |
| POST | `/vacancies/{vacancyId}/cv-application` | Submit CV application |

The public page guards for `is_online === true` before showing the form.

---

## Headers (next.config.ts)

| Route | Header | Value |
|-------|--------|-------|
| `/taloo-widget.js` | `Access-Control-Allow-Origin` | `*` |
| `/taloo-widget.js` | `Cache-Control` | `public, max-age=3600, s-maxage=86400` |
| `/apply/*` | `Content-Security-Policy` | `frame-ancestors *` |

---

## Widget Script Internals

The script (`taloo-widget.js`) is a self-contained IIFE with zero dependencies:

1. **Auto-detects base URL** from its own `<script src>` attribute
2. **Scans DOM** for `[data-taloo-vacancy-id]` elements on load
3. **On click**: creates a fixed overlay + iframe pointing to `/apply/{vacancyId}?embed=true&source={source}`
4. **Closes via**: overlay click, Escape key, close button, or `postMessage`
5. **Mobile**: goes full-screen (no border-radius). Desktop: centered modal (max-width 1080px, 90vh)
6. **Listens for `postMessage`** from iframe:
   - `{ type: 'taloo-close' }` → closes the modal
   - `{ type: 'taloo-success', method, applicationId }` → dispatches `taloo:success` event, auto-closes after 1.5s

---

## ApplicationForm Component

Shared between the dashboard dialog and the public embed page.

```typescript
interface ApplicationFormProps {
  vacancyId: string;
  vacancyTitle: string;
  hasWhatsApp: boolean;
  hasVoice: boolean;
  hasCv: boolean;
  source?: string;       // 'widget' | 'test' — determines is_test
  onClose?: () => void;
  onSuccess?: (result: { method: 'email' | 'whatsapp' | 'phone'; applicationId?: string }) => void;
}
```

**Screens:**
1. **Form** — CV upload card + Phone/WhatsApp card (2 columns when both available, responsive to 1 col on mobile)
2. **Processing** — Animated step-by-step CV analysis progress
3. **Confirmation** — Match (booking slots) or Clarification needed (WhatsApp/Voice follow-up)

---

## Public Apply Page

`app/(public)/apply/[vacancyId]/page.tsx`

- Fetches vacancy data on mount
- Shows loading spinner → error/offline message → or form
- Detects iframe mode via `window.self !== window.top`
- When embedded: sends `postMessage` to parent on close/success
- When standalone: shows Taloo branding header above the form
- Includes its own `<Toaster>` for notifications
