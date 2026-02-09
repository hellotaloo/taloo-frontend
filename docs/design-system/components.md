# Component Catalog

Complete reference for all Taloo components organized by tier.

## Tier 1: UI Primitives

Location: `/components/ui/`

Built on Radix UI with shadcn/ui styling. **Never modify these directly** - use as building blocks.

### Buttons

**Button**
```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Forms

**Input**
```tsx
import { Input } from '@/components/ui/input';

<Input type="email" placeholder="Email..." />
```

**Textarea**
```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea placeholder="Enter text..." rows={4} />
```

**Label**
```tsx
import { Label } from '@/components/ui/label';

<Label htmlFor="email">Email</Label>
<Input id="email" />
```

**Select**
```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**Radio Group**
```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="1" id="opt1" />
    <Label htmlFor="opt1">Option 1</Label>
  </div>
</RadioGroup>
```

### Data Display

**Table**
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Card**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
  <CardFooter>
    {/* footer */}
  </CardFooter>
</Card>
```

**Badge**
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

**Avatar**
```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/user.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Overlays

**Dialog**
```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* content */}
    <DialogFooter>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Sheet**
```tsx
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild>
    <Button>Open</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
    </SheetHeader>
    {/* content */}
  </SheetContent>
</Sheet>
```

**Popover**
```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent>
    {/* content */}
  </PopoverContent>
</Popover>
```

**Tabs**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

---

## Tier 2: Reusable Composites

Location: `/components/kit/`

Generic, reusable components built by composing Tier 1 primitives.

### MetricCard

**Purpose:** Display metrics with optional change indicator and sparkline

**Location:** `components/kit/metric-card/`

**Variants:** blue, lime, dark, purple, orange

```tsx
import { MetricCard } from '@/components/kit/metric-card';

<MetricCard
  title="Total Applicanten"
  value={145}
  change={12.5}  // Percentage change (optional)
  variant="blue"
/>
```

**With Sparkline:**
```tsx
import { MetricCard, Sparkline } from '@/components/kit/metric-card';

<MetricCard variant="lime">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">Conversies</p>
      <p className="text-2xl font-bold">89</p>
    </div>
    <Sparkline data={[45, 52, 48, 63, 78, 89]} color="green" />
  </div>
</MetricCard>
```

### CollapseBox

**Purpose:** Card-style collapsible section with header (icon + title + chevron), optional scrollable content, and optional footer link. Use for vacancy text, long descriptions, or any expandable content block.

**Location:** `components/kit/collapse-box/`

```tsx
import { CollapseBox } from '@/components/kit/collapse-box';
import { FileText } from 'lucide-react';

<CollapseBox
  title="Vacaturetekst"
  icon={FileText}
  defaultOpen
  contentMaxHeight="400px"
  footerLink={{ href: 'https://...', label: 'Bekijk in Salesforce' }}
>
  <div className="prose prose-sm">
    {/* Markdown or structured content */}
  </div>
</CollapseBox>
```

**Props:** `title`, `icon?`, `children`, `footerLink?`, `defaultOpen?`, `open?`, `onOpenChange?`, `contentMaxHeight?`, `className?`, `contentClassName?`

### StatusBadge

**Purpose:** Display online/offline/concept status

**Location:** `components/kit/status/`

```tsx
import { StatusBadge } from '@/components/kit/status';

<StatusBadge isOnline={true} />   // Green "Online"
<StatusBadge isOnline={false} />  // Gray "Offline"
<StatusBadge isOnline={null} />   // Amber "Concept"
```

### ChannelIcons

**Purpose:** Display active communication channels

**Location:** `components/kit/status/`

```tsx
import { ChannelIcons } from '@/components/kit/status';

<ChannelIcons channels={{
  voice: true,
  whatsapp: true,
  cv: false
}} />
```

### DataTable

**Purpose:** Generic sortable table with customizable columns

**Location:** `components/kit/data-table/`

**Features:**
- Generic TypeScript support
- Built-in sorting (asc/desc/null cycle)
- Custom column renderers
- Row selection
- Empty states

```tsx
import { DataTable, DataTableHeader, DataTableBody, DataTableEmpty } from '@/components/kit/data-table';
import type { Column } from '@/components/kit/data-table';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    sortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    render: (user) => <StatusBadge isOnline={user.status === 'active'} />,
  },
];

<DataTable
  data={users}
  columns={columns}
  selectedId={selectedUserId}
  onRowClick={(user) => handleSelect(user)}
  defaultSortKey="name"
  defaultSortDirection="asc"
>
  <DataTableHeader />
  <DataTableBody
    emptyState={
      <DataTableEmpty
        icon={Users}
        title="No users"
        description="No users found"
      />
    }
  />
</DataTable>
```

### ChatAssistant

**Purpose:** Reusable chat interface with AI interactions

**Location:** `components/kit/chat/`

```tsx
import { ChatAssistant } from '@/components/kit/chat';

<ChatAssistant
  messages={messages}
  onSend={handleSend}
  placeholder="Ask me anything..."
  suggestions={[
    'Generate questions',
    'Improve this',
    'Translate'
  ]}
  isThinking={isLoading}
/>
```

### PromptInput

**Purpose:** Context-based prompt input with suggestions

**Location:** `components/kit/prompt-input/`

```tsx
import { PromptInput, PromptTextarea, PromptButton, PromptSuggestions } from '@/components/kit/prompt-input';

<PromptInput value={prompt} onSubmit={handleSubmit}>
  <PromptTextarea placeholder="Enter prompt..." />
  <PromptSuggestions suggestions={['Idea 1', 'Idea 2']} />
  <PromptButton>Generate</PromptButton>
</PromptInput>
```

---

## Tier 3: Domain-Specific Blocks

Location: `/components/blocks/`

Domain-specific components tied to business logic and data models.

### Vacancy Tables

**Location:** `components/blocks/vacancy-table/`

```tsx
import {
  PendingVacanciesTable,
  GeneratedVacanciesTable,
  ArchivedVacanciesTable
} from '@/components/blocks/vacancy-table';

// Table for vacancies awaiting setup
<PendingVacanciesTable
  vacancies={pendingVacancies}
  onRowClick={(vacancyId) => navigate(`/edit/${vacancyId}`)}
/>

// Table for active pre-screenings with metrics
<GeneratedVacanciesTable
  vacancies={generatedVacancies}
  onViewSource={(vacancy) => setSelectedVacancy(vacancy)}
  onRowClick={(vacancyId) => navigate(`/edit/${vacancyId}`)}
/>

// Table for archived vacancies
<ArchivedVacanciesTable
  vacancies={archivedVacancies}
  onRowClick={(vacancyId) => navigate(`/edit/${vacancyId}`)}
/>
```

### Application Dashboard

**Location:** `components/blocks/application-dashboard/`

```tsx
import {
  DashboardMetrics,
  ApplicationsTable,
  ApplicationDetailPane
} from '@/components/blocks/application-dashboard';

// Metrics overview
<DashboardMetrics applications={applications} />

// Applications table with status filtering
<ApplicationsTable
  applications={applications}
  selectedId={selectedId}
  onSelect={setSelectedId}
/>

// Detail pane for selected application
<ApplicationDetailPane
  application={selectedApplication}
  onClose={() => setSelectedId(null)}
/>
```

### Interview Editor

**Location:** `components/blocks/interview-editor/`

```tsx
import {
  InterviewQuestionsPanel,
  InterviewAssistant
} from '@/components/blocks/interview-editor';

// Question management panel
<InterviewQuestionsPanel
  questions={questions}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
/>

// Interview-specific AI chat
<InterviewAssistant
  vacancyId={vacancyId}
  questions={questions}
  onQuestionsGenerated={handleGenerated}
/>
```

### Phone Simulator

**Location:** `components/blocks/phone-simulator/`

```tsx
import { IPhoneMockup, WhatsAppChat } from '@/components/blocks/phone-simulator';

<IPhoneMockup>
  <WhatsAppChat messages={messages} />
</IPhoneMockup>
```

### Channel Management

**Location:** `components/blocks/channel-management/`

```tsx
import {
  PublishDialog,
  ChannelStatusPopover,
  TriggerInterviewDialog
} from '@/components/blocks/channel-management';

// Publish vacancy to channels
<PublishDialog vacancy={vacancy} onPublish={handlePublish} />

// Manage channel status
<ChannelStatusPopover vacancy={vacancy} onUpdate={handleUpdate} />

// Manually trigger interview
<TriggerInterviewDialog vacancyId={vacancyId} />
```

---

## Usage Guidelines

### When to Use Each Tier

**Use Tier 1 (UI Primitives):**
- Building new composite components
- Simple one-off UI elements
- Form inputs and basic layouts

**Use Tier 2 (Kit):**
- Reusable patterns across multiple views
- Generic components not tied to specific data models
- When you need consistent styling with customization

**Use Tier 3 (Blocks):**
- Domain-specific features
- Components tied to business logic
- When composing complex features from Tier 1 and 2

### Component Selection Decision Tree

```
Is it a basic UI element?
├─ Yes → Use Tier 1 (Button, Input, Card, etc.)
└─ No → Is it reusable across different domains?
   ├─ Yes → Use/create Tier 2 (MetricCard, DataTable, etc.)
   └─ No → Use/create Tier 3 (VacancyTable, ApplicationDashboard, etc.)
```

### Creating New Components

1. **Determine the tier** based on reusability and domain specificity
2. **Follow naming conventions** (kebab-case files, PascalCase components)
3. **Create directory with barrel export** (`index.ts`)
4. **Export types** alongside components
5. **Add JSDoc comments** for complex APIs
6. **Use `cn()` utility** for className composition
7. **Add data-testid** for E2E testing

**Example:**
```tsx
// components/kit/example-card/example-card.tsx
'use client';

import { cn } from '@/lib/utils';

export interface ExampleCardProps {
  title: string;
  description?: string;
  className?: string;
}

/**
 * ExampleCard displays a title and optional description
 */
export function ExampleCard({ title, description, className }: ExampleCardProps) {
  return (
    <div className={cn('p-5 border rounded-lg', className)}>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}

// components/kit/example-card/index.ts
export { ExampleCard } from './example-card';
export type { ExampleCardProps } from './example-card';
```
