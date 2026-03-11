'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface UseRealtimeTableOptions {
  schema: string;
  table: string;
  event?: PostgresEvent | '*';
  filter?: string;
  onUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  enabled?: boolean;
}

/**
 * Subscribe to Supabase Realtime changes on a table.
 *
 * @example
 * // Re-fetch tasks when any workflow changes
 * useRealtimeTable({
 *   schema: 'agents',
 *   table: 'workflows',
 *   event: '*',
 *   onUpdate: () => fetchTasks(),
 * });
 *
 * @example
 * // Listen only for updates on a specific column filter
 * useRealtimeTable({
 *   schema: 'agents',
 *   table: 'pre_screenings',
 *   event: 'UPDATE',
 *   filter: 'status=eq.published',
 *   onUpdate: (payload) => console.log('Published:', payload.new),
 * });
 */
export function useRealtimeTable({
  schema,
  table,
  event = '*',
  filter,
  onUpdate,
  enabled = true,
}: UseRealtimeTableOptions) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime:${schema}.${table}${filter ? `:${filter}` : ''}`;

    const channelConfig: Record<string, unknown> = {
      event,
      schema,
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as never,
        channelConfig as never,
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          onUpdateRef.current(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schema, table, event, filter, enabled]);
}
