'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
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
import { getActivityTasks, type TaskRow, type GetActivityTasksParams } from '@/lib/api';
import { TagBadge, type TagBadgeVariant } from '@/components/kit/tag-badge';

// Activity status badge using TagBadge
function ActivityStatusBadge({ status, isStuck }: { status: string; isStuck: boolean }) {
  if (isStuck || status === 'stuck') {
    return <TagBadge label="Vast" variant="orange" />;
  }
  if (status === 'completed') {
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

type FilterStatus = 'active' | 'completed' | 'all';

export default function ActivitiesPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stuckCount, setStuckCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('active');
  const [stuckOnly, setStuckOnly] = useState(false);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    setError(null);
    try {
      const params: GetActivityTasksParams = {
        status: activeFilter,
        stuck_only: stuckOnly,
        limit: 100,
      };
      const response = await getActivityTasks(params);
      setTasks(response.tasks);
      setTotal(response.total);
      setStuckCount(response.stuck_count);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Kon taken niet laden');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, stuckOnly]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  // Polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setActiveFilter(value as FilterStatus);
    setIsLoading(true);
  };

  // Handle stuck toggle
  const handleStuckToggle = () => {
    setStuckOnly(!stuckOnly);
    setIsLoading(true);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    fetchTasks();
  };

  return (
    <PageLayout>
      <PageLayoutHeader
        title="Activiteiten"
        description="Overzicht van alle actieve agent taken"
      />
      <PageLayoutContent>
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Tabs value={activeFilter} onValueChange={handleFilterChange}>
                <TabsList variant="line">
                  <TabsTrigger value="active" data-testid="filter-active">
                    Actief
                    {stuckCount > 0 && activeFilter === 'active' && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">
                        {stuckCount} vast
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="completed" data-testid="filter-completed">
                    Afgerond
                  </TabsTrigger>
                  <TabsTrigger value="all" data-testid="filter-all">
                    Alles
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Stuck toggle */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stuckOnly}
                  onChange={handleStuckToggle}
                  className="w-4 h-4 text-brand-dark-blue border-gray-300 rounded focus:ring-brand-dark-blue"
                  data-testid="stuck-only-toggle"
                />
                Toon alleen vastgelopen taken
              </label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              Vernieuwen
            </Button>
          </div>

          {/* Table */}
          {isLoading && tasks.length === 0 ? (
            <div data-testid="activities-loading" className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 className="w-8 h-8 mb-4 animate-spin" />
              <p className="text-sm">Taken laden...</p>
            </div>
          ) : error ? (
            <div data-testid="activities-error" className="flex flex-col items-center justify-center h-64 text-gray-400">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Opnieuw proberen
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div data-testid="activities-empty" className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Inbox className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">Geen actieve taken</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-medium">Kandidaat</TableHead>
                    <TableHead className="font-medium">Vacature</TableHead>
                    <TableHead className="font-medium">Agent</TableHead>
                    <TableHead className="font-medium">Stap</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium text-right">Laatste Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task, index) => (
                    <TableRow
                      key={task.id}
                      data-testid={`task-row-${task.id}`}
                      className="hover:bg-gray-50/50"
                      style={{ animation: `fade-in-up 0.3s ease-out ${index * 30}ms backwards` }}
                    >
                      <TableCell className="font-medium">
                        {task.candidate_name || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        {task.vacancy_title || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        <WorkflowTypeBadge type={task.workflow_type} label={task.workflow_type_label} />
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {task.current_step_label}
                      </TableCell>
                      <TableCell>
                        <ActivityStatusBadge status={task.status} isStuck={task.is_stuck} />
                      </TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">
                        {task.time_ago}
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
              {stuckCount > 0 && ` (${stuckCount} vastgelopen)`}
            </p>
          )}
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
