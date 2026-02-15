# Taloo Design System

A comprehensive guide to building consistent, high-quality UI in the Taloo frontend.

## Quick Reference

| Element | Value |
|---------|-------|
| Primary Dark | `bg-brand-dark-blue` (#022641) |
| Primary CTA | `bg-brand-lime-green` (#CDFE00) |
| Button Primary | `bg-gray-900` |
| Body Font | Inter |
| Heading Font | Hedvig Serif (`font-serif`) |
| Card Padding | `p-5` |
| Card Gap | `gap-4` |
| Section Gap | `space-y-8` |
| Animation | `fade-in-up` 300ms |

---

## 1. Colors

### Brand Colors
```
brand-dark-blue: #022641  — Icons, dark backgrounds, accents
brand-lime-green: #CDFE00 — CTAs, highlights, success states
brand-light-blue: #7DD3FC — Text on dark backgrounds
brand-blue: #015AD9       — Links (use sparingly)
```

### Usage Guidelines
- **Icon containers**: Always use `bg-brand-dark-blue text-white`
- **Primary buttons**: Use `bg-gray-900`, NOT blue
- **CTAs on dark backgrounds**: Use `bg-brand-lime-green text-brand-dark-blue`
- **Links**: Prefer `text-gray-500 hover:text-gray-700` over blue

### Forbidden
Never use blue for primary action buttons. Blue is reserved for links only.

---

## 2. Typography

### Font Families
- **Inter** (`font-sans`): Body text, UI elements, buttons
- **Hedvig Serif** (`font-serif`): Page titles, hero headlines, marketing copy

### Heading Hierarchy
```tsx
// Page title in header
<h1 className="text-lg font-semibold text-gray-900">Page Title</h1>

// Section title
<h2 className="text-lg font-semibold text-gray-900">Section Title</h2>

// Hero/feature headline (serif)
<h2 className="text-2xl font-serif text-white">Headline</h2>

// Card title
<h3 className="font-medium text-gray-900">Card Title</h3>
```

### Body Text
```tsx
// Primary body
<p className="text-sm text-gray-700">...</p>

// Secondary/muted
<p className="text-sm text-gray-500">...</p>

// Small/caption
<p className="text-xs text-gray-500">...</p>

// On dark backgrounds
<p className="text-sm text-brand-light-blue">...</p>
<p className="text-xs text-brand-light-blue/70">...</p>
```

---

## 3. Spacing

### Standard Gaps
```
gap-2  — Between icon and text
gap-3  — Between header elements
gap-4  — Between cards in a grid
space-y-8 — Between page sections
```

### Card Padding
```
p-4  — Compact cards
p-5  — Standard cards
p-6  — Feature cards, banners
p-8  — Hero sections
```

### Layout
```tsx
// Page content container
<div className="max-w-5xl space-y-8">

// Card grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## 4. Component Architecture

### 3-Tier Structure

**Tier 1: UI Primitives** (`/components/ui/`)
- shadcn-style components built on Radix UI
- Button, Table, Dialog, Sheet, Badge, Input, etc.
- Never modify directly

**Tier 2: Kit Components** (`/components/kit/`)
- Reusable, domain-agnostic composites
- MetricCard, StatusBadge, Timeline, HeaderActionButton, etc.
- Use variant systems and Context patterns

**Tier 3: Block Components** (`/components/blocks/`)
- Domain-specific features tied to data models
- VacancyTable, ApplicationDashboard, OntologySidebar, etc.

### Import Convention
```tsx
// Good: Import from barrel
import { MetricCard } from '@/components/kit/metric-card';
import { Button } from '@/components/ui/button';

// Bad: Import from specific file
import { MetricCard } from '@/components/kit/metric-card/metric-card';
```

---

## 5. Page Layout

### Standard Page Structure
```tsx
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';

// Simple page
<PageLayout>
  <PageLayoutHeader title="Page Title" description="Description" />
  <PageLayoutContent>
    {/* Content */}
  </PageLayoutContent>
</PageLayout>

// With sidebar
<PageLayout>
  <PageLayoutHeader title="Title" action={<HeaderActionButton />} />
  <PageLayoutContent sidebar={<Sidebar />} sidebarWidth={420}>
    {/* Content */}
  </PageLayoutContent>
</PageLayout>
```

### Page Header with Back Button
```tsx
<PageLayoutHeader>
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center gap-3">
      <Link
        href="/parent"
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="text-lg font-semibold text-gray-900">Page Title</h1>
    </div>
    <div className="flex items-center gap-2">
      <HeaderActionButton icon={Settings}>Settings</HeaderActionButton>
    </div>
  </div>
</PageLayoutHeader>
```

### Breadcrumbs Pattern
```tsx
<div className="flex items-center gap-3">
  <button onClick={goBack} className="...back-button-styles...">
    <ArrowLeft className="w-5 h-5" />
  </button>
  <div className="flex items-center gap-2 text-lg">
    <button
      onClick={() => router.push('/parent')}
      className="text-gray-400 hover:text-gray-600 transition-colors"
    >
      Parent Section
    </button>
    <ChevronRight className="w-4 h-4 text-gray-300" />
    <h1 className="font-semibold text-gray-900">Current Page</h1>
  </div>
</div>
```

---

## 6. New Page Setup (REQUIRED)

Every new page requires **3 things**:

### Step 1: Create `page.tsx`
Your page component.

### Step 2: Create `layout.tsx` (Browser Tab Title)
```tsx
// app/(dashboard)/your-page/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title | Taloo',
  description: 'Brief description of the page',
};

export default function YourPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

### Step 3: Add to Page Registry (Header Tab Title)
Add your route to `lib/page-registry.ts`:

```tsx
// In pageConfigs object:
'/your-page': { title: 'Your Page', icon: YourIcon },

// For dynamic routes, add to dynamicRoutes array:
{ pattern: /^\/your-page\/\d+/, config: { title: 'Your Page', icon: YourIcon } },
```

⚠️ **Without Step 3, the header will show "Nieuw tabblad"!**

### Naming Convention
- Browser tab: `Page Title | Taloo`
- Header tab: Just `Page Title`
- Examples:
  - `Activiteiten | Taloo` (browser) / `Activiteiten` (header)
  - `Monitor | Taloo` (browser) / `Monitor` (header)

### Checklist
- [ ] `page.tsx` created
- [ ] `layout.tsx` with metadata
- [ ] Entry in `lib/page-registry.ts`
- [ ] Navigation link added (sidebar, admin hub, etc.)

---

## 7. Header Action Buttons

Use `HeaderActionButton` for consistent header button styling:

```tsx
import { HeaderActionButton } from '@/components/kit/header-action-button';

// Outline variant (default)
<HeaderActionButton icon={Settings}>Instellingen</HeaderActionButton>

// Primary variant
<HeaderActionButton icon={Plus} variant="primary">Nieuw</HeaderActionButton>

// Typical header pattern
<div className="flex items-center gap-2">
  <HeaderActionButton icon={GitBranch}>Graph</HeaderActionButton>
  <HeaderActionButton icon={Plus} variant="primary">Nieuw</HeaderActionButton>
</div>
```

---

## 8. Cards

### Standard Card
```tsx
<div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors">
  {/* Card content */}
</div>
```

### Card with Animation
```tsx
<div
  className="rounded-xl border border-gray-200 bg-white p-5"
  style={{ animation: `fade-in-up 0.3s ease-out ${index * 50}ms backwards` }}
>
```

### Feature Banner (Dark)
```tsx
<div className="rounded-2xl bg-brand-dark-blue p-6 relative overflow-hidden">
  {/* Background decoration */}
  <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

  <div className="relative z-10 space-y-3">
    {/* Label */}
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-brand-lime-green" />
      <span className="text-xs font-medium text-brand-lime-green uppercase tracking-wide">
        Label
      </span>
    </div>

    {/* Headline (serif) */}
    <h2 className="text-2xl font-serif text-white max-w-lg">
      Headline text here
    </h2>

    {/* Description */}
    <p className="text-sm text-brand-light-blue max-w-xl">
      Description text...
    </p>

    {/* Secondary info */}
    <p className="text-xs text-brand-light-blue/70 max-w-xl pt-1">
      Additional context...
    </p>
  </div>
</div>
```

---

## 9. Animations

### Fade In Up
The standard entrance animation for cards and content:

```css
/* Already defined in globals.css */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Usage
```tsx
// Staggered card animations
{items.map((item, index) => (
  <Card
    key={item.id}
    style={{ animation: `fade-in-up 0.3s ease-out ${index * 50}ms backwards` }}
  />
))}
```

### Hover Transitions
```tsx
// Standard hover
className="transition-colors hover:bg-gray-100"

// For interactive cards
className="hover:border-gray-300 transition-colors cursor-pointer"
```

---

## 10. Icons

### Icon Containers
Always wrap icons in a container with brand colors:

```tsx
// Standard icon container
<div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center">
  <Icon className="w-4 h-4 text-white" />
</div>

// Large icon container
<div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
  <Icon className="w-5 h-5 text-white" />
</div>
```

### Forbidden Icons
Never use these icons — they look generic/template-like:
- `Sparkles` / `Star` — AI/magic cliché
- `Bot` / `Robot` — too generic for AI features

Use domain-specific icons instead (e.g., `Globe` for international, `Briefcase` for jobs).

---

## 11. Sheets (Slide-in Panels)

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent className="sm:max-w-[450px] flex flex-col h-full">
    <SheetHeader className="shrink-0 border-b pb-4">
      <SheetTitle className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        Title
      </SheetTitle>
      <SheetDescription>Description text</SheetDescription>
    </SheetHeader>

    <div className="flex-1 overflow-y-auto px-4 py-6">
      {/* Scrollable content */}
    </div>

    <SheetFooter className="shrink-0 border-t flex-row justify-between">
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

## 12. Status Badges

Use `StatusBadge` for consistent status indicators throughout the app.

### Design Specs
- **Shape**: Pill (rounded-full)
- **Background**: Transparent (no fill)
- **Border**: Solid 1px in matching -600 color
- **Text**: Matching -600 color
- **Indicator**: Dot (default) or icon

### Usage
```tsx
import { StatusBadge } from '@/components/kit/status-badge';
import { Calendar } from 'lucide-react';

// With dot indicator (default)
<StatusBadge label="Bezig" variant="blue" />
<StatusBadge label="Review nodig" variant="orange" />
<StatusBadge label="Niet geslaagd" variant="red" />
<StatusBadge label="Afgebroken" variant="gray" />

// With icon (replaces dot)
<StatusBadge label="18 feb, 14u" variant="green" icon={Calendar} />
```

### Variants
| Variant | Border | Text | Use Case |
|---------|--------|------|----------|
| `blue` | border-blue-600 | text-blue-600 | Active, in progress |
| `green` | border-green-500 | text-green-500 | Success, scheduled |
| `orange` | border-orange-600 | text-orange-600 | Warning, needs review |
| `red` | border-red-600 | text-red-600 | Error, failed |
| `gray` | border-gray-400 | text-gray-600 | Inactive, abandoned |

### Props
```tsx
interface StatusBadgeProps {
  label: string;                    // Text to display
  variant: 'blue' | 'green' | 'orange' | 'red' | 'gray';
  icon?: LucideIcon;                // Optional icon (replaces dot)
  className?: string;               // Additional classes
}
```

---

## 13. Tag Badges

Use `TagBadge` for category/type labels (agents, workflow types, test indicators).

### Design Specs
- **Shape**: Rounded rectangle (rounded)
- **Background**: Filled (-500 shade)
- **Text**: White
- **Icon**: Optional, displayed before label

### When to Use
- **TagBadge**: Category labels (Pre-screening, Document Collection, Test)
- **StatusBadge**: Status indicators (Online/Offline, In Progress, Failed)

### Usage
```tsx
import { TagBadge } from '@/components/kit/tag-badge';
import { Phone, FileCheck, FlaskConical } from 'lucide-react';

// Agent types
<TagBadge label="Pre-screening" variant="blue" icon={Phone} />
<TagBadge label="Document Collection" variant="purple" icon={FileCheck} />

// Test indicator
<TagBadge label="Test" variant="orange" icon={FlaskConical} />

// Status labels
<TagBadge label="Vast" variant="orange" />
<TagBadge label="Afgerond" variant="gray" />
```

### Variants
| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| `blue` | bg-blue-500 | text-white | Pre-screening, primary features |
| `green` | bg-green-500 | text-white | Success, active |
| `orange` | bg-orange-500 | text-white | Test, warning, stuck |
| `red` | bg-red-500 | text-white | Error, urgent |
| `purple` | bg-purple-500 | text-white | Document Collection |
| `gray` | bg-gray-500 | text-white | Inactive, completed |

### Props
```tsx
interface TagBadgeProps {
  label: string;                    // Text to display
  variant: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  icon?: LucideIcon;                // Optional icon (before label)
  className?: string;               // Additional classes
}
```

---

## 14. Tables

Use the DataTable component for consistent table styling:

```tsx
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmpty,
} from '@/components/kit/data-table';

<DataTable
  columns={columns}
  data={data}
  onRowClick={handleRowClick}
>
  <DataTableHeader />
  {data.length > 0 ? (
    <DataTableBody />
  ) : (
    <DataTableEmpty description="No data found" />
  )}
</DataTable>
```

---

## 15. Best Practices

### Do
- Use the 3-tier component architecture
- Follow the spacing and color conventions
- Add `data-testid` attributes for testing
- Use TypeScript interfaces for all props
- Export types alongside components

### Don't
- Create new color variables without approval
- Use inline styles (except for animations)
- Skip the `cn()` utility for conditional classes
- Nest components too deeply
- Create components for one-time use

### File Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Props: `PascalCaseProps`

---

## Live Examples

Visit `/design-system` in the app to see interactive examples of all components.
