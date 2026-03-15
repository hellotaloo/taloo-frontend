'use client';

import { Loader2, Settings, Play, Briefcase, ArrowUp, ArrowDown, ChevronsUpDown, Eye } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { DocumentCollectionFullDetailResponse, AgentVacancy, AgentDashboardStats } from '@/lib/types';
import { getDocumentCollection } from '@/lib/document-collection-api';
import { getPreOnboardingVacancies, getPreOnboardingStats } from '@/lib/interview-api';
import { getActivityTasks, type TaskRow } from '@/lib/api';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { cn, formatRelativeDate } from '@/lib/utils';
import { MetricCard } from '@/components/kit/metric-card';
import { getStatIcon } from '@/lib/agent-utils';
import { CollectionDetailPane } from '@/components/blocks/collection-table';
import { CollectionVacancyTable } from '@/components/blocks/collection-vacancy-table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ActivityStatusBadge, SLABadge, translateStepLabel } from '@/components/kit/activity-helpers';
import { Timeline } from '@/components/kit/timeline/timeline';
import { TimelineNode } from '@/components/kit/timeline/timeline-node';
import { Check, Circle, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type SortKey = 'candidate_name' | 'vacancy_title' | 'current_step_label' | 'status' | 'sla' | 'time_ago';
type SortDirection = 'asc' | 'desc' | null;

export default function DocumentCollectionPage() {
  // Activity tasks state
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);

  // Collection detail pane state (for opening from task row)
  const [collectionDetail, setCollectionDetail] = useState<DocumentCollectionFullDetailResponse | null>(null);
  const [collectionDetailLoading, setCollectionDetailLoading] = useState(false);
  const [collectionDetailOpen, setCollectionDetailOpen] = useState(false);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Dashboard stats from backend
  const [stats, setStats] = useState<AgentDashboardStats | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Vacancies
  const [vacancies, setVacancies] = useState<AgentVacancy[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);

  // Fetch activity tasks (active status, then filter for document_collection on frontend)
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

  // Fetch dashboard stats from backend
  const fetchStats = useCallback(async () => {
    try {
      const data = await getPreOnboardingStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchVacancies = useCallback(async () => {
    try {
      const data = await getPreOnboardingVacancies();
      setVacancies(data.vacancies);
    } catch (error) {
      console.error('Failed to load vacancies:', error);
    } finally {
      setVacanciesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchVacancies();
  }, [fetchTasks, fetchStats, fetchVacancies]);

  // Realtime updates
  useRealtimeTable({
    schema: 'agents',
    table: 'workflows',
    onUpdate: () => { fetchTasks(); },
  });

  useRealtimeTable({
    schema: 'agents',
    table: 'document_collections',
    event: '*',
    onUpdate: () => { fetchVacancies(); fetchStats(); },
  });

  useRealtimeTable({
    schema: 'ats',
    table: 'vacancy_agents',
    event: '*',
    onUpdate: () => { fetchVacancies(); },
  });

  // Filter tasks: only document_collection, active or stuck
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.workflow_type === 'document_collection');
  }, [tasks]);

  // Metrics from backend
  const metrics = stats?.metrics ?? [];

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

  // Open collection detail from task
  const handleOpenCollectionDetail = async (task: TaskRow) => {
    if (!task.collection_id) return;
    setSelectedTask(null);
    setCollectionDetailOpen(true);
    setCollectionDetailLoading(true);
    try {
      const detail = await getDocumentCollection(task.collection_id);
      setCollectionDetail(detail);
    } catch {
      setCollectionDetail(null);
    } finally {
      setCollectionDetailLoading(false);
    }
  };

  const handleCloseCollectionDetail = () => {
    setCollectionDetailOpen(false);
    setCollectionDetail(null);
  };

  // Sortable header
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

  const isLoading = tasksLoading && metricsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Documentcollecties laden...</span>
      </div>
    );
  }

  return (
    <>
      <PageLayout>
        <PageLayoutHeader
          action={
            <div className="flex items-center gap-2">
              <Link href="/document-collection/playground">
                <Button variant="outline" size="sm" className="gap-2">
                  <Play className="w-4 h-4" />
                  Playground
                </Button>
              </Link>
              <Link href="/document-collection/settings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Instellingen
                </Button>
              </Link>
            </div>
          }
        />
        <PageLayoutContent>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((metric) => {
              const Icon = getStatIcon(metric.icon);
              const value = metric.suffix ? `${metric.value}${metric.suffix}` : metric.value;
              const variant = (metric.variant as 'blue' | 'lime' | 'dark' | 'pink') ?? 'blue';

              return (
                <MetricCard
                  key={metric.key}
                  title={metric.label}
                  value={value}
                  label={metric.description ?? undefined}
                  icon={Icon}
                  variant={variant}
                  progress={metric.suffix === '%' ? metric.value : undefined}
                />
              );
            })}
          </div>

          {/* Tabs: Activiteiten / Vacatures */}
          <Tabs defaultValue="activities" className="space-y-2">
            <TabsList variant="line">
              <TabsTrigger value="activities">
                <Play className="w-3.5 h-3.5" />
                Activiteiten
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                  {filteredTasks.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="vacancies">
                <Briefcase className="w-3.5 h-3.5" />
                Vacatures
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                  {vacancies.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activities">
              {tasksLoading && filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 pt-2">
                  <Loader2 className="w-8 h-8 mb-4 animate-spin" />
                  <p className="text-sm">Taken laden...</p>
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
                    Geen actieve documentcollecties
                  </p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto pt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader column="candidate_name" label="Kandidaat" />
                        <SortableHeader column="vacancy_title" label="Vacature" />
                        <SortableHeader column="current_step_label" label="Stap" />
                        <SortableHeader column="status" label="Status" />
                        <SortableHeader column="sla" label="SLA" />
                        <SortableHeader column="time_ago" label="Laatste Update" />
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTasks.map((task, index) => (
                        <TableRow
                          key={task.id}
                          className="group hover:bg-gray-50/50 cursor-pointer"
                          style={{ animation: `fade-in-up 0.3s ease-out ${index * 30}ms backwards` }}
                          onClick={() => setSelectedTask(task)}
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
                                <span className="block text-xs text-gray-500 mt-0.5">{task.step_detail}</span>
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
                            {formatRelativeDate(task.updated_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <p className="text-sm text-gray-500 mt-2">
                    {filteredTasks.length} {filteredTasks.length === 1 ? 'collectie' : 'collecties'} actief
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="vacancies">
              {vacanciesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Vacatures laden...</span>
                </div>
              ) : (
                <CollectionVacancyTable
                  vacancies={vacancies}
                />
              )}
            </TabsContent>
          </Tabs>
        </PageLayoutContent>
      </PageLayout>

      {/* Workflow Detail Sheet */}
      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>Workflow Details</SheetTitle>
            <SheetDescription>
              {selectedTask?.candidate_name || 'Onbekend'} — {selectedTask?.vacancy_title || 'Geen vacature'}
            </SheetDescription>
          </SheetHeader>

          {selectedTask && (
            <div className="py-6 px-4">
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2">
                  <ActivityStatusBadge status={selectedTask.status} isStuck={selectedTask.is_stuck} />
                </div>
                {selectedTask.step_detail && (
                  <p className="text-sm text-gray-600">{selectedTask.step_detail}</p>
                )}
                <p className="text-xs text-gray-400">Laatste update: {formatRelativeDate(selectedTask.updated_at)}</p>
              </div>

              {/* Open collection detail */}
              {selectedTask.collection_id && (
                <button
                  onClick={() => handleOpenCollectionDetail(selectedTask)}
                  className="w-full mb-6 flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">Documentcollectie</p>
                    <p className="text-xs text-gray-500">Bekijk details</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </button>
              )}

              {/* Workflow steps timeline */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Workflow Voortgang</h4>
                <Timeline>
                  {selectedTask.workflow_steps?.map((step, index) => {
                    const dotColor = step.status === 'completed' ? 'green'
                      : step.status === 'failed' ? 'orange'
                      : 'default';

                    return (
                      <TimelineNode
                        key={step.id}
                        animationDelay={index * 100}
                        isLast={index === selectedTask.workflow_steps.length - 1}
                        dotColor={dotColor}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex items-center justify-center w-6 h-6 rounded-full',
                            step.status === 'completed' && 'bg-green-500 text-white',
                            step.status === 'current' && 'bg-blue-500 text-white',
                            step.status === 'pending' && 'bg-gray-50 text-gray-500',
                            step.status === 'failed' && 'bg-red-500 text-white',
                          )}>
                            {step.status === 'completed' ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : step.status === 'failed' ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <Circle className="w-3 h-3" />
                            )}
                          </div>
                          <div>
                            <span className={cn(
                              'text-sm font-medium',
                              step.status === 'completed' && 'text-green-600',
                              step.status === 'current' && 'text-blue-600',
                              step.status === 'pending' && 'text-gray-500',
                              step.status === 'failed' && 'text-red-600',
                            )}>
                              {translateStepLabel(step.label)}
                            </span>
                            {step.status === 'current' && (
                              <span className="ml-2 text-xs text-blue-600 animate-pulse">Actief</span>
                            )}
                          </div>
                        </div>
                      </TimelineNode>
                    );
                  })}
                </Timeline>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Collection Detail Sheet */}
      <Sheet open={collectionDetailOpen} onOpenChange={(open) => { if (!open) handleCloseCollectionDetail(); }}>
        <SheetContent side="right" className="w-full sm:max-w-[720px] p-0" showCloseButton={false}>
          {collectionDetailLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <CollectionDetailPane
              collection={collectionDetail}
              isLoading={collectionDetailLoading}
              onClose={handleCloseCollectionDetail}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
