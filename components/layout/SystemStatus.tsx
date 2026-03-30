'use client';

import { type ElementType, useCallback, useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getSystemStatus,
  type ServiceStatusItem,
  type IntegrationStatusItem,
  type SystemStatusResponse,
} from '@/lib/api';
import { useTranslations } from '@/lib/i18n';
import {
  Bot,
  Globe,
  MessageCircle,
  Mic,
  RefreshCw,
  Server,
} from 'lucide-react';

type StatusValue = 'online' | 'offline' | 'degraded' | 'not_configured' | 'unknown';

function getStatusColor(status: StatusValue): string {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'offline':
      return 'bg-red-500';
    case 'not_configured':
      return 'bg-gray-300';
    case 'unknown':
      return 'bg-gray-400';
  }
}

const overallLabelKeys: Record<string, string> = {
  online: 'operational',
  degraded: 'degraded',
  offline: 'offline',
};

const serviceIcons: Record<string, ElementType> = {
  platform: Server,
  llm: Bot,
  voice: Mic,
  whatsapp: MessageCircle,
};

function StatusDot({ status, size = 'sm' }: { status: StatusValue; size?: 'sm' | 'xs' }) {
  const sizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-1.5 h-1.5';
  return (
    <span className={`${sizeClasses} rounded-full ${getStatusColor(status)} inline-block`} />
  );
}

function ServiceRow({ item }: { item: ServiceStatusItem }) {
  const Icon = serviceIcons[item.slug] ?? Globe;
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-sm">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700 truncate">
            {item.name}
          </span>
          <StatusDot status={item.status as StatusValue} size="xs" />
        </div>
        <p className="text-xs text-gray-500 truncate">{item.description}</p>
      </div>
    </div>
  );
}

function IntegrationRow({ item }: { item: IntegrationStatusItem }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-sm">
      <Globe className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700 truncate">
            {item.name}
          </span>
          <StatusDot status={item.status as StatusValue} size="xs" />
        </div>
        <p className="text-xs text-gray-500 truncate">{item.description}</p>
      </div>
    </div>
  );
}

export function SystemStatus() {
  const t = useTranslations('systemStatus');
  const [data, setData] = useState<SystemStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSystemStatus();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on first open, then refresh every time dropdown opens
  useEffect(() => {
    if (open) {
      fetchStatus();
    }
  }, [open, fetchStatus]);

  // Also fetch on mount for the initial dot color
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const overallStatus = (data?.overall ?? 'unknown') as StatusValue;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors focus:outline-none"
          aria-label="System status"
        >
          <span className="relative flex items-center justify-center">
            <StatusDot status={overallStatus} />
            {overallStatus === 'online' && (
              <span className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('title')}</span>
          <span className="flex items-center gap-1.5 text-xs font-normal text-gray-500">
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <StatusDot status={overallStatus} size="xs" />
            )}
            {t(overallLabelKeys[data?.overall ?? ''] || 'unknown')}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Services */}
        <div className="p-1">
          <p className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Services
          </p>
          {data?.services.map((service) => (
            <ServiceRow key={service.slug} item={service} />
          ))}
          {!data && !loading && (
            <p className="px-2 py-2 text-xs text-gray-400">{t('unavailable')}</p>
          )}
        </div>

        {/* Integrations (only show if there are any) */}
        {data && data.integrations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-1">
              <p className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {t('integrations')}
              </p>
              {data.integrations.map((integration) => (
                <IntegrationRow key={integration.slug} item={integration} />
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
