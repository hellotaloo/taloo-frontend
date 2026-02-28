'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Inbox, Play, CheckCircle2, List, ArrowUp, ArrowDown, ChevronsUpDown, Eye, Check, Circle, AlertTriangle, PauseCircle, Clock, Trash2 } from 'lucide-react';
import { cn, formatRelativeDate } from '@/lib/utils';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Timeline } from '@/components/kit/timeline/timeline';
import { TimelineNode } from '@/components/kit/timeline/timeline-node';
import { getActivityTasks, completeTask, deleteTask, type TaskRow, type GetActivityTasksParams } from '@/lib/api';
import { TagBadge, type TagBadgeVariant } from '@/components/kit/tag-badge';
import { useAuth } from '@/contexts';

// Activity status badge using TagBadge
function ActivityStatusBadge({ status, isStuck, currentStep }: { status: string; isStuck: boolean; currentStep: string }) {
  if (isStuck || status === 'stuck') {
    return <TagBadge label="Vast" variant="orange" />;
  }
  if (status === 'completed') {
    // Manually completed tasks show a different label with outline style
    if (currentStep === 'marked_as_complete') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-gray-600 border border-gray-200">
          Gemarkeerd als afgerond
        </span>
      );
    }
    return <TagBadge label="Afgerond" variant="gray" />;
  }
  return <TagBadge label="Actief" variant="green" />;
}

// Workflow type badge component using TagBadge
function WorkflowTypeBadge({ type, label }: { type: string; label: string }) {
  const variantMap: Record<string, TagBadgeVariant> = {
    pre_screening: 'blue',
    document_collection: 'purple',
    scheduling: 'orange',
  };

  return <TagBadge label={label} variant={variantMap[type] || 'gray'} />;
}

// Translate English step labels from API to Dutch
const stepLabelNl: Record<string, string> = {
  'Waiting': 'Wachtend',
  'In Progress': 'Bezig',
  'Completed': 'Afgerond',
  'Failed': 'Mislukt',
  'Pending': 'In afwachting',
  'Scheduled': 'Ingepland',
  'Sent': 'Verstuurd',
  'Cancelled': 'Geannuleerd',
};

function translateStepLabel(label: string): string {
  return stepLabelNl[label] || label;
}

type FilterStatus = 'active' | 'stuck' | 'completed' | 'all';
type SortKey = 'workflow_type' | 'candidate_name' | 'vacancy_title' | 'current_step_label' | 'status' | 'sla' | 'time_ago';
type SortDirection = 'asc' | 'desc' | null;

// Format seconds into readable countdown (with seconds for live ticking)
function formatCountdown(seconds: number): string {
  const absSeconds = Math.abs(seconds);

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  if (hours > 0) {
    return `${hours}u ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Format duration for completed workflows (more concise, no seconds)
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}u ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}u`;
  } else if (minutes > 0) {
    return `${minutes} min`;
  } else {
    return `< 1 min`;
  }
}

// SLA display component
interface SLABadgeProps {
  status: string;
  isStuck: boolean;
  timeRemainingSeconds: number | null;
  durationSeconds: number | null;
}

function SLABadge({ status, isStuck, timeRemainingSeconds: initialSeconds, durationSeconds }: SLABadgeProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  // Reset when prop changes (e.g., after refetch)
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  // Countdown every second (only for active non-stuck tasks)
  useEffect(() => {
    if (seconds === null || status === 'completed' || isStuck) return;

    const interval = setInterval(() => {
      setSeconds(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds !== null, status, isStuck]);

  // Completed: show duration
  if (status === 'completed') {
    if (durationSeconds === null) {
      return <span className="text-gray-400">-</span>;
    }
    return (
      <span className="text-sm text-gray-600">
        {formatDuration(durationSeconds)}
      </span>
    );
  }

  // Stuck: show overdue time
  if (isStuck && seconds !== null) {
    const absSeconds = Math.abs(seconds);
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-red-600">
        <Clock className="w-3.5 h-3.5" />
        {formatDuration(absSeconds)} te laat
      </span>
    );
  }

  // Active: show countdown
  if (seconds === null) {
    return <span className="text-gray-400">-</span>;
  }

  const isOverdue = seconds < 0;
  const isUrgent = seconds >= 0 && seconds < 30 * 60; // 30 minutes

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-sm font-medium tabular-nums',
      isOverdue && 'text-red-600',
      isUrgent && !isOverdue && 'text-orange-600',
      !isOverdue && !isUrgent && 'text-green-600'
    )}>
      <Clock className="w-3.5 h-3.5" />
      {formatCountdown(seconds)}
    </span>
  );
}

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [stuckCount, setStuckCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('active');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  // Complete task dialog state
  const [completeDialogTask, setCompleteDialogTask] = useState<TaskRow | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  // Delete task dialog state
  const [deleteDialogTask, setDeleteDialogTask] = useState<TaskRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch counts separately (always from active tasks)
  const fetchCounts = useCallback(async () => {
    try {
      const [activeResponse, completedResponse] = await Promise.all([
        getActivityTasks({ status: 'active', limit: 1 }),
        getActivityTasks({ status: 'completed', limit: 1 }),
      ]);
      setActiveCount(activeResponse.total);
      setStuckCount(activeResponse.stuck_count);
      setCompletedCount(completedResponse.total);
    } catch {
      // Silently fail - counts are not critical
    }
  }, []);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    setError(null);
    try {
      // For 'stuck' tab, use status=active with stuck_only=true
      const params: GetActivityTasksParams = {
        status: activeFilter === 'stuck' ? 'active' : activeFilter,
        stuck_only: activeFilter === 'stuck',
        limit: 100,
      };
      const response = await getActivityTasks(params);
      setTasks(response.tasks);
      setTotal(response.total);
      // Update counts from tab responses
      if (activeFilter === 'active') {
        setActiveCount(response.total);
        setStuckCount(response.stuck_count);
      } else if (activeFilter === 'stuck') {
        setStuckCount(response.stuck_count);
      } else if (activeFilter === 'completed') {
        setCompletedCount(response.total);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Kon taken niet laden');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  // Handle complete task (from dialog)
  const handleCompleteTask = async () => {
    if (!completeDialogTask || !user?.full_name) return;

    setIsCompleting(true);
    try {
      await completeTask(completeDialogTask.id, {
        completed_by: user.full_name,
        notes: completionNotes || undefined,
      });
      setCompleteDialogTask(null);
      setCompletionNotes('');
      fetchTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  // Handle delete task (from dialog)
  const handleDeleteTask = async () => {
    if (!deleteDialogTask) return;

    setIsDeleting(true);
    try {
      await deleteTask(deleteDialogTask.id);
      setDeleteDialogTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  // Fetch all tab counts on mount and when filter changes
  useEffect(() => {
    fetchCounts();
  }, [activeFilter, fetchCounts]);

  // Polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
      fetchCounts();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchTasks, fetchCounts, activeFilter]);

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setActiveFilter(value as FilterStatus);
    setIsLoading(true);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    fetchTasks();
  };

  // Handle sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Toggle direction or clear sort
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Sort tasks
  const sortedTasks = [...tasks].reverse().sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    let aValue: string | boolean = '';
    let bValue: string | boolean = '';

    switch (sortKey) {
      case 'workflow_type':
        aValue = a.workflow_type_label;
        bValue = b.workflow_type_label;
        break;
      case 'candidate_name':
        aValue = a.candidate_name || '';
        bValue = b.candidate_name || '';
        break;
      case 'vacancy_title':
        aValue = a.vacancy_title || '';
        bValue = b.vacancy_title || '';
        break;
      case 'current_step_label':
        aValue = a.current_step_label;
        bValue = b.current_step_label;
        break;
      case 'status':
        aValue = a.is_stuck ? 'stuck' : a.status;
        bValue = b.is_stuck ? 'stuck' : b.status;
        break;
      case 'sla':
        // Sort by seconds remaining (numeric)
        const aSeconds = a.time_remaining_seconds ?? Infinity;
        const bSeconds = b.time_remaining_seconds ?? Infinity;
        return sortDirection === 'asc'
          ? aSeconds - bSeconds
          : bSeconds - aSeconds;
      case 'time_ago':
        aValue = a.time_ago;
        bValue = b.time_ago;
        break;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
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

  return (
    <PageLayout>
      <PageLayoutHeader
        title="Activiteiten"
        description="Overzicht van alle actieve agent taken"
      />
      <PageLayoutContent>
        <Tabs value={activeFilter} onValueChange={handleFilterChange} className="space-y-2">
          {/* Filters */}
          <TabsList variant="line">
            <TabsTrigger value="active" data-testid="filter-active">
              <Play className="w-3.5 h-3.5" />
              Actief
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {isLoading && activeCount === 0 ? '...' : activeCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="stuck" data-testid="filter-stuck">
              <PauseCircle className="w-3.5 h-3.5" />
              Vast
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {isLoading && stuckCount === 0 ? '...' : stuckCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="filter-completed">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Afgerond
              <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                {isLoading && completedCount === 0 ? '...' : completedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="filter-all">
              <List className="w-3.5 h-3.5" />
              Alles
            </TabsTrigger>
          </TabsList>

          {/* Table */}
          {isLoading && tasks.length === 0 ? (
            <div data-testid="activities-loading" className="flex flex-col items-center justify-center h-64 text-gray-400 pt-2">
              <Loader2 className="w-8 h-8 mb-4 animate-spin" />
              <p className="text-sm">Taken laden...</p>
            </div>
          ) : error ? (
            <div data-testid="activities-error" className="flex flex-col items-center justify-center h-64 text-gray-400 pt-2">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Opnieuw proberen
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div data-testid="activities-empty" className="flex flex-col items-center justify-center h-64 text-gray-400 pt-2">
              {/* Radar pulse animation */}
              <div className="relative mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                </div>
                <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-gray-300 animate-ping [animation-duration:2s]" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border border-gray-200 animate-ping [animation-duration:2s] [animation-delay:500ms]" />
              </div>
              <p className="text-sm text-gray-500">
                Luisteren naar nieuwe activiteiten
              </p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader column="workflow_type" label="Agent" />
                    <SortableHeader column="candidate_name" label="Kandidaat" />
                    <SortableHeader column="vacancy_title" label="Vacature" />
                    <SortableHeader column="current_step_label" label="Stap" />
                    <SortableHeader column="status" label="Status" />
                    <SortableHeader column="sla" label="SLA" />
                    <SortableHeader column="time_ago" label="Laatste Update" />
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task, index) => (
                    <TableRow
                      key={task.id}
                      data-testid={`task-row-${task.id}`}
                      className="group hover:bg-gray-50/50"
                      style={{ animation: `fade-in-up 0.3s ease-out ${index * 30}ms backwards` }}
                    >
                      <TableCell>
                        <WorkflowTypeBadge type={task.workflow_type} label={task.workflow_type_label} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {task.candidate_name || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        {task.vacancy_title || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <span className="text-gray-900">
                            {task.current_step === 'marked_as_complete'
                              ? // Show last completed step for manually completed tasks
                                translateStepLabel(task.workflow_steps?.filter(s => s.status === 'completed').pop()?.label || task.current_step_label)
                              : translateStepLabel(task.current_step_label)
                            }
                          </span>
                          {task.step_detail && (
                            <span className="block text-xs text-gray-500 mt-0.5">{task.step_detail}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActivityStatusBadge status={task.status} isStuck={task.is_stuck} currentStep={task.current_step} />
                      </TableCell>
                      <TableCell>
                        <SLABadge
                          status={task.status}
                          isStuck={task.is_stuck}
                          timeRemainingSeconds={task.time_remaining_seconds}
                          durationSeconds={task.duration_seconds}
                        />
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatRelativeDate(task.updated_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {task.is_stuck && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setCompleteDialogTask(task)}
                                data-testid={`complete-task-${task.id}`}
                                title="Markeer als afgerond"
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setDeleteDialogTask(task)}
                                data-testid={`delete-task-${task.id}`}
                                title="Verwijderen"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedTask(task)}
                            data-testid={`view-task-${task.id}`}
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Total count */}
          {!isLoading && !error && tasks.length > 0 && (
            <p className="text-sm text-gray-500">
              {total} {total === 1 ? 'taak' : 'taken'} gevonden
            </p>
          )}
        </Tabs>

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
                {/* Task info */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <WorkflowTypeBadge type={selectedTask.workflow_type} label={selectedTask.workflow_type_label} />
                    <ActivityStatusBadge status={selectedTask.status} isStuck={selectedTask.is_stuck} currentStep={selectedTask.current_step} />
                  </div>
                  {selectedTask.step_detail && (
                    <p className="text-sm text-gray-600">{selectedTask.step_detail}</p>
                  )}
                  <p className="text-xs text-gray-400">Laatste update: {formatRelativeDate(selectedTask.updated_at)}</p>
                </div>

                {/* Workflow steps timeline */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Workflow Voortgang</h4>
                  <Timeline>
                    {selectedTask.workflow_steps?.map((step, index) => {
                      const dotColor = step.status === 'completed' ? 'green'
                        : step.status === 'failed' ? 'orange'
                        : step.status === 'current' ? 'default'
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
                              step.status === 'pending' && 'bg-gray-200 text-gray-500',
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

        {/* Complete Task Dialog */}
        <AlertDialog open={!!completeDialogTask} onOpenChange={(open) => {
          if (!open) {
            setCompleteDialogTask(null);
            setCompletionNotes('');
          }
        }}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Taak afronden</AlertDialogTitle>
              <AlertDialogDescription>
                Weet je zeker dat je deze taak wilt markeren als afgerond?
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Task info summary */}
            <div className="py-2 px-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium">{completeDialogTask?.candidate_name || 'Onbekend'}</p>
              <p className="text-gray-500">{completeDialogTask?.vacancy_title || 'Geen vacature'}</p>
            </div>

            {/* Optional notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notitie (optioneel)</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Bijv. Kandidaat telefonisch gecontacteerd"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={2}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCompleting}>Annuleren</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e: React.MouseEvent) => { e.preventDefault(); handleCompleteTask(); }}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Afronden...
                  </>
                ) : (
                  'Markeer als afgerond'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Task Dialog */}
        <AlertDialog open={!!deleteDialogTask} onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogTask(null);
          }
        }}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Taak verwijderen</AlertDialogTitle>
              <AlertDialogDescription>
                Weet je zeker dat je deze taak wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Task info summary */}
            <div className="py-2 px-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium">{deleteDialogTask?.candidate_name || 'Onbekend'}</p>
              <p className="text-gray-500">{deleteDialogTask?.vacancy_title || 'Geen vacature'}</p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuleren</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e: React.MouseEvent) => { e.preventDefault(); handleDeleteTask(); }}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verwijderen...
                  </>
                ) : (
                  'Verwijderen'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageLayoutContent>
    </PageLayout>
  );
}
