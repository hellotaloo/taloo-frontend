'use client';

import { Loader2, Settings, Play, Briefcase, Archive, ArrowUp, ArrowDown, ChevronsUpDown, Eye } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { AgentVacancy, AgentDashboardStats } from '@/lib/types';
import { getPreScreeningVacancies, getPreScreeningStats, getApplications } from '@/lib/interview-api';
import { getStatIcon } from '@/lib/agent-utils';
import { getActivityTasks, type TaskRow } from '@/lib/api';
import { MetricCard, ChannelCard } from '@/components/kit/metric-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PublishedVacanciesTable, ArchivedVacanciesTable } from '@/components/blocks/vacancy-table';
import { ApplicationDetailPane, type Application as ComponentApplication } from '@/components/blocks/application-dashboard';
import { convertToComponentApplication } from '@/lib/pre-screening-utils';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ActivityStatusBadge, SLABadge, useTranslateStepLabel } from '@/components/kit/activity-helpers';
import { cn, formatRelativeDate } from '@/lib/utils';
import { useTranslations, useLocale, useTranslateBackendLabel } from '@/lib/i18n';

type SortKey = 'candidate_name' | 'vacancy_title' | 'current_step_label' | 'status' | 'sla' | 'time_ago';
type SortDirection = 'asc' | 'desc' | null;

function PreScreeningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('preScreening');
  const tViews = useTranslations('views');
  const { locale, t: tRoot } = useLocale();
  const translateStepLabel = useTranslateStepLabel();
  const translateBackendLabel = useTranslateBackendLabel();

  // Activity tasks state
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Application detail pane state
  const [applicationDetail, setApplicationDetail] = useState<ComponentApplication | null>(null);
  const [applicationDetailLoading, setApplicationDetailLoading] = useState(false);
  const [applicationDetailOpen, setApplicationDetailOpen] = useState(false);

  // Vacancies state
  const [vacancies, setVacancies] = useState<AgentVacancy[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);

  // Archived vacancies state
  const [archivedVacancies, setArchivedVacancies] = useState<AgentVacancy[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(true);

  // Metrics
  const [stats, setStats] = useState<AgentDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting for activities table
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch activity tasks
  const fetchTasks = useCallback(async () => {
    try {
      const response = await getActivityTasks({ status: 'active', limit: 100 });
      setTasks(response.tasks);
    } catch (error) {
      console.error('Failed to fetch activity tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Fetch vacancies (single call, all statuses returned with agent_status field)
  const fetchVacancies = useCallback(async () => {
    try {
      const data = await getPreScreeningVacancies();
      setVacancies(data.vacancies);
    } catch (error) {
      console.error('Failed to load vacancies:', error);
    } finally {
      setVacanciesLoading(false);
    }
  }, []);

  // Fetch archived vacancies
  const fetchArchivedVacancies = useCallback(async () => {
    try {
      const data = await getPreScreeningVacancies({ archived: true });
      setArchivedVacancies(data.vacancies);
    } catch (error) {
      console.error('Failed to load archived vacancies:', error);
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const statsData = await getPreScreeningStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Gegevens laden mislukt');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchVacancies();
    fetchArchivedVacancies();
    fetchStats();
  }, [fetchTasks, fetchVacancies, fetchArchivedVacancies, fetchStats]);

  // Realtime updates
  const refreshAll = useCallback(() => {
    fetchTasks();
    fetchStats();
    fetchVacancies();
    fetchArchivedVacancies();
  }, [fetchTasks, fetchStats, fetchVacancies, fetchArchivedVacancies]);

  useRealtimeTable({
    schema: 'agents',
    table: 'workflows',
    onUpdate: refreshAll,
  });

  useRealtimeTable({
    schema: 'ats',
    table: 'vacancies',
    onUpdate: refreshAll,
  });

  useRealtimeTable({
    schema: 'agents',
    table: 'pre_screenings',
    onUpdate: refreshAll,
  });

  useRealtimeTable({
    schema: 'agents',
    table: 'pre_screening_sessions',
    onUpdate: refreshAll,
  });

  // Filter tasks for pre_screening only
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.workflow_type === 'pre_screening');
  }, [tasks]);

  // Open application detail from task row
  const handleOpenApplicationDetail = async (task: TaskRow) => {
    if (!task.vacancy_id || !task.application_id) return;
    setApplicationDetailOpen(true);
    setApplicationDetailLoading(true);
    try {
      const data = await getApplications(task.vacancy_id);
      const app = data.applications.find(a => a.id === task.application_id);
      setApplicationDetail(app ? convertToComponentApplication(app) : null);
    } catch {
      setApplicationDetail(null);
    } finally {
      setApplicationDetailLoading(false);
    }
  };

  const handleCloseApplicationDetail = () => {
    setApplicationDetailOpen(false);
    setApplicationDetail(null);
  };

  // Tab handling
  const activeTab = searchParams.get('tab') || 'activities';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/pre-screening?${params.toString()}`, { scroll: false });
  };

  // Sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortKey(null); setSortDirection(null); }
      else setSortDirection('asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!sortKey || !sortDirection) {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    if (sortKey === 'sla') {
      const aSeconds = a.time_remaining_seconds ?? Infinity;
      const bSeconds = b.time_remaining_seconds ?? Infinity;
      return sortDirection === 'asc' ? aSeconds - bSeconds : bSeconds - aSeconds;
    }
    let aValue = '';
    let bValue = '';
    switch (sortKey) {
      case 'candidate_name': aValue = a.candidate_name || ''; bValue = b.candidate_name || ''; break;
      case 'vacancy_title': aValue = a.vacancy_title || ''; bValue = b.vacancy_title || ''; break;
      case 'current_step_label': aValue = a.current_step_label; bValue = b.current_step_label; break;
      case 'status': aValue = a.is_stuck ? 'stuck' : a.status; bValue = b.is_stuck ? 'stuck' : b.status; break;
      case 'time_ago': aValue = a.time_ago; bValue = b.time_ago; break;
    }
    return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  // Sortable header component
  const SortableHeader = ({ column, label, className }: { column: SortKey; label: string; className?: string }) => {
    const isSorted = sortKey === column;
    return (
      <TableHead
        className={cn(
          'font-medium cursor-pointer select-none hover:bg-gray-50 transition-colors',
          isSorted && 'bg-gray-50',
          className
        )}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-2">
          <span>{label}</span>
          <span className="inline-flex items-center">
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="w-4 h-4 text-gray-700" />
              ) : (
                <ArrowDown className="w-4 h-4 text-gray-700" />
              )
            ) : (
              <ChevronsUpDown className="w-4 h-4 text-gray-400" />
            )}
          </span>
        </div>
      </TableHead>
    );
  };

  // Metrics from backend stats endpoint
  const metrics = stats?.metrics ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">{t('loadingScreenings')}</span>
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
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <>
      <PageLayout>
        <PageLayoutHeader
          action={
            <div className="flex items-center gap-2">
              <Link href="/pre-screening/demo">
                <Button variant="outline" size="sm" className="gap-2">
                  <Play className="w-4 h-4" />
                  Playground
                </Button>
              </Link>
              <Link href="/pre-screening/settings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  {t('settings')}
                </Button>
              </Link>
            </div>
          }
        />
        <PageLayoutContent>
          {/* Pre-screening Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((metric) => {
              // Special handling for channels card
              if (metric.key === 'channels' && metric.description) {
                const parts = metric.description.split(', ');
                const voice = parseInt(parts.find(p => p.startsWith('voice:'))?.split(': ')[1] ?? '0');
                const whatsapp = parseInt(parts.find(p => p.startsWith('whatsapp:'))?.split(': ')[1] ?? '0');
                return <ChannelCard key={metric.key} voice={voice} whatsapp={whatsapp} />;
              }

              const Icon = getStatIcon(metric.icon);
              const value = metric.suffix ? `${metric.value}${metric.suffix}` : metric.value;
              const variant = (metric.variant as 'blue' | 'lime' | 'dark' | 'pink') ?? 'blue';

              return (
                <MetricCard
                  key={metric.key}
                  title={tRoot(metric.label)}
                  value={value}
                  label={metric.description ? tRoot(metric.description) : undefined}
                  icon={Icon}
                  variant={variant}
                  progress={metric.suffix === '%' ? metric.value : undefined}
                />
              );
            })}
          </div>

          {/* Tabs: Activiteiten / Vacatures */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-2">
            <div className="flex items-center justify-between">
              <TabsList variant="line">
                <TabsTrigger value="activities">
                  <Play className="w-3.5 h-3.5" />
                  {t('activities')}
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                    {filteredTasks.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="vacancies">
                  <Briefcase className="w-3.5 h-3.5" />
                  {t('vacancies')}
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                    {vacancies.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="archived">
                  <Archive className="w-3.5 h-3.5" />
                  {t('archive')}
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                    {archivedVacancies.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Activities Tab */}
            <TabsContent value="activities">
              {tasksLoading && filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 pt-2">
                  <Loader2 className="w-8 h-8 mb-4 animate-spin" />
                  <p className="text-sm">{t('loadingTasks')}</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 pt-2">
                  <div className="relative mb-6">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                    </div>
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-gray-300 animate-ping [animation-duration:2s]" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border border-gray-200 animate-ping [animation-duration:2s] [animation-delay:500ms]" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {t('noActiveScreenings')}
                  </p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto pt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader column="candidate_name" label={t('candidate')} />
                        <SortableHeader column="vacancy_title" label={t('vacancy')} />
                        <SortableHeader column="current_step_label" label={t('step')} />
                        <SortableHeader column="status" label={t('status')} />
                        <SortableHeader column="sla" label={t('sla')} />
                        <SortableHeader column="time_ago" label={t('lastUpdate')} />
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTasks.map((task, index) => (
                        <TableRow
                          key={task.id}
                          className="group hover:bg-gray-50/50 cursor-pointer"
                          style={{ animation: `fade-in-up 0.3s ease-out ${index * 30}ms backwards` }}
                          onClick={() => handleOpenApplicationDetail(task)}
                        >
                          <TableCell className="font-medium">
                            {task.candidate_name || <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell>
                            {task.vacancy_title || <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <span className="text-gray-900 inline-flex items-center gap-1.5">
                                {task.current_step_label.includes('Generating') && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                )}
                                {translateStepLabel(task.current_step_label)}
                              </span>
                              {task.step_detail && (
                                <span className="block text-xs text-gray-500 mt-0.5">{translateBackendLabel(task.step_detail)}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <ActivityStatusBadge status={task.status} isStuck={task.is_stuck} />
                          </TableCell>
                          <TableCell>
                            <SLABadge
                              status={task.status}
                              isStuck={task.is_stuck}
                              timeRemainingSeconds={task.time_remaining_seconds}
                            />
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {formatRelativeDate(task.updated_at, locale)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => { e.stopPropagation(); handleOpenApplicationDetail(task); }}
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <p className="text-sm text-gray-500 mt-2">
                    {filteredTasks.length === 1
                      ? t('activeCountSingle', { count: filteredTasks.length })
                      : t('activeCount', { count: filteredTasks.length })}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Vacancies Tab */}
            <TabsContent value="vacancies">
              {vacanciesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">{t('loadingVacancies')}</span>
                </div>
              ) : (
                <PublishedVacanciesTable
                  vacancies={vacancies}
                />
              )}
            </TabsContent>

            {/* Archive Tab */}
            <TabsContent value="archived">
              {archivedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">{t('loadingArchive')}</span>
                </div>
              ) : (
                <ArchivedVacanciesTable
                  vacancies={archivedVacancies}
                />
              )}
            </TabsContent>
          </Tabs>

        </PageLayoutContent>
      </PageLayout>

      {/* Application Detail Sheet */}
      <Sheet open={applicationDetailOpen} onOpenChange={(open) => { if (!open) handleCloseApplicationDetail(); }}>
        <SheetContent side="right" className="w-full sm:max-w-[720px] p-0" showCloseButton={false}>
          {applicationDetailLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <ApplicationDetailPane
              application={applicationDetail}
              onClose={handleCloseApplicationDetail}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function PreScreeningPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <PreScreeningContent />
    </Suspense>
  );
}
