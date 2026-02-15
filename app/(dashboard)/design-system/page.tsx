'use client';

import React, { useState } from 'react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import {
  ShowcaseSection,
  ComponentExample,
  ColorSwatch,
  ShowcaseNav,
  NavSection,
} from './components';

// UI Primitives
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Kit Components
import { MetricCard } from '@/components/kit/metric-card';
import { CollapseBox } from '@/components/kit/collapse-box';
import {
  Timeline,
  TimelineNode,
  SortableCard,
} from '@/components/kit/timeline';
import { ChannelIcons } from '@/components/kit/status';
import { StatusBadge } from '@/components/kit/status-badge';
import { ChatAssistant } from '@/components/kit/chat';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmpty,
} from '@/components/kit/data-table';
import { VacancyCard } from '@/components/kit/vacancy-card';
import { CandidateCard } from '@/components/kit/candidate-card';
import { HeaderActionButton } from '@/components/kit/header-action-button';

// Icons
import {
  Phone,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  FileText,
  MessageCircle,
  Pencil,
  Trash2,
  Sparkles,
  HelpCircle,
  Settings,
  Plus,
  GitBranch,
  Download,
} from 'lucide-react';

// DND Kit for Timeline
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Navigation sections
const navSections: NavSection[] = [
  {
    id: 'overview',
    title: 'Design System',
    subsections: [
      { id: 'colors', title: 'Colors' },
      { id: 'typography', title: 'Typography' },
      { id: 'spacing', title: 'Spacing' },
      { id: 'animations', title: 'Animations' },
    ],
  },
  {
    id: 'tier-1',
    title: 'Tier 1: UI Primitives',
    subsections: [
      { id: 'buttons', title: 'Buttons' },
      { id: 'inputs', title: 'Input' },
      { id: 'tables', title: 'Tables' },
      { id: 'badges-avatars', title: 'Badges & Avatars' },
      { id: 'overlays', title: 'AlertDialog & Sheets' },
      { id: 'tabs', title: 'Tabs' },
      { id: 'feedback', title: 'Tooltips & Feedback' },
    ],
  },
  {
    id: 'tier-2',
    title: 'Tier 2: Kit Components',
    subsections: [
      { id: 'metric-card', title: 'MetricCard' },
      { id: 'collapse-box', title: 'CollapseBox' },
      { id: 'timeline', title: 'Timeline System' },
      { id: 'status-badge', title: 'StatusBadge' },
      { id: 'channel-icons', title: 'ChannelIcons' },
      { id: 'vacancy-card', title: 'VacancyCard' },
      { id: 'candidate-card', title: 'CandidateCard' },
      { id: 'chat', title: 'Chat Components' },
      { id: 'data-table', title: 'DataTable' },
      { id: 'header-action-button', title: 'HeaderActionButton' },
    ],
  },
  {
    id: 'layouts',
    title: 'Layout Patterns',
  },
];

export default function DesignSystemPage() {
  // Timeline demo state
  const [timelineItems, setTimelineItems] = useState([
    { id: '1', content: 'First item - drag to reorder' },
    { id: '2', content: 'Second item - hover for actions' },
    { id: '3', content: 'Third item - fully interactive' },
  ]);

  const [readOnlyTimeline, setReadOnlyTimeline] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTimelineItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // DataTable demo data
  const tableData = [
    { id: '1', name: 'Alice Johnson', status: 'Active', date: '2026-01-15' },
    { id: '2', name: 'Bob Smith', status: 'Pending', date: '2026-01-18' },
    { id: '3', name: 'Carol Williams', status: 'Active', date: '2026-01-20' },
    { id: '4', name: 'David Brown', status: 'Inactive', date: '2026-01-22' },
    { id: '5', name: 'Eve Davis', status: 'Active', date: '2026-01-25' },
  ];

  const tableColumns = [
    { key: 'name', header: 'Name', sortable: true, accessor: (item: any) => item.name },
    { key: 'status', header: 'Status', sortable: true, accessor: (item: any) => item.status },
    { key: 'date', header: 'Date', sortable: true, accessor: (item: any) => item.date },
  ];

  return (
    <PageLayout>
      <PageLayoutHeader
        title="Design System"
        description="Visual reference for all UI components and patterns"
      />
      <PageLayoutContent
        sidebar={<ShowcaseNav sections={navSections} />}
        sidebarPosition="left"
        sidebarWidth={280}
      >
        <div className="space-y-16 pb-16">
          {/* DESIGN SYSTEM OVERVIEW */}
          <ShowcaseSection
            id="overview"
            title="Design System Overview"
            description="Core design tokens, colors, typography, spacing, and animation patterns"
          >
            {/* Colors */}
            <div id="colors" className="scroll-mt-20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Colors
              </h3>

              <div className="space-y-6">
                {/* Brand Colors */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Brand Colors
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <ColorSwatch name="Brand Blue" hex="#015AD9" />
                    <ColorSwatch name="Brand Lime" hex="#CDFE00" />
                    <ColorSwatch name="Brand Pink" hex="#E51399" />
                    <ColorSwatch name="Light Blue" hex="#7BC9EE" />
                    <ColorSwatch name="Dark Blue" hex="#022641" />
                  </div>
                </div>

                {/* Semantic Colors */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Semantic Colors
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <ColorSwatch name="Success" hex="#10b981" />
                    <ColorSwatch name="Warning" hex="#f59e0b" />
                    <ColorSwatch name="Error" hex="#ef4444" />
                    <ColorSwatch name="Muted" hex="#6b7280" />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div id="typography" className="scroll-mt-20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Typography
              </h3>

              <div className="space-y-6">
                {/* Font Families */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Font Families
                  </h4>
                  <div className="space-y-2">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Inter (Body & UI)</div>
                      <div className="font-sans text-2xl">
                        The quick brown fox jumps over the lazy dog
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Hedvig Serif (Headings)</div>
                      <div className="font-serif text-2xl">
                        The quick brown fox jumps over the lazy dog
                      </div>
                    </div>
                  </div>
                </div>

                {/* Font Sizes */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Font Sizes
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs">
                      text-xs (12px) - Small labels and metadata
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm">
                      text-sm (14px) - Body text and UI elements
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-base">
                      text-base (16px) - Default paragraph text
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-lg">
                      text-lg (18px) - Subsection headers
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-xl">
                      text-xl (20px) - Section headers
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-2xl">
                      text-2xl (24px) - Large headers
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-4xl font-serif">
                      text-4xl (36px) - Page titles (Hedvig Serif)
                    </div>
                  </div>
                </div>

                {/* Font Weights */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Font Weights
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-white border border-gray-200 rounded-lg font-normal">
                      font-normal (400) - Regular body text
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg font-medium">
                      font-medium (500) - Labels and emphasis
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg font-semibold">
                      font-semibold (600) - Section headers
                    </div>
                    <div className="p-3 bg-white border border-gray-200 rounded-lg font-bold">
                      font-bold (700) - Strong emphasis
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div id="spacing" className="scroll-mt-20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Spacing
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">gap-4 (1rem / 16px) - Between cards in grid</div>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-blue-100 rounded"></div>
                    <div className="w-20 h-20 bg-blue-100 rounded"></div>
                    <div className="w-20 h-20 bg-blue-100 rounded"></div>
                  </div>
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">p-5 (1.25rem / 20px) - Standard card padding</div>
                  <div className="p-5 bg-blue-100 rounded">
                    <div className="bg-white p-2 rounded text-sm">Content with p-5 padding</div>
                  </div>
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">space-y-8 (2rem / 32px) - Between content blocks</div>
                  <div className="space-y-8">
                    <div className="h-12 bg-blue-100 rounded"></div>
                    <div className="h-12 bg-blue-100 rounded"></div>
                    <div className="h-12 bg-blue-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Animations */}
            <div id="animations" className="scroll-mt-20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Animations
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">
                    fade-in-up (300ms) - Card animations
                  </div>
                  <div className="animate-[fade-in-up_0.6s_ease-out] p-4 bg-blue-100 rounded-lg text-center">
                    This card fades in from below
                  </div>
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">
                    transition-colors (300ms) - Hover effects
                  </div>
                  <Button className="transition-colors duration-300">
                    Hover me
                  </Button>
                </div>
              </div>
            </div>
          </ShowcaseSection>

          {/* TIER 1: UI PRIMITIVES */}
          <ShowcaseSection
            id="tier-1"
            title="Tier 1: UI Primitives"
            description="Core shadcn/ui components built on Radix UI primitives"
          >
            {/* Buttons */}
            <div id="buttons" className="scroll-mt-20">
              <ComponentExample
                name="Buttons"
                description="Button component with multiple variants and sizes"
                importPath="@/components/ui/button"
                filePath="/components/ui/button.tsx"
              >
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Variants</div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Sizes</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>
              </div>
            </ComponentExample>
            </div>

            {/* Input */}
            <div id="inputs" className="scroll-mt-20">
              <ComponentExample
                name="Input"
                description="Text input field with various types"
                importPath="@/components/ui/input"
                filePath="/components/ui/input.tsx"
              >
                <div className="max-w-md space-y-3">
                  <Input placeholder="Enter your name" />
                  <Input type="email" placeholder="Email address" />
                  <Input type="password" placeholder="Password" />
                  <Input disabled placeholder="Disabled input" />
                </div>
              </ComponentExample>
            </div>

            {/* Tables */}
            <div id="tables" className="scroll-mt-20">
              <ComponentExample
                name="Table"
                description="Data table with header and rows"
                importPath="@/components/ui/table"
                filePath="/components/ui/table.tsx"
              >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Alice Johnson</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Admin</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Bob Smith</TableCell>
                    <TableCell>Pending</TableCell>
                    <TableCell>User</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Carol Williams</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Manager</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ComponentExample>
            </div>

            {/* Badges & Avatars */}
            <div id="badges-avatars" className="scroll-mt-20">
              <ComponentExample
                name="Badge"
                description="Small status or label indicator"
                importPath="@/components/ui/badge"
                filePath="/components/ui/badge.tsx"
              >
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </ComponentExample>

              <ComponentExample
                name="Avatar"
                description="User profile image with fallback"
                importPath="@/components/ui/avatar"
                filePath="/components/ui/avatar.tsx"
              >
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback className="bg-brand-blue text-white">TC</AvatarFallback>
                  </Avatar>
                </div>
              </ComponentExample>
            </div>

            {/* AlertDialog & Sheets */}
            <div id="overlays" className="scroll-mt-20">
              <ComponentExample
                name="AlertDialog"
                description="Confirmation dialog with action buttons"
                importPath="@/components/ui/alert-dialog"
                filePath="/components/ui/alert-dialog.tsx"
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Open Alert</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </ComponentExample>

              <ComponentExample
                name="Sheet"
                description="Slide-in side panel"
                importPath="@/components/ui/sheet"
                filePath="/components/ui/sheet.tsx"
              >
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Open Sheet</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Sheet Title</SheetTitle>
                      <SheetDescription>
                        This is a sheet component that slides in from the side.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                      <p className="text-sm text-gray-600">
                        Sheet content goes here. Perfect for forms, details, or
                        additional information.
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>
              </ComponentExample>
            </div>

            {/* Tabs */}
            <div id="tabs" className="scroll-mt-20">
              <ComponentExample
                name="Tabs"
                description="Tabbed navigation with default and line variants"
                importPath="@/components/ui/tabs"
                filePath="/components/ui/tabs.tsx"
              >
                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Default Variant
                    </div>
                    <Tabs defaultValue="tab1">
                      <TabsList>
                        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                      </TabsList>
                      <TabsContent value="tab1">
                        <div className="p-4 border rounded-lg">
                          Content for Tab 1
                        </div>
                      </TabsContent>
                      <TabsContent value="tab2">
                        <div className="p-4 border rounded-lg">
                          Content for Tab 2
                        </div>
                      </TabsContent>
                      <TabsContent value="tab3">
                        <div className="p-4 border rounded-lg">
                          Content for Tab 3
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Line Variant (used in app pages)
                    </div>
                    <Tabs defaultValue="new">
                      <TabsList variant="line">
                        <TabsTrigger value="new">
                          New
                        </TabsTrigger>
                        <TabsTrigger value="active">
                          Active
                        </TabsTrigger>
                        <TabsTrigger value="archived">
                          Archived
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="new">
                        <div className="p-4 border rounded-lg">
                          New items content
                        </div>
                      </TabsContent>
                      <TabsContent value="active">
                        <div className="p-4 border rounded-lg">
                          Active items content
                        </div>
                      </TabsContent>
                      <TabsContent value="archived">
                        <div className="p-4 border rounded-lg">
                          Archived items content
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ComponentExample>
            </div>

            {/* Feedback */}
            <div id="feedback" className="scroll-mt-20">
              <ComponentExample
                name="Tooltip"
                description="Hover-triggered contextual information"
                importPath="@/components/ui/tooltip"
                filePath="/components/ui/tooltip.tsx"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">Hover for tooltip</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is a helpful tooltip message</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </ComponentExample>

              <ComponentExample
                name="Skeleton"
                description="Loading state placeholder"
                importPath="@/components/ui/skeleton"
                filePath="/components/ui/skeleton.tsx"
              >
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-12 w-1/2" />
                </div>
              </ComponentExample>
            </div>
          </ShowcaseSection>

          {/* TIER 2: KIT COMPONENTS */}
          <ShowcaseSection
            id="tier-2"
            title="Tier 2: Kit Components"
            description="Reusable composite components with domain-agnostic patterns"
          >
            {/* MetricCard */}
            <div id="metric-card" className="scroll-mt-20">
              <ComponentExample
                name="MetricCard"
                description="Metric display card with 6 color variants, optional sparkline, and progress bar support"
                importPath="@/components/kit/metric-card"
                filePath="/components/kit/metric-card/metric-card.tsx"
              >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  variant="blue"
                  title="Telefoongesprekken"
                  icon={Phone}
                  label="Totaal verzonden"
                  value="123"
                />
                <MetricCard
                  variant="lime"
                  title="Succespercentage"
                  icon={CheckCircle}
                  label="Afgerond"
                  value="85%"
                />
                <MetricCard
                  variant="dark"
                  title="Actieve gebruikers"
                  icon={Users}
                  label="Online nu"
                  value="45"
                />
                <MetricCard
                  variant="purple"
                  title="In behandeling"
                  icon={Clock}
                  label="Wachtend"
                  value="12"
                />
                <MetricCard
                  variant="orange"
                  title="Waarschuwingen"
                  icon={AlertTriangle}
                  label="Aandacht vereist"
                  value="3"
                />
                <MetricCard
                  variant="pink"
                  title="Highlights"
                  icon={Star}
                  label="Deze week"
                  value="8"
                />
              </div>
            </ComponentExample>
            </div>

            {/* CollapseBox */}
            <div id="collapse-box" className="scroll-mt-20">
              <ComponentExample
                name="CollapseBox"
                description="Card-style collapsible section with header (icon + title), content area, and optional footer link"
                importPath="@/components/kit/collapse-box"
                filePath="/components/kit/collapse-box/collapse-box.tsx"
              >
                <div className="max-w-md">
                  <CollapseBox
                    title="Vacaturetekst"
                    icon={FileText}
                    defaultOpen
                    contentMaxHeight="320px"
                    footerLink={{
                      href: 'https://example.salesforce.com',
                      label: 'Bekijk in Salesforce',
                    }}
                  >
                    <div className="text-sm text-gray-600 prose prose-sm max-w-none">
                      <h3 className="text-sm font-semibold text-gray-800 mt-0 mb-2">
                        Over deze job
                      </h3>
                      <p className="mb-4">
                        Voor onze klant, gelegen te Kortrijk, zijn wij op zoek
                        naar een operator voor de mengafdeling.
                      </p>
                      <h3 className="text-sm font-semibold text-gray-800 mt-3 mb-2">
                        Jouw taken:
                      </h3>
                      <ul className="list-disc list-inside mb-4 space-y-0.5 text-gray-600">
                        <li>Afwegen van grondstoffen volgens vastgelegde recepten</li>
                        <li>Toevoegen van grondstoffen aan de menginstallatie</li>
                        <li>Instellen en bedienen van mengmachines</li>
                        <li>Uitvoeren van kwaliteitscontroles tijdens het productieproces</li>
                      </ul>
                      <h3 className="text-sm font-semibold text-gray-800 mt-3 mb-2">
                        Profiel:
                      </h3>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                        <li>Goede kennis Nederlands, basiskennis Frans</li>
                        <li>Nauwkeurig en gestructureerd kunnen werken</li>
                        <li>Sterke rekenvaardigheden</li>
                        <li>Geen probleem met werken in een stoffige omgeving</li>
                        <li>Fysiek werk aankunnen</li>
                      </ul>
                    </div>
                  </CollapseBox>
                </div>
              </ComponentExample>
            </div>

            {/* Timeline System */}
            <div id="timeline" className="scroll-mt-20">
              <ComponentExample
                name="Timeline System"
                description="Vertical workflow visualization with drag-and-drop, hover actions, and animations"
                importPath="@/components/kit/timeline"
                filePath="/components/kit/timeline/timeline.tsx"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={readOnlyTimeline}
                        onChange={(e) => setReadOnlyTimeline(e.target.checked)}
                        className="mr-2"
                      />
                      Read-only mode
                    </label>
                  </div>

                  <Timeline>
                    <TimelineNode animationDelay={0}>
                      <div className="text-sm text-gray-600 font-medium">
                        Start
                      </div>
                    </TimelineNode>

                    <TimelineNode alignDot="top" animationDelay={80}>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={timelineItems.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {timelineItems.map((item, index) => (
                              <SortableCard
                                key={item.id}
                                id={item.id}
                                animationDelay={140 + index * 60}
                                readOnly={readOnlyTimeline}
                                actions={[
                                  {
                                    icon: Pencil,
                                    label: 'Edit',
                                    onClick: () => alert(`Edit ${item.id}`),
                                  },
                                  {
                                    icon: Trash2,
                                    label: 'Delete',
                                    onClick: () => alert(`Delete ${item.id}`),
                                    variant: 'danger',
                                  },
                                ]}
                              >
                                <div className="text-sm text-gray-700">
                                  {item.content}
                                </div>
                              </SortableCard>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </TimelineNode>

                    <TimelineNode animationDelay={400}>
                      <div className="text-sm text-gray-600 font-medium">
                        End
                      </div>
                    </TimelineNode>
                  </Timeline>
                </div>
              </ComponentExample>
            </div>

            {/* StatusBadge */}
            <div id="status-badge" className="scroll-mt-20">
              <ComponentExample
                name="StatusBadge"
                description="Pill badge with transparent background, colored border and text"
                importPath="@/components/kit/status-badge"
                filePath="/components/kit/status-badge/status-badge.tsx"
              >
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col items-center gap-2">
                  <StatusBadge label="Online" variant="green" />
                  <div className="text-xs text-gray-500">variant=&quot;green&quot;</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <StatusBadge label="Offline" variant="gray" />
                  <div className="text-xs text-gray-500">variant=&quot;gray&quot;</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <StatusBadge label="Concept" variant="orange" />
                  <div className="text-xs text-gray-500">variant=&quot;orange&quot;</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <StatusBadge label="Bezig" variant="blue" />
                  <div className="text-xs text-gray-500">variant=&quot;blue&quot;</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <StatusBadge label="Niet geslaagd" variant="red" />
                  <div className="text-xs text-gray-500">variant=&quot;red&quot;</div>
                </div>
              </div>
            </ComponentExample>
            </div>

            {/* ChannelIcons */}
            <div id="channel-icons" className="scroll-mt-20">
              <ComponentExample
              name="ChannelIcons"
              description="Communication channel indicators (WhatsApp, Voice, CV)"
              importPath="@/components/kit/status"
              filePath="/components/kit/status/channel-icons.tsx"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-600">All active:</div>
                  <ChannelIcons
                    channels={{ voice: true, whatsapp: true, cv: true }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-600">Partial:</div>
                  <ChannelIcons
                    channels={{ voice: true, whatsapp: true, cv: false }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-600">Voice only:</div>
                  <ChannelIcons
                    channels={{ voice: true, whatsapp: false, cv: false }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-600">None:</div>
                  <ChannelIcons
                    channels={{ voice: false, whatsapp: false, cv: false }}
                  />
                </div>
              </div>
            </ComponentExample>
            </div>

            {/* VacancyCard */}
            <div id="vacancy-card" className="scroll-mt-20">
              <ComponentExample
                name="VacancyCard"
                description="Clickable vacancy card showing title, company, application status, score, and applied date"
                importPath="@/components/kit/vacancy-card"
                filePath="/components/kit/vacancy-card/vacancy-card.tsx"
              >
                <div className="space-y-3 max-w-md">
                  <VacancyCard
                    title="Magazijnier"
                    company="Logistics BV"
                    status="placed"
                    score={85}
                    appliedAt="2026-02-08T10:30:00Z"
                    href="/pre-screening/view/1"
                  />
                  <VacancyCard
                    title="Orderpicker"
                    company="Warehouse NV"
                    status="screening"
                    score={72}
                    appliedAt="2026-02-05T14:00:00Z"
                    href="/pre-screening/view/2"
                  />
                  <VacancyCard
                    title="Vorkliftchauffeur"
                    company="Transport Co"
                    status="applied"
                    score={null}
                    appliedAt="2026-02-10T09:15:00Z"
                    href="/pre-screening/view/3"
                  />
                  <VacancyCard
                    title="Non-clickable Card"
                    company="Demo Company"
                    status="submitted"
                    score={65}
                    appliedAt="2026-02-01T08:00:00Z"
                  />
                </div>
              </ComponentExample>
            </div>

            {/* CandidateCard */}
            <div id="candidate-card" className="scroll-mt-20">
              <ComponentExample
                name="CandidateCard"
                description="Clickable candidate card showing name, contact info, application status, score, and channel"
                importPath="@/components/kit/candidate-card"
                filePath="/components/kit/candidate-card/candidate-card.tsx"
              >
                <div className="space-y-3 max-w-md">
                  <CandidateCard
                    name="Jan Janssen"
                    email="jan.janssen@email.com"
                    phone="+32 470 12 34 56"
                    status="placed"
                    score={85}
                    channel="whatsapp"
                    appliedAt="2026-02-08T10:30:00Z"
                    href="/overviews?tab=candidates"
                  />
                  <CandidateCard
                    name="Marie Peeters"
                    email="marie.peeters@email.com"
                    phone="+32 471 23 45 67"
                    status="screening"
                    score={null}
                    channel="voice"
                    appliedAt="2026-02-10T14:00:00Z"
                    href="/overviews?tab=candidates"
                  />
                  <CandidateCard
                    name="Pieter De Smet"
                    email="pieter.desmet@email.com"
                    status="applied"
                    score={null}
                    channel="cv"
                    appliedAt="2026-02-11T09:15:00Z"
                  />
                </div>
              </ComponentExample>
            </div>

            {/* ChatAssistant */}
            <div id="chat" className="scroll-mt-20">
              <ComponentExample
                name="ChatAssistant"
                description="Full-featured AI chat interface with context, suggestions, and markdown support"
                importPath="@/components/kit/chat"
                filePath="/components/kit/chat/chat-assistant.tsx"
              >
                <div className="max-w-2xl">
                  <ChatAssistant
                    initialMessage="I'm a sample assistant. Try the suggestions below or type your own message!"
                    placeholder="Type a message..."
                    onSubmit={async (message) => {
                      // Demo echo response
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                      return `You said: "${message}". This is a demo response showing the chat functionality.`;
                    }}
                    suggestions={[
                      {
                        label: 'Example 1',
                        prompt: 'Tell me about the design system',
                        icon: Sparkles,
                      },
                      {
                        label: 'Example 2',
                        prompt: 'How do I use the Timeline component?',
                        icon: HelpCircle,
                      },
                    ]}
                  />
                </div>
              </ComponentExample>
            </div>

            {/* DataTable */}
            <div id="data-table" className="scroll-mt-20">
              <ComponentExample
                name="DataTable"
                description="Composable table with sorting, selection, and context-based API"
                importPath="@/components/kit/data-table"
                filePath="/components/kit/data-table/data-table.tsx"
              >
                <DataTable
                  data={tableData}
                  columns={tableColumns}
                  defaultSortKey="name"
                >
                  <DataTableHeader />
                  {tableData.length > 0 ? (
                    <DataTableBody />
                  ) : (
                    <DataTableEmpty description="No data found" />
                  )}
                </DataTable>
              </ComponentExample>
            </div>

            {/* HeaderActionButton */}
            <div id="header-action-button" className="scroll-mt-20">
              <ComponentExample
                name="HeaderActionButton"
                description="Standardized button for page header actions with consistent size and spacing"
                importPath="@/components/kit/header-action-button"
                filePath="/components/kit/header-action-button/header-action-button.tsx"
              >
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Outline variant (default)</div>
                    <div className="flex flex-wrap gap-3">
                      <HeaderActionButton icon={Settings}>
                        Instellingen
                      </HeaderActionButton>
                      <HeaderActionButton icon={GitBranch}>
                        Graph
                      </HeaderActionButton>
                      <HeaderActionButton icon={Download}>
                        Export
                      </HeaderActionButton>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Primary variant</div>
                    <div className="flex flex-wrap gap-3">
                      <HeaderActionButton icon={Plus} variant="primary">
                        Nieuw
                      </HeaderActionButton>
                      <HeaderActionButton icon={Plus} variant="primary">
                        Toevoegen
                      </HeaderActionButton>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Combined (typical header pattern)</div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <HeaderActionButton icon={GitBranch}>
                        Graph
                      </HeaderActionButton>
                      <HeaderActionButton icon={Plus} variant="primary">
                        Nieuw
                      </HeaderActionButton>
                    </div>
                  </div>
                </div>
              </ComponentExample>
            </div>
          </ShowcaseSection>

          {/* LAYOUT PATTERNS */}
          <ShowcaseSection
            id="layouts"
            title="Layout Patterns"
            description="Page layout system with flexible header and sidebar configurations"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  PageLayout System
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Three-component composition pattern: PageLayout, PageLayoutHeader,
                  and PageLayoutContent. Supports simple and custom headers, optional
                  sidebars (left/right), and responsive behavior.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-3">
                  <div>
                    <div className="text-gray-500 mb-1">Import:</div>
                    <code className="text-blue-600">
                      {
                        "import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';"
                      }
                    </code>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Location:</div>
                    <code className="text-gray-700">
                      /components/layout/page-layout/
                    </code>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Simple Header Pattern */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Simple Header
                  </h4>
                  <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {`<PageLayout>
  <PageLayoutHeader
    title="Page Title"
    description="Description"
  />
  <PageLayoutContent>
    {/* content */}
  </PageLayoutContent>
</PageLayout>`}
                    </pre>
                  </div>
                </div>

                {/* Header with Action */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Header with Action
                  </h4>
                  <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {`<PageLayoutHeader
  title="Insights"
  description="Discover patterns"
  action={<InfoBadge />}
/>`}
                    </pre>
                  </div>
                </div>

                {/* With Sidebar (Right) */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    With Sidebar (Right)
                  </h4>
                  <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {`<PageLayoutContent
  sidebar={<ChatAssistant />}
  sidebarWidth={420}
>
  {/* main content */}
</PageLayoutContent>`}
                    </pre>
                  </div>
                </div>

                {/* With Sidebar (Left) */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    With Sidebar (Left)
                  </h4>
                  <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {`<PageLayoutContent
  sidebar={<ShowcaseNav />}
  sidebarPosition="left"
  sidebarWidth={280}
>
  {/* main content */}
</PageLayoutContent>`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Mobile Responsive
                </div>
                <div className="text-sm text-blue-800">
                  Sidebars are automatically hidden on mobile (hidden lg:flex) and
                  content takes full width. All layout components are responsive by
                  default.
                </div>
              </div>
            </div>
          </ShowcaseSection>
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
