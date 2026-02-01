# Backend Brief: Individual Channel Toggles

## Context

The frontend now has a channel status popover that shows individual toggles for Voice (ElevenLabs) and WhatsApp channels. Currently, the status endpoint only supports toggling all channels on/off together. We need to extend it to support individual channel control.

## Current API

```
PATCH /vacancies/{vacancy_id}/pre-screening/status

Request:
{
  "is_online": boolean
}

Response:
{
  "status": "success",
  "is_online": boolean,
  "message": string,
  "elevenlabs_agent_id": string | null,
  "whatsapp_agent_id": string | null
}
```

## Required Extension

Extend the request body to accept optional channel-specific flags:

```
PATCH /vacancies/{vacancy_id}/pre-screening/status

Request:
{
  "is_online"?: boolean,
  "voice_enabled"?: boolean,
  "whatsapp_enabled"?: boolean,
  "cv_enabled"?: boolean
}

Response:
{
  "status": "success",
  "is_online": boolean,
  "voice_enabled": boolean,
  "whatsapp_enabled": boolean,
  "cv_enabled": boolean,
  "message": string,
  "elevenlabs_agent_id": string | null,
  "whatsapp_agent_id": string | null
}
```

## Field Behavior

| Field | Type | Description |
|-------|------|-------------|
| `is_online` | boolean (optional) | Master switch - when set to false, all channels go offline |
| `voice_enabled` | boolean (optional) | Toggle voice channel independently |
| `whatsapp_enabled` | boolean (optional) | Toggle WhatsApp channel independently |
| `cv_enabled` | boolean (optional) | Toggle Smart CV channel independently |

### Logic Rules

1. If `is_online = false`: Both channels are paused, regardless of individual channel flags
2. If `is_online = true` and channel flags provided: Use the provided flags
3. If only channel flags provided (no `is_online`): Toggle that specific channel while keeping master status unchanged
4. If channel is enabled but no agent ID exists: Return error or create agent

## Implementation Notes

### Database Changes

Add channel status columns to `pre_screenings` table:

```sql
ALTER TABLE pre_screenings ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE pre_screenings ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT TRUE;
```

Note: These columns track the enabled/disabled state per channel. The `is_online` flag remains the master switch.

### Backend Logic

```python
# Pseudocode
def update_status(vacancy_id, request):
    pre_screening = get_pre_screening(vacancy_id)
    
    # Handle master toggle
    if request.is_online is not None:
        pre_screening.is_online = request.is_online
        if not request.is_online:
            # Master off - keep channel states but agents are paused
            pass
    
    # Handle individual channel toggles
    if request.voice_enabled is not None:
        if request.voice_enabled and not pre_screening.elevenlabs_agent_id:
            # Error: can't enable channel without agent
            raise HTTPException(400, "Voice agent not configured")
        pre_screening.voice_enabled = request.voice_enabled
    
    if request.whatsapp_enabled is not None:
        if request.whatsapp_enabled and not pre_screening.whatsapp_agent_id:
            raise HTTPException(400, "WhatsApp agent not configured")
        pre_screening.whatsapp_enabled = request.whatsapp_enabled
    
    save(pre_screening)
    
    return {
        "status": "success",
        "is_online": pre_screening.is_online,
        "voice_enabled": pre_screening.voice_enabled,
        "whatsapp_enabled": pre_screening.whatsapp_enabled,
        "message": "Status updated",
        "elevenlabs_agent_id": pre_screening.elevenlabs_agent_id,
        "whatsapp_agent_id": pre_screening.whatsapp_agent_id
    }
```

## Frontend Integration

The frontend will call the API like this:

```typescript
// Toggle specific channel
await updateChannelStatus(vacancyId, { voice_enabled: false });

// Toggle master (existing behavior)
await updateChannelStatus(vacancyId, { is_online: true });

// Combined update
await updateChannelStatus(vacancyId, { 
  is_online: true, 
  voice_enabled: true, 
  whatsapp_enabled: false 
});
```

## Error Cases

| Condition | HTTP Status | Response |
|-----------|-------------|----------|
| Pre-screening not published | 400 | `{"detail": "Pre-screening not published yet"}` |
| Enable channel without agent | 400 | `{"detail": "Voice/WhatsApp agent not configured"}` |
| Invalid vacancy ID | 400 | `{"detail": "Invalid vacancy ID format"}` |
| Pre-screening not found | 404 | `{"detail": "No pre-screening found for vacancy"}` |

## Priority

Medium - Frontend is ready with optimistic updates, awaiting backend support.

## Reference

See `PUBLISH_PRE_SCREENING_API.md` for the complete publishing flow.
