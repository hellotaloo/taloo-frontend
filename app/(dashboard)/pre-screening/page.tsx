'use client';

import { Phone, CheckCircle2, Users, MapPin, Building2, ArrowRight, Archive, Loader2, Info, ExternalLink, Calendar, FileEdit, Send, MessageCircle, FileText, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Vacancy } from '@/lib/types';
import { getPreScreeningVacancies, getDashboardStats, DashboardStats } from '@/lib/interview-api';
import { MetricCard, ChannelCard } from '@/components/kit/metric-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ConceptVacanciesTable,
  PublishedVacanciesTable,
  ArchivedVacanciesTable,
} from '@/components/blocks/vacancy-table';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
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

function PreScreeningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conceptVacancies, setConceptVacancies] = useState<Vacancy[]>([]);
  const [publishedVacancies, setPublishedVacancies] = useState<Vacancy[]>([]);
  const [archivedVacancies, setArchivedVacancies] = useState<Vacancy[]>([]);
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

  // Get active tab from URL, default to 'concept'
  const activeTab = searchParams.get('tab') || 'concept';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/pre-screening?${params.toString()}`, { scroll: false });
  };

  // Fetch vacancies from agent endpoints and stats on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch vacancies by status:
        // - new: no pre-screening yet
        // - generated: has pre-screening but not published (draft)
        // - published: published_at IS NOT NULL
        // - archived: closed/filled
        const [newData, generatedData, publishedData, archivedData, statsData] = await Promise.all([
          getPreScreeningVacancies('new'),
          getPreScreeningVacancies('generated'),
          getPreScreeningVacancies('published'),
          getPreScreeningVacancies('archived'),
          getDashboardStats(),
        ]);

        // Concept tab = new + generated (all unpublished)
        // Published tab = published
        setConceptVacancies([...newData.vacancies, ...generatedData.vacancies]);
        setPublishedVacancies(publishedData.vacancies);
        setArchivedVacancies(archivedData.vacancies);
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
    <PageLayout>
      <PageLayoutHeader
        title="Pre-screening"
        description="Overzicht van je conversationele pre-screening"
        action={
          <Link href="/pre-screening/settings">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Instellingen
            </Button>
          </Link>
        }
      />
      <PageLayoutContent>
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
            <TabsTrigger value="concept" data-testid="tab-concept-vacancies">
              <FileEdit className="w-3.5 h-3.5" />
              Concept
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {conceptVacancies.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="published" data-testid="tab-published-vacancies">
              <Send className="w-3.5 h-3.5" />
              Gepubliceerd
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {publishedVacancies.length}
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
        
        <TabsContent value="concept" className="">
          <ConceptVacanciesTable vacancies={conceptVacancies} />
        </TabsContent>

        <TabsContent value="published" className="">
          <PublishedVacanciesTable vacancies={publishedVacancies} />
        </TabsContent>

        <TabsContent value="archived" className="">
          <ArchivedVacanciesTable vacancies={archivedVacancies} />
        </TabsContent>
      </Tabs>

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
                {conceptVacancies.length > 0 ? (
                  <p>
                    Dit maakt pre-screening interviews aan voor je{' '}
                    <span className="font-medium text-gray-900">{conceptVacancies.length} concept</span> en alle toekomstige vacatures.
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
      </PageLayoutContent>
    </PageLayout>
  );
}

export default function PreScreeningPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <PreScreeningContent />
    </Suspense>
  );
}
