'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  deleteConnection,
  updateConnection,
} from '@/lib/integrations-api';
import { getProviderBlueprint } from '@/lib/integration-registry';
import { useTranslations } from '@/lib/i18n';

/** Pretty-print a snake_case field name as a label */
function fieldLabel(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function IntegrationConnectionPage() {
  const t = useTranslations('integrations');
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const blueprint = getProviderBlueprint(slug);

  const [connection, setConnection] = useState<ConnectionResponse | null>(null);
  const [integrationName, setIntegrationName] = useState('');
  const [integrationDescription, setIntegrationDescription] = useState('');
  const [loading, setLoading] = useState(true);

  // Dynamic form
  const [fields, setFields] = useState<CredentialField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Health check
  const [checking, setChecking] = useState(false);

  // Advanced settings
  const [sfObject, setSfObject] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

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
        toast.error(t('notFound'));
        router.push('/admin/integrations');
        return;
      }

      setIntegrationName(integration.name);
      setIntegrationDescription(integration.description);
      setFields(credentialFields);

      const empty: Record<string, string> = {};
      for (const f of credentialFields) {
        empty[f.name] = '';
      }
      setFormValues(empty);

      const conn = connections.find((c) => c.integration.slug === slug);
      if (conn) {
        setConnection(conn);
        setSfObject(String(conn.settings?.sf_object ?? ''));
      }
    } catch {
      toast.error(t('dataLoadFailed'));
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
      toast.success(t('credentialsSaved'));
      handleHealthCheck(conn.id);
    } catch {
      toast.error(t('saveFailed'));
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
        toast.success(result.message || t('connectionTested'));
      } else {
        toast.error(result.message || t('connectionFailed'));
      }
    } catch {
      toast.error(t('healthCheckFailed'));
    } finally {
      setChecking(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!connection) return;
    setSavingSettings(true);
    try {
      const updated = await updateConnection(connection.id, {
        settings: { sf_object: sfObject.trim() || undefined },
      });
      setConnection(updated);
      toast.success(t('settingsSaved'));
    } catch {
      toast.error(t('saveFailedShort'));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDelete = async () => {
    if (!connection) return;
    setDeleting(true);
    try {
      await deleteConnection(connection.id);
      toast.success(t('deleted'));
      router.push('/admin/integrations');
    } catch {
      toast.error(t('deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const isFormValid = fields
    .filter((f) => f.required)
    .every((f) => formValues[f.name]?.trim() !== '');

  const Icon = blueprint.icon;
  const vendor = blueprint.vendor;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Integration info card */}
      <div
        className="rounded-xl border border-gray-200 bg-white p-5 space-y-4"
        style={{ animation: 'fade-in-up 0.3s ease-out backwards' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{integrationName || slug}</h3>
            {vendor && <p className="text-xs text-gray-500">{vendor}</p>}
          </div>
        </div>

        <p className="text-sm text-gray-500">{integrationDescription}</p>
      </div>

      {/* Credentials form */}
      <div
        className="rounded-xl border border-gray-200 bg-white p-5 space-y-5"
        style={{ animation: 'fade-in-up 0.3s ease-out 100ms backwards' }}
      >
        <div>
          <h3 className="font-semibold text-gray-900">{t('credentials')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {connection?.has_credentials
              ? t('credentialsUpdateHelp')
              : t('credentialsCreateHelp')}
          </p>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noFields')}</p>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {fieldLabel(field.name)}
                  {!field.required && (
                    <span className="text-gray-400 font-normal ml-1">{t('optional')}</span>
                  )}
                </Label>
                <Input
                  id={field.name}
                  type={field.type}
                  value={formValues[field.name] ?? ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                  }
                  placeholder={connection?.credential_hints?.[field.name] || field.description}
                  required={field.required}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {connection?.has_credentials && (
            <Button variant="outline" onClick={() => handleHealthCheck(connection.id)} disabled={checking}>
              {checking && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('test')}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !isFormValid}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      </div>

      {/* Advanced settings — Connexys only */}
      {connection?.has_credentials && slug === 'connexys' && (
        <div
          className="rounded-xl border border-gray-200 bg-white p-5 space-y-4"
          style={{ animation: 'fade-in-up 0.3s ease-out 150ms backwards' }}
        >
          <div>
            <h3 className="font-semibold text-gray-900">{t('advancedSettings')}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('advancedSettingsDesc')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sf-object">{t('sfObject')}</Label>
            <Input
              id="sf-object"
              value={sfObject}
              onChange={(e) => setSfObject(e.target.value)}
              placeholder="cxsrec__cxsPosition__c"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-400">
              {t('sfObjectHelp')}
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={savingSettings} size="sm">
              {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('save')}
            </Button>
          </div>
        </div>
      )}

      {/* Danger zone */}
      {connection && (
        <div
          className="rounded-xl border border-red-200 bg-red-50/50 p-5"
          style={{ animation: 'fade-in-up 0.3s ease-out 250ms backwards' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-900">{t('deleteIntegration')}</h3>
              <p className="text-sm text-red-700/70 mt-1">
                {t('deleteIntegrationDesc')}
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => setShowDelete(true)}
            >
              {t('delete')}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
