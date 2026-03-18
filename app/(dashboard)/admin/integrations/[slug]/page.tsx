'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, Loader2, Trash2, Video } from 'lucide-react';
import { toast } from 'sonner';

import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { StatusBadge, type StatusBadgeVariant } from '@/components/kit/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  type ConnectionResponse,
  type CredentialField,
  getIntegrations,
  getConnections,
  getCredentialFields,
  saveCredentials,
  runHealthCheck,
  updateConnection,
  deleteConnection,
} from '@/lib/integrations-api';
import { formatRelativeDate } from '@/lib/utils';

// --- Provider config ---

const providerMeta: Record<string, { icon: React.ElementType; vendor: string }> = {
  connexys: { icon: Database, vendor: 'Bullhorn' },
  microsoft: { icon: Video, vendor: 'Teams & Outlook' },
};

function getStatusDisplay(connection?: ConnectionResponse): {
  label: string;
  variant: StatusBadgeVariant;
} {
  if (!connection || !connection.has_credentials) {
    return { label: 'Niet geconfigureerd', variant: 'gray' };
  }
  switch (connection.health_status) {
    case 'healthy':
      return { label: 'Verbonden', variant: 'green' };
    case 'unhealthy':
      return { label: 'Verbinding mislukt', variant: 'red' };
    default:
      return { label: 'Niet getest', variant: 'orange' };
  }
}

/** Pretty-print a snake_case field name as a label */
function fieldLabel(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// --- Main page ---

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const meta = providerMeta[slug];

  const [connection, setConnection] = useState<ConnectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [integrationName, setIntegrationName] = useState('');
  const [integrationDescription, setIntegrationDescription] = useState('');

  // Dynamic form
  const [fields, setFields] = useState<CredentialField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Health check
  const [checking, setChecking] = useState(false);

  // Toggle
  const [toggling, setToggling] = useState(false);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [integrations, connections, credentialFields] = await Promise.all([
        getIntegrations(),
        getConnections(),
        getCredentialFields(slug),
      ]);

      const integration = integrations.find((i) => i.slug === slug);
      if (!integration) {
        toast.error('Integratie niet gevonden');
        router.push('/admin/integrations');
        return;
      }

      setIntegrationName(integration.name);
      setIntegrationDescription(integration.description);
      setFields(credentialFields);

      // Initialize empty form values from schema fields
      const empty: Record<string, string> = {};
      for (const f of credentialFields) {
        empty[f.name] = '';
      }
      setFormValues(empty);

      const conn = connections.find((c) => c.integration.slug === slug);
      if (conn) setConnection(conn);
    } catch {
      toast.error('Kon gegevens niet laden');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const conn = await saveCredentials(slug, formValues);
      setConnection(conn);
      toast.success('Credentials opgeslagen');
      handleHealthCheck(conn.id);
    } catch {
      toast.error('Opslaan mislukt. Probeer opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  const handleHealthCheck = async (connectionId: string) => {
    setChecking(true);
    try {
      const result = await runHealthCheck(connectionId);
      setConnection((prev) =>
        prev ? { ...prev, health_status: result.health_status, last_health_check_at: result.checked_at } : prev
      );
      if (result.health_status === 'healthy') {
        toast.success(result.message || 'Verbinding getest');
      } else {
        toast.error(result.message || 'Verbinding mislukt');
      }
    } catch {
      toast.error('Health check mislukt');
    } finally {
      setChecking(false);
    }
  };

  const handleToggle = async (active: boolean) => {
    if (!connection) return;
    setToggling(true);
    try {
      const updated = await updateConnection(connection.id, { is_active: active });
      setConnection(updated);
      toast.success(active ? 'Integratie geactiveerd' : 'Integratie gedeactiveerd');
    } catch {
      toast.error('Bijwerken mislukt');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!connection) return;
    setDeleting(true);
    try {
      await deleteConnection(connection.id);
      toast.success('Integratie verwijderd');
      router.push('/admin/integrations');
    } catch {
      toast.error('Verwijderen mislukt');
    } finally {
      setDeleting(false);
    }
  };

  const isFormValid = fields
    .filter((f) => f.required)
    .every((f) => formValues[f.name]?.trim() !== '');

  const Icon = meta?.icon ?? Database;
  const vendor = meta?.vendor ?? '';
  const status = getStatusDisplay(connection ?? undefined);

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link href="/admin/integrations" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">{integrationName || slug}</h1>
          </div>
          {connection?.has_credentials && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleHealthCheck(connection.id)}
                disabled={checking}
              >
                {checking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Testen
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-600"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="w-4 h-4" />
                Verwijderen
              </Button>
            </div>
          )}
        </div>
      </PageLayoutHeader>

      <PageLayoutContent>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="max-w-xl space-y-8">
            {/* Integration info card */}
            <div
              className="rounded-xl border border-gray-200 bg-white p-5 space-y-4"
              style={{ animation: 'fade-in-up 0.3s ease-out backwards' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integrationName || slug}</h3>
                    {vendor && <p className="text-xs text-gray-500">{vendor}</p>}
                  </div>
                </div>
                {connection?.has_credentials && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Actief</span>
                    <Switch
                      checked={connection.is_active}
                      onCheckedChange={handleToggle}
                      disabled={toggling}
                    />
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500">{integrationDescription}</p>

              <div className="flex items-center gap-3">
                <StatusBadge label={status.label} variant={status.variant} />
                {connection?.last_health_check_at && (
                  <span className="text-xs text-gray-400">
                    Laatste check: {formatRelativeDate(connection.last_health_check_at)}
                  </span>
                )}
              </div>
            </div>

            {/* Credentials form — dynamically rendered from OpenAPI schema */}
            <div
              className="rounded-xl border border-gray-200 bg-white p-5 space-y-5"
              style={{ animation: 'fade-in-up 0.3s ease-out 100ms backwards' }}
            >
              <div>
                <h3 className="font-semibold text-gray-900">Credentials</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {connection?.has_credentials
                    ? 'Vul nieuwe waarden in om de credentials te overschrijven.'
                    : 'Vul de credentials in om de verbinding te maken.'}
                </p>
              </div>

              {fields.length === 0 ? (
                <p className="text-sm text-gray-400">Geen velden beschikbaar voor deze integratie.</p>
              ) : (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {fieldLabel(field.name)}
                        {!field.required && (
                          <span className="text-gray-400 font-normal ml-1">(optioneel)</span>
                        )}
                      </Label>
                      <Input
                        id={field.name}
                        type={field.type}
                        value={formValues[field.name] ?? ''}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                        }
                        placeholder={field.description}
                        required={field.required}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving || !isFormValid}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Opslaan
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Integratie verwijderen</AlertDialogTitle>
              <AlertDialogDescription>
                Weet je zeker dat je deze integratie wilt verwijderen? Alle opgeslagen credentials worden permanent verwijderd.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Verwijderen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageLayoutContent>
    </PageLayout>
  );
}
