'use client';

import { Phone, CheckCircle2, Users, MapPin, Building2, ArrowRight, Archive, Loader2, Info, ExternalLink, Calendar, Plus, Zap, MessageCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Vacancy } from '@/lib/types';
import { getVacancies } from '@/lib/interview-api';
import { MetricCard, ChannelCard } from '@/components/metrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PendingSetup({ 
  vacancies, 
  onViewSource 
}: { 
  vacancies: Vacancy[];
  onViewSource: (vacancy: Vacancy) => void;
}) {
  const router = useRouter();
  
  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">All vacancies have been set up.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Vacancy</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Imported</TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vacancies.map((vacancy) => (
          <TableRow 
            key={vacancy.id}
            className="cursor-pointer"
            onClick={() => router.push(`/pre-screening/edit/${vacancy.id}`)}
          >
            <TableCell>
              <div className="min-w-0">
                <span className="font-medium text-gray-900 truncate block">
                  {vacancy.title}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {vacancy.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {vacancy.location}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {vacancy.source === 'salesforce' ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); onViewSource(vacancy); }}
                  className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  title="View source record"
                >
                  <Image 
                    src="/salesforc-logo-cloud.png" 
                    alt="Salesforce" 
                    width={16} 
                    height={11}
                    className="opacity-70"
                  />
                  <span className="text-xs font-medium">View</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : vacancy.source === 'bullhorn' ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); onViewSource(vacancy); }}
                  className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  title="View source record"
                >
                  <Image 
                    src="/bullhorn-icon-small.png" 
                    alt="Bullhorn" 
                    width={16} 
                    height={16}
                    className="opacity-70"
                  />
                  <span className="text-xs font-medium">View</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-xs text-gray-500">Manual</span>
              )}
            </TableCell>
            <TableCell className="text-gray-500 text-sm">
              {formatDate(vacancy.createdAt)}
            </TableCell>
            <TableCell className="text-right">
                <Link
                  href={`/pre-screening/edit/${vacancy.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Generate pre-screening
                <ArrowRight className="w-3 h-3" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Status badge component for Generated table
// Uses is_online field: null = draft, true = online, false = offline
function StatusBadge({ isOnline }: { isOnline: boolean | null }) {
  if (isOnline === true) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Online
      </span>
    );
  }
  
  if (isOnline === false) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Offline
      </span>
    );
  }
  
  // isOnline === null means draft (not published yet)
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Draft
    </span>
  );
}

// Channel icons component showing active channels
function ChannelIcons({ channels }: { channels: { voice: boolean; whatsapp: boolean; cv: boolean } }) {
  const hasAnyChannel = channels.voice || channels.whatsapp || channels.cv;
  
  if (!hasAnyChannel) {
    return <span className="text-gray-400">-</span>;
  }
  
  return (
    <div className="flex items-center gap-1.5">
      {channels.whatsapp && (
        <div 
          className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center"
          title="WhatsApp channel active"
        >
          <MessageCircle className="w-3.5 h-3.5 text-green-600" />
        </div>
      )}
      {channels.voice && (
        <div 
          className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"
          title="Voice channel active"
        >
          <Phone className="w-3.5 h-3.5 text-blue-600" />
        </div>
      )}
      {channels.cv && (
        <div 
          className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center"
          title="Smart CV channel active"
        >
          <FileText className="w-3.5 h-3.5 text-purple-600" />
        </div>
      )}
    </div>
  );
}

function GeneratedTable({ vacancies }: { vacancies: Vacancy[] }) {
  const router = useRouter();
  
  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Zap className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No generated pre-screenings yet.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Vacancy</TableHead>
          <TableHead className="text-center">Channels</TableHead>
          <TableHead className="text-center">Candidates</TableHead>
          <TableHead className="text-center">Completed</TableHead>
          <TableHead className="text-center">Qualified</TableHead>
          <TableHead>Last Activity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vacancies.map((vacancy) => {
          return (
            <TableRow 
              key={vacancy.id}
              className="cursor-pointer"
              onClick={() => router.push(`/pre-screening/view/${vacancy.id}`)}
            >
              <TableCell>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {vacancy.title}
                    </span>
                    <StatusBadge isOnline={vacancy.isOnline} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {vacancy.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {vacancy.location}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <ChannelIcons channels={vacancy.channels} />
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium text-gray-400">-</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium text-gray-400">-</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium text-gray-400">-</span>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                -
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ArchivedTable({ vacancies }: { vacancies: Vacancy[] }) {
  const router = useRouter();
  
  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Archive className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No archived vacancies.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Vacancy</TableHead>
          <TableHead className="text-center">Channels</TableHead>
          <TableHead className="text-center">Candidates</TableHead>
          <TableHead className="text-center">Completed</TableHead>
          <TableHead className="text-center">Qualified</TableHead>
          <TableHead>Archived</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vacancies.map((vacancy) => {
          return (
            <TableRow 
              key={vacancy.id}
              className="cursor-pointer"
              onClick={() => router.push(`/pre-screening/view/${vacancy.id}`)}
            >
              <TableCell>
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 truncate block">
                    {vacancy.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {vacancy.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {vacancy.location}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <ChannelIcons channels={vacancy.channels} />
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium text-gray-400">-</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium text-gray-400">-</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium text-gray-400">-</span>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {formatDate(vacancy.archivedAt)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function PreScreeningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [showAutoGenerateConfirm, setShowAutoGenerateConfirm] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

  // Handle auto-generate toggle - show confirmation when enabling
  const handleAutoGenerateToggle = (checked: boolean) => {
    if (checked) {
      // Show confirmation dialog when enabling
      setShowAutoGenerateConfirm(true);
    } else {
      // Disable immediately without confirmation
      setAutoGenerate(false);
    }
  };

  const confirmAutoGenerate = () => {
    setAutoGenerate(true);
    setShowAutoGenerateConfirm(false);
  };
  
  // Get active tab from URL, default to 'new'
  const activeTab = searchParams.get('tab') || 'new';
  
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/pre-screening?${params.toString()}`, { scroll: false });
  };

  // Fetch vacancies on mount
  useEffect(() => {
    async function fetchVacancies() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getVacancies();
        setVacancies(data.vacancies);
      } catch (err) {
        console.error('Failed to fetch vacancies:', err);
        setError('Failed to load vacancies');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVacancies();
  }, []);

  // Filter vacancies by status
  // New: vacancies without pre-screening generated
  const newVacancies = useMemo(() => 
    vacancies.filter(v => v.status === 'new'), [vacancies]);
  // Generated: vacancies with pre-screening (draft, in_progress, agent_created, screening_active)
  const generatedVacancies = useMemo(() => 
    vacancies.filter(v => v.status === 'draft' || v.status === 'in_progress' || v.status === 'agent_created' || v.status === 'screening_active'), [vacancies]);
  // Archived: archived vacancies
  const archivedVacancies = useMemo(() => 
    vacancies.filter(v => v.status === 'archived'), [vacancies]);

  // Placeholder metrics
  const weeklyMetrics = {
    total: 0,
    completionRate: 0,
    qualified: 0,
    qualificationRate: 0,
    voice: 0,
    whatsapp: 0,
    dailyData: Array(7).fill({ value: 0 }),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading vacancies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-500 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-40px)] -m-6">
      {/* Header - Fixed */}
      <div className="px-6 py-6">
        <h1 className="text-lg font-semibold text-gray-900">
          Pre-screening
        </h1>
        <p className="text-sm text-gray-500">
          Overview of your conversational pre-screening
        </p>
      </div>

      {/* Full-width divider line */}
      <div className="border-t border-gray-200" />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Weekly Pre-screening Metrics - 4 cards in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Pre-screening"
            value={weeklyMetrics.total}
            label="This week"
            icon={Phone}
            variant="blue"
            sparklineData={weeklyMetrics.dailyData}
          />
          
          <MetricCard
            title="Completion Rate"
            value={`${weeklyMetrics.completionRate}%`}
            label="This week"
            icon={CheckCircle2}
            variant="dark"
            progress={weeklyMetrics.completionRate}
          />
          
          <MetricCard
            title="Qualified"
            value={weeklyMetrics.qualified}
            label={`${weeklyMetrics.qualificationRate}% of completed`}
            icon={Users}
            variant="lime"
            sparklineData={weeklyMetrics.dailyData}
          />

          <ChannelCard
            voice={weeklyMetrics.voice}
            whatsapp={weeklyMetrics.whatsapp}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-2">
        <div className="flex items-center justify-between">
          <TabsList variant="line">
            <TabsTrigger value="new">
              <Plus className="w-3.5 h-3.5" />
              New
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {newVacancies.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="generated">
              <Zap className="w-3.5 h-3.5" />
              Generated
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {generatedVacancies.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="archived">
              <Archive className="w-3.5 h-3.5" />
              Archived
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {archivedVacancies.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <label htmlFor="auto-generate" className="text-sm text-gray-600">
              Auto generate
            </label>
            <Switch
              id="auto-generate"
              checked={autoGenerate}
              onCheckedChange={handleAutoGenerateToggle}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px]">
                When enabled, every vacancy sent to Taloo will be automatically converted to a pre-screening. Pre-screening can always be modified later.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <TabsContent value="new" className="">
          <PendingSetup 
            vacancies={newVacancies} 
            onViewSource={setSelectedVacancy} 
          />
        </TabsContent>
        
        <TabsContent value="generated" className="">
          <GeneratedTable vacancies={generatedVacancies} />
        </TabsContent>
        
        <TabsContent value="archived" className="">
          <ArchivedTable vacancies={archivedVacancies} />
        </TabsContent>
      </Tabs>
      </div>

      {/* Source Record Sheet */}
      <Sheet open={!!selectedVacancy} onOpenChange={(open) => !open && setSelectedVacancy(null)}>
        <SheetContent className="sm:max-w-[700px] flex flex-col h-full">
          {/* Fixed Header */}
          <SheetHeader className="shrink-0 border-b pb-4">
            <div className="flex items-center gap-2">
              {selectedVacancy?.source === 'salesforce' ? (
                <Image 
                  src="/salesforc-logo-cloud.png" 
                  alt="Salesforce" 
                  width={20} 
                  height={14}
                  className="opacity-80"
                />
              ) : selectedVacancy?.source === 'bullhorn' ? (
                <Image 
                  src="/bullhorn-icon-small.png" 
                  alt="Bullhorn" 
                  width={20} 
                  height={20}
                  className="opacity-80"
                />
              ) : null}
              <SheetTitle className="text-lg">Source Record</SheetTitle>
            </div>
            <SheetDescription>
              Original vacancy data from {selectedVacancy?.source === 'salesforce' ? 'Salesforce' : selectedVacancy?.source === 'bullhorn' ? 'Bullhorn' : 'source'}
            </SheetDescription>
          </SheetHeader>
          
          {/* Scrollable Content */}
          {selectedVacancy && (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {/* Vacancy Title */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedVacancy.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {selectedVacancy.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedVacancy.location}
                  </span>
                </div>
              </div>

              {/* Imported Date */}
              <div className="flex items-center gap-2 text-sm text-gray-500 pb-4 border-b">
                <Calendar className="w-4 h-4" />
                <span>Imported {formatDate(selectedVacancy.createdAt)}</span>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Job Description</h4>
                <div className="text-sm text-gray-600 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-2">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-outside ml-4 space-y-1 mb-3">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-600">{children}</li>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3">{children}</p>
                      ),
                    }}
                  >
                    {selectedVacancy.description}
                  </ReactMarkdown>
                </div>
              </div>

              {/* External Link */}
              <div className="pt-4 border-t">
                <a
                  href={selectedVacancy.source === 'salesforce' 
                    ? `https://salesforce.com/record/${selectedVacancy.sourceId || 'example'}`
                    : selectedVacancy.source === 'bullhorn'
                    ? `https://bullhorn.com/record/${selectedVacancy.sourceId || 'example'}`
                    : '#'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Open in {selectedVacancy.source === 'salesforce' ? 'Salesforce' : selectedVacancy.source === 'bullhorn' ? 'Bullhorn' : 'source'}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Auto-generate Confirmation Dialog */}
      <AlertDialog open={showAutoGenerateConfirm} onOpenChange={setShowAutoGenerateConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Enable auto-generate?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-gray-600">
                {newVacancies.length > 0 ? (
                  <p>
                    This will create pre-screening interviews for your{' '}
                    <span className="font-medium text-gray-900">{newVacancies.length} new</span> and all future vacancies.
                  </p>
                ) : (
                  <p>
                    Pre-screening interviews will be created automatically for all future vacancies.
                  </p>
                )}
                <p className="text-gray-500 text-xs">
                  You can edit or disable individual pre-screenings anytime.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAutoGenerate}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              Enable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PreScreeningPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <PreScreeningContent />
    </Suspense>
  );
}
