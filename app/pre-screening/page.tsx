'use client';

import { Phone, CheckCircle2, Users, MapPin, Building2, ArrowRight, Archive, Loader2, Info, ExternalLink, Calendar, Plus, Zap, MessageCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Vacancy } from '@/lib/types';
import { getVacancies, getDashboardStats, DashboardStats } from '@/lib/interview-api';
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
        <p className="text-sm text-gray-500">Alle vacatures zijn ingesteld.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Vacature</TableHead>
          <TableHead>Bron</TableHead>
          <TableHead>Geïmporteerd</TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vacancies.map((vacancy) => (
          <TableRow
            key={vacancy.id}
            data-testid={`pending-vacancy-row-${vacancy.id}`}
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
                  data-testid={`view-source-btn-${vacancy.id}`}
                  className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Brongegevens bekijken"
                >
                  <Image 
                    src="/salesforc-logo-cloud.png" 
                    alt="Salesforce" 
                    width={16} 
                    height={11}
                    className="opacity-70"
                  />
                  <span className="text-xs font-medium">Bekijken</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : vacancy.source === 'bullhorn' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onViewSource(vacancy); }}
                  data-testid={`view-source-btn-${vacancy.id}`}
                  className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Brongegevens bekijken"
                >
                  <Image 
                    src="/bullhorn-icon-small.png" 
                    alt="Bullhorn" 
                    width={16} 
                    height={16}
                    className="opacity-70"
                  />
                  <span className="text-xs font-medium">Bekijken</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-xs text-gray-500">Handmatig</span>
              )}
            </TableCell>
            <TableCell className="text-gray-500 text-sm">
              {formatDate(vacancy.createdAt)}
            </TableCell>
            <TableCell className="text-right">
                <Link
                  href={`/pre-screening/edit/${vacancy.id}`}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`generate-prescreening-btn-${vacancy.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Pre-screening genereren
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
      Concept
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
          title="WhatsApp-kanaal actief"
        >
          <MessageCircle className="w-3.5 h-3.5 text-green-600" />
        </div>
      )}
      {channels.voice && (
        <div 
          className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"
          title="Telefoon-kanaal actief"
        >
          <Phone className="w-3.5 h-3.5 text-blue-600" />
        </div>
      )}
      {channels.cv && (
        <div 
          className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center"
          title="Smart CV-kanaal actief"
        >
          <FileText className="w-3.5 h-3.5 text-purple-600" />
        </div>
      )}
    </div>
  );
}

function formatRelativeDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Zojuist';
  if (diffMins < 60) return `${diffMins}m geleden`;
  if (diffHours < 24) return `${diffHours}u geleden`;
  if (diffDays < 7) return `${diffDays}d geleden`;
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}

function GeneratedTable({ vacancies }: { vacancies: Vacancy[] }) {
  const router = useRouter();

  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Zap className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Nog geen pre-screenings gegenereerd.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Vacature</TableHead>
          <TableHead className="text-center">Kanalen</TableHead>
          <TableHead className="text-center">Kandidaten</TableHead>
          <TableHead className="text-center">Afgerond</TableHead>
          <TableHead className="text-center">Gekwalificeerd</TableHead>
          <TableHead>Laatste activiteit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vacancies.map((vacancy) => {
          const hasActivity = vacancy.candidatesCount > 0;
          return (
            <TableRow
              key={vacancy.id}
              data-testid={`generated-vacancy-row-${vacancy.id}`}
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
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? vacancy.candidatesCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? vacancy.completedCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? vacancy.qualifiedCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {formatRelativeDate(vacancy.lastActivityAt)}
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
        <p className="text-sm text-gray-500">Geen gearchiveerde vacatures.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Vacature</TableHead>
          <TableHead className="text-center">Kanalen</TableHead>
          <TableHead className="text-center">Kandidaten</TableHead>
          <TableHead className="text-center">Afgerond</TableHead>
          <TableHead className="text-center">Gekwalificeerd</TableHead>
          <TableHead>Gearchiveerd</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vacancies.map((vacancy) => {
          const hasActivity = vacancy.candidatesCount > 0;
          return (
            <TableRow
              key={vacancy.id}
              data-testid={`archived-vacancy-row-${vacancy.id}`}
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
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? vacancy.candidatesCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? vacancy.completedCount : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${hasActivity ? 'text-gray-900' : 'text-gray-400'}`}>
                  {hasActivity ? vacancy.qualifiedCount : '-'}
                </span>
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
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

  // Fetch vacancies and stats on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const [vacanciesData, statsData] = await Promise.all([
          getVacancies(),
          getDashboardStats(),
        ]);
        setVacancies(vacanciesData.vacancies);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Gegevens laden mislukt');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
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

  // Use stats from API or fallback to zeros
  const weeklyMetrics = {
    total: stats?.totalPrescreeningsThisWeek ?? 0,
    completionRate: stats?.completionRate ?? 0,
    qualified: stats?.qualifiedCount ?? 0,
    qualificationRate: stats?.qualificationRate ?? 0,
    voice: stats?.channelBreakdown.voice ?? 0,
    whatsapp: stats?.channelBreakdown.whatsapp ?? 0,
    dailyData: Array(7).fill({ value: 0 }), // TODO: Add daily breakdown to stats endpoint if needed
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Vacatures laden...</span>
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
          Opnieuw proberen
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
          Overzicht van je conversationele pre-screening
        </p>
      </div>

      {/* Full-width divider line */}
      <div className="border-t border-gray-200" />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Weekly Pre-screening Metrics - 4 cards in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Totaal pre-screening"
            value={weeklyMetrics.total}
            label="Deze week"
            icon={Phone}
            variant="blue"
            sparklineData={weeklyMetrics.dailyData}
          />
          
          <MetricCard
            title="Afrondingspercentage"
            value={`${weeklyMetrics.completionRate}%`}
            label="Deze week"
            icon={CheckCircle2}
            variant="dark"
            progress={weeklyMetrics.completionRate}
          />
          
          <MetricCard
            title="Gekwalificeerd"
            value={weeklyMetrics.qualified}
            label={`${weeklyMetrics.qualificationRate}% van afgerond`}
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
            <TabsTrigger value="new" data-testid="tab-new-vacancies">
              <Plus className="w-3.5 h-3.5" />
              Nieuw
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {newVacancies.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="generated" data-testid="tab-generated-vacancies">
              <Zap className="w-3.5 h-3.5" />
              Gegenereerd
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {generatedVacancies.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="archived" data-testid="tab-archived-vacancies">
              <Archive className="w-3.5 h-3.5" />
              Gearchiveerd
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {archivedVacancies.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <label htmlFor="auto-generate" className="text-sm text-gray-600">
              Automatisch genereren
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
                Indien ingeschakeld wordt elke vacature naar Taloo automatisch omgezet naar een pre-screening. Pre-screening kan altijd later worden aangepast.
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
              <SheetTitle className="text-lg">Brongegevens</SheetTitle>
            </div>
            <SheetDescription>
              Originele vacaturegegevens van {selectedVacancy?.source === 'salesforce' ? 'Salesforce' : selectedVacancy?.source === 'bullhorn' ? 'Bullhorn' : 'bron'}
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
                <span>Geïmporteerd {formatDate(selectedVacancy.createdAt)}</span>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Functieomschrijving</h4>
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
                  Openen in {selectedVacancy.source === 'salesforce' ? 'Salesforce' : selectedVacancy.source === 'bullhorn' ? 'Bullhorn' : 'bron'}
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
            <AlertDialogTitle>Automatisch genereren inschakelen?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-gray-600">
                {newVacancies.length > 0 ? (
                  <p>
                    Dit maakt pre-screening interviews aan voor je{' '}
                    <span className="font-medium text-gray-900">{newVacancies.length} nieuwe</span> en alle toekomstige vacatures.
                  </p>
                ) : (
                  <p>
                    Pre-screening interviews worden automatisch aangemaakt voor alle toekomstige vacatures.
                  </p>
                )}
                <p className="text-gray-500 text-xs">
                  Je kunt individuele pre-screenings altijd bewerken of uitschakelen.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAutoGenerate}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              Inschakelen
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
