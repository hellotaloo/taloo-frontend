'use client';

import { Phone, CheckCircle2, Users, MapPin, Building2, ArrowRight, Archive, List, Loader, Loader2, Info, ExternalLink, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useMemo } from 'react';
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

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PendingPreScreeningSetup({ 
  vacancies, 
  onViewSource 
}: { 
  vacancies: Vacancy[];
  onViewSource: (vacancy: Vacancy) => void;
}) {
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
          <TableRow key={vacancy.id}>
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
                  onClick={() => onViewSource(vacancy)}
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
                  onClick={() => onViewSource(vacancy)}
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
                  href={`/pre-screenings/generate/${vacancy.id}`}
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

function VacanciesTable({ vacancies, showArchiveDate = false }: { vacancies: Vacancy[]; showArchiveDate?: boolean }) {
  if (vacancies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Archive className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No vacancies found.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-full">Vacancy</TableHead>
          <TableHead className="text-center">Pre-screenings</TableHead>
          <TableHead className="text-center">Completed</TableHead>
          <TableHead className="text-center">Qualified</TableHead>
          <TableHead>{showArchiveDate ? 'Archived' : 'Last Pre-screening'}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vacancies.map((vacancy) => {
          // Stats would come from per-vacancy API calls - showing placeholders for now
          return (
            <TableRow key={vacancy.id}>
              <TableCell>
                <div className="min-w-0">
                  <Link 
                    href={`/interviews/generate/${vacancy.id}`}
                    className="font-medium text-gray-900 hover:text-gray-700 truncate block"
                  >
                    {vacancy.title}
                  </Link>
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
                {showArchiveDate 
                  ? formatDate(vacancy.archivedAt)
                  : '-'
                }
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function PreScreeningsPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

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
  const pendingVacancies = useMemo(() => 
    vacancies.filter(v => v.status === 'new'), [vacancies]);
  const runningVacancies = useMemo(() => 
    vacancies.filter(v => v.status === 'in_progress' || v.status === 'agent_created'), [vacancies]);
  const archivedVacancies = useMemo(() => 
    vacancies.filter(v => v.status === 'archived'), [vacancies]);

  // Placeholder metrics (would need aggregated endpoint for real data)
  const weeklyMetrics = {
    total: 0,
    completed: 0,
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
    <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Pre-screenings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your conversational pre-screenings
          </p>
        </div>

        {/* Weekly Pre-screening Metrics - 4 cards in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Pre-screenings"
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
      </div>
      {/* Tabs */}
      <Tabs defaultValue="recent" className="space-y-2">
        <div className="flex items-center justify-between">
          <TabsList variant="line">
            <TabsTrigger value="recent">
              <List className="w-3.5 h-3.5" />
              Recently Added
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {pendingVacancies.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="running">
              <Loader className="w-3.5 h-3.5" />
              Running Pre-screenings
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {runningVacancies.length}
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
              onCheckedChange={setAutoGenerate}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px]">
                When enabled, every vacancy sent to Taloo will be automatically converted to a pre-screening. Pre-screenings can always be modified later.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <TabsContent value="recent" className="">
          <PendingPreScreeningSetup 
            vacancies={pendingVacancies} 
            onViewSource={setSelectedVacancy} 
          />
        </TabsContent>
        
        <TabsContent value="running" className="">
          <VacanciesTable vacancies={runningVacancies} />
        </TabsContent>
        
        <TabsContent value="archived" className="">
          <VacanciesTable vacancies={archivedVacancies} showArchiveDate />
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
    </div>
  );
}
