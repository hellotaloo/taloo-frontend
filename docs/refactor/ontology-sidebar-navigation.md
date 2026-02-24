# Refactor: Ontology Sidebar Navigation

## Problem

The browse mode sidebar lists individual object types (Categorieën, Functies, Documenttypes, etc.) as separate nav items under "OBJECT TYPES". Clicking one goes directly to a flat entity list for that type. This creates inconsistencies:

1. **Object types aren't treated as entities** — clicking "Categorieën" shows a list, but there's no detail view for the type itself (with its relations, schema, config)
2. **Redundant with discover view** — the discover page already shows the same types as cards with counts
3. **Breadcrumb confusion** — when navigating cross-type (Category → Job Function), the root section changes, making it unclear where you started
4. **Sidebar clutter** — 5+ type items take up space that could be used for more useful navigation

## Proposed Change

Replace the individual type nav items with a single "Object Types" nav item that leads to a type overview.

### Before (current)
```
Ontdekken
Geschiedenis
─────────────
OBJECT TYPES
  Categorieën      5
  Functies        12
  Documenttypes   15
  Vaardigheden     0
  Vereisten        0
  + Nieuw object
```

### After (proposed)
```
Ontdekken
Geschiedenis
Object Types      5
```

Clicking "Object Types" shows the type cards grid (already exists in the discover view). Clicking a type card enters the entity list for that type. The navigation then follows the existing pattern:

```
Object Types → Categorieën (list) → Transport (entity) → Chauffeur CE (entity)
```

### Impact

**Sidebar (`ontology-sidebar.tsx`):**
- Remove the `Collapsible` section with individual type items
- Add a single "Object Types" NavItem with count = `types.length`
- Remove `entityTypes` prop (no longer needed in browse mode)

**Page (`page.tsx`):**
- Add a new section view for "object-types" that shows the type cards grid
- When clicking a type card, set `activeSection` to that type's slug (existing behavior)
- The type entity list view stays as-is

**Discover view:**
- Consider whether to keep the "Object Types" section in discover, or just link to the new dedicated view
- Could simplify discover to focus on recent activity / search results

### Breadcrumb Integration

With this change, the breadcrumb root would always be the type name (e.g., "Categorieën"), and clicking it returns to that type's entity list. Going further back (to the Object Types overview) would use the browser back button or the sidebar.

### Migration Steps

1. Add "object-types" as a new section in the sidebar and page routing
2. Extract the type cards grid from the discover view into a reusable component
3. Replace the collapsible type list in browse sidebar with a single nav item
4. Update `handleEntityClick` to set `rootSectionSlug` correctly for the new flow
5. Test all navigation paths: Object Types → type list → entity → entity → back at each level
