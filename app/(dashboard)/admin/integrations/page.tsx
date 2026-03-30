'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { StatusBadge } from '@/components/kit/status-badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  type IntegrationResponse,
  type ConnectionResponse,
  getIntegrations,
  getConnections,
  runHealthCheck,
  updateConnection,
} from '@/lib/integrations-api';
import { formatRelativeDate } from '@/lib/utils';
import { getProviderBlueprint, getStatusDisplay } from '@/lib/integration-registry';
import { useTranslations, useLocale } from '@/lib/i18n';

// --- Main page ---

export default function IntegrationsPage() {
  const t = useTranslations('integrations');
  const { locale } = useLocale();
  const [integrations, setIntegrations] = useState<IntegrationResponse[]>([]);
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Health check
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // Toggle
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [integrationsData, connectionsData] = await Promise.all([
        getIntegrations(),
        getConnections(),
      ]);
      setIntegrations(integrationsData.filter((i) => i.is_active));
      setConnections(connectionsData);
    } catch {
      toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getConnection = (integrationId: string) =>
    connections.find((c) => c.integration.id === integrationId);

  const handleHealthCheck = async (connectionId: string) => {
    setCheckingId(connectionId);
    try {
      const result = await runHealthCheck(connectionId);
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, health_status: result.health_status, last_health_check_at: result.checked_at }
            : c
        )
      );
      if (result.health_status === 'healthy') {
        toast.success(result.message || t('connectionTested'));
      } else {
        toast.error(result.message || t('connectionFailed'));
      }
    } catch {
      toast.error(t('healthCheckFailed'));
    } finally {
      setCheckingId(null);
    }
  };

  const handleToggle = async (connectionId: string, active: boolean) => {
    setTogglingId(connectionId);
    try {
      const updated = await updateConnection(connectionId, { is_active: active });
      setConnections((prev) => prev.map((c) => (c.id === connectionId ? updated : c)));
      toast.success(active ? t('activated') : t('deactivated'));
    } catch {
      toast.error(t('updateFailed'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">{t('title')}</h1>
        </div>
      </PageLayoutHeader>

      <PageLayoutContent>
        <div className="max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : integrations.length === 0 ? (
            <p className="text-sm text-gray-500 py-10">{t('noIntegrations')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {integrations.map((integration, idx) => {
                const slug = integration.slug;
                const bp = getProviderBlueprint(slug);
                const connection = getConnection(integration.id);
                const status = getStatusDisplay(connection);
                const Icon = bp.icon;
                const isChecking = checkingId === connection?.id;
                const isToggling = togglingId === connection?.id;

                return (
                  <div
                    key={integration.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 flex flex-col"
                    style={{ animation: `fade-in-up 0.3s ease-out ${150 + idx * 100}ms backwards` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                          <p className="text-xs text-gray-500">{integration.vendor}</p>
                        </div>
                      </div>
                      {connection?.has_credentials && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{t('active')}</span>
                          <Switch
                            checked={connection.is_active}
                            onCheckedChange={(checked) => handleToggle(connection.id, checked)}
                            disabled={isToggling}
                          />
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500 line-clamp-2">{integration.description}</p>

                    {/* Status */}
                    <div className="flex items-center gap-3 mt-auto">
                      <StatusBadge label={t(status.labelKey)} variant={status.variant} />
                      {connection?.last_health_check_at && (
                        <span className="text-xs text-gray-400">
                          {t('lastCheck')}{formatRelativeDate(connection.last_health_check_at, locale)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/integrations/${slug}`}>
                          {t('configure')}
                        </Link>
                      </Button>
                      {connection?.has_credentials && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHealthCheck(connection.id)}
                          disabled={isChecking}
                        >
                          {isChecking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {t('test')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
