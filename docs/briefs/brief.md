# Playground Mode: Side-Effect Safety Check

## Context

The frontend playground/demo page (`/pre-screening/demo`) allows users to test voice calls and WhatsApp conversations without affecting real candidates. We need to verify that the backend correctly prevents side effects (meeting bookings, RTS updates, notifications, etc.) for all playground-related endpoints.

## How the frontend triggers playground actions

| Endpoint | Method | When used | Test flag sent? |
|---|---|---|---|
| `/playground/start` | POST | Voice call via LiveKit | No explicit flag — only sends `vacancy_id`, `candidate_name`, `start_agent`, `require_consent` |
| `/vacancies/{id}/simulate` | POST | WhatsApp auto-play scenarios | No explicit flag — sends `persona`, `custom_persona`, `candidate_name` |
| `/screening/chat` | POST | WhatsApp interactive (manual) chat | Yes — `is_test: true` (hardcoded) |
| `/screening/outbound` | POST | Triggering a real outbound call/WhatsApp from demo | Yes — `is_test: true` (when `source === 'test'`) |

## What needs verification

For each endpoint above, please confirm that the following side effects are **suppressed** when the call originates from playground/demo mode:

1. **Meeting bookings** — No calendar events should be created
2. **RTS updates** — No candidate status changes in the ATS/RTS
3. **Notifications** — No emails, SMS, or push notifications sent to recruiters or candidates
4. **Candidate record creation** — No real candidate profiles created (or clearly marked as test data)
5. **Webhook triggers** — No external webhook calls fired
6. **Analytics/reporting** — Playground sessions should either be excluded from production metrics or clearly tagged

## Concern

The first two endpoints (`/playground/start` and `/vacancies/{id}/simulate`) rely entirely on backend routing to prevent side effects — no `is_test` flag is passed from the frontend. Please confirm this is handled correctly on the backend side, or let us know if we should add an explicit flag.
