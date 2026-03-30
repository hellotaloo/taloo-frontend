'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Loader2, Plug } from 'lucide-react';
import { toast } from 'sonner';

import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { NavItem } from '@/components/kit/nav-item';
import { StatusBadge } from '@/components/kit/status-badge';
import { Switch } from '@/components/ui/switch';
import {
  type ConnectionResponse,
  type IntegrationResponse,
  getIntegrations,
  getConnections,
  updateConnection,
} from '@/lib/integrations-api';
import { getProviderBlueprint, getStatusDisplay } from '@/lib/integration-registry';
import { useTranslations } from '@/lib/i18n';

/**
 * Shared layout for integration detail pages.
 * Provides the header (back arrow, name, status, toggle) and sidebar navigation.
 * Child pages render inside the content area.
 */
export default function IntegrationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('integrations');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const slug = params.slug as string;
  const blueprint = getProviderBlueprint(slug);

  const [connection, setConnection] = useState<ConnectionResponse | null>(null);
  const [integration, setIntegration] = useState<IntegrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const basePath = `/admin/integrations/${slug}`;

  const fetchData = useCallback(async () => {
    try {
      const [integrations, connections] = await Promise.all([
        getIntegrations(),
        getConnections(),
      ]);

      const found = integrations.find((i) => i.slug === slug);
      if (!found) {
        toast.error(t('notFound'));
        router.push('/admin/integrations');
        return;
      }

      setIntegration(found);

      const conn = connections.find((c) => c.integration.slug === slug);
      if (conn) setConnection(conn);
    } catch {
      toast.error(t('dataLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (active: boolean) => {
    if (!connection) return;
    setToggling(true);
    try {
      const updated = await updateConnection(connection.id, { is_active: active });
      setConnection(updated);
      toast.success(active ? t('activated') : t('deactivated'));
    } catch {
      toast.error(t('updateFailed'));
    } finally {
      setToggling(false);
    }
  };

  const Icon = blueprint.icon;
  const vendor = blueprint.vendor;
  const showMapping = !!(connection?.has_credentials && blueprint.hasMapping);
  const status = getStatusDisplay(connection ?? undefined);

  // Determine active nav section from pathname
  const isMapping = pathname.startsWith(`${basePath}/mapping`);
  const isMappingImport = pathname === `${basePath}/mapping/import` || pathname === `${basePath}/mapping`;
  const isMappingExport = pathname === `${basePath}/mapping/export`;

  const sidebar = (
    <div className="flex flex-col h-full py-4">
      <div className="px-2">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('sidebarConfig')}
        </div>
        <div className="mt-1 space-y-1">
          <Link href={basePath}>
            <NavItem
              icon={Plug}
              label={t('sidebarConnection')}
              active={!isMapping}
              testId="connection"
            />
          </Link>
          {showMapping && (
            <>
              <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t('sidebarMapping')}
              </div>
              <Link href={`${basePath}/mapping/import`}>
                <NavItem
                  icon={ArrowDownToLine}
                  label={t('sidebarVacancyImport')}
                  active={isMappingImport}
                  testId="mapping-import"
                />
              </Link>
              <Link href={`${basePath}/mapping/export`}>
                <NavItem
                  icon={ArrowUpFromLine}
                  label={t('sidebarDataFeedback')}
                  active={isMappingExport}
                  testId="mapping-export"
                />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageLayout>
        <PageLayoutHeader>
          <div className="flex items-center gap-3">
            <Link href="/admin/integrations" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">{slug}</h1>
          </div>
        </PageLayoutHeader>
        <PageLayoutContent sidebar={sidebar} sidebarPosition="left" sidebarWidth={240} sidebarClassName="bg-gray-50/50">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </PageLayoutContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link href="/admin/integrations" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{integration?.name || slug}</h1>
              {vendor && <p className="text-xs text-gray-500 -mt-0.5">{vendor}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {connection?.has_credentials && (
              <>
                <StatusBadge label={t(status.labelKey)} variant={status.variant} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{t('active')}</span>
                  <Switch
                    checked={connection.is_active}
                    onCheckedChange={handleToggle}
                    disabled={toggling}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </PageLayoutHeader>

      <PageLayoutContent
        sidebar={sidebar}
        sidebarPosition="left"
        sidebarWidth={240}
        sidebarClassName="bg-gray-50/50"
      >
        {children}
      </PageLayoutContent>
    </PageLayout>
  );
}
