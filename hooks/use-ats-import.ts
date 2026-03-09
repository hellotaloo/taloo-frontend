import { useState, useCallback, useRef, useEffect } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// --- Types ---

export type PreScreeningStatus = 'queued' | 'generating' | 'published' | 'failed';
export type ImportStatus = 'idle' | 'importing' | 'generating' | 'complete' | 'error';

export interface ImportVacancy {
  id: string;
  title: string;
  status: PreScreeningStatus;
  questionsCount?: number;
  activity?: string;
}

interface ImportProgress {
  status: ImportStatus;
  message: string;
  vacancies: { id: string; title: string; status: PreScreeningStatus; questions_count?: number; activity?: string }[];
  total?: number;
  published?: number;
  failed?: number;
}

interface ImportStartResponse {
  status: 'started' | 'already_running';
  message: string;
}

export interface UseAtsImportOptions {
  module?: 'pre_screening' | 'document_collection';
  onRefetch?: () => void;
}

export function useAtsImport(onRefetchOrOptions?: (() => void) | UseAtsImportOptions) {
  // Support both legacy (callback) and new (options object) signatures
  const options = typeof onRefetchOrOptions === 'function'
    ? { onRefetch: onRefetchOrOptions }
    : onRefetchOrOptions ?? {};
  const { module: importModule, onRefetch } = options;
  const [phase, setPhase] = useState<ImportStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [vacancies, setVacancies] = useState<Map<string, ImportVacancy>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [publishedCount, setPublishedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onRefetchRef = useRef(onRefetch);
  onRefetchRef.current = onRefetch;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleProgress = useCallback((progress: ImportProgress) => {
    setPhase(progress.status);
    setStatusMessage(progress.message);

    if (progress.vacancies && progress.vacancies.length > 0) {
      const mapped = progress.vacancies.map(v => [v.id, {
        id: v.id,
        title: v.title,
        status: v.status,
        questionsCount: v.questions_count,
        activity: v.activity,
      }] as const);
      setVacancies(new Map(mapped));
      setTotalCount(progress.vacancies.length);
      setPublishedCount(progress.vacancies.filter(v => v.status === 'published').length);

      // Refetch vacancy list so new/published rows move between tabs
      onRefetchRef.current?.();
    }

    if (progress.status === 'complete') {
      if (progress.total !== undefined) setTotalCount(progress.total);
      if (progress.published !== undefined) setPublishedCount(progress.published);
      stopPolling();
      onRefetchRef.current?.();
    }

    if (progress.status === 'error') {
      setError(progress.message);
      stopPolling();
    }
  }, [stopPolling]);

  const statusUrl = importModule
    ? `${BACKEND_URL}/demo/import-ats/status?module=${importModule}`
    : `${BACKEND_URL}/demo/import-ats/status`;

  const pollOnce = useCallback(async () => {
    const res = await fetch(statusUrl);
    const progress: ImportProgress = await res.json();
    handleProgress(progress);
    return progress;
  }, [handleProgress, statusUrl]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        await pollOnce();
      } catch {
        // Network error — retry on next interval
      }
    }, 3000);
  }, [stopPolling, pollOnce]);

  const startImport = useCallback(async () => {
    setPhase('importing');
    setStatusMessage('Vacatures importeren...');
    setVacancies(new Map());
    setError(null);
    setPublishedCount(0);
    setTotalCount(0);

    try {
      const importUrl = importModule
        ? `${BACKEND_URL}/demo/import-ats?module=${importModule}`
        : `${BACKEND_URL}/demo/import-ats`;
      const res = await fetch(importUrl, { method: 'POST' });
      const data: ImportStartResponse = await res.json();

      if (data.status === 'already_running') {
        setStatusMessage(data.message);
      }

      // Poll immediately, then every 3s
      try { await pollOnce(); } catch { /* will retry in interval */ }
      startPolling();
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Sync mislukt');
    }
  }, [startPolling, pollOnce, importModule]);

  const reset = useCallback(() => {
    stopPolling();
    setPhase('idle');
    setStatusMessage('');
    setVacancies(new Map());
    setError(null);
    setPublishedCount(0);
    setTotalCount(0);
  }, [stopPolling]);

  // On mount, check if there's an active import to resume
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(statusUrl);
        const progress: ImportProgress = await res.json();
        if (cancelled) return;

        if (progress.status === 'importing' || progress.status === 'generating') {
          handleProgress(progress);
          startPolling();
        } else if (progress.status === 'complete' && progress.vacancies?.length > 0) {
          // Populate map with final results so status overlay persists after reload
          handleProgress(progress);
        }
      } catch {
        // No active import or network error — ignore
      }
    })();
    return () => { cancelled = true; stopPolling(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isImporting = phase !== 'idle' && phase !== 'complete' && phase !== 'error';

  return {
    phase,
    statusMessage,
    vacancies,
    error,
    isImporting,
    publishedCount,
    totalCount,
    startImport,
    reset,
  };
}
