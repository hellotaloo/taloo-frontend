'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, Building2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { NavItem } from '@/components/kit/nav-item';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations, useLocale, type Locale } from '@/lib/i18n';
import { useAuth } from '@/contexts/auth-context';
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
  updateWorkspace,
  type WorkspaceLanguage,
  type WorkspaceSettings,
} from '@/lib/workspace-settings-api';

type SettingsTab = 'workspace' | 'language';

function SettingsSidebar({
  activeTab,
  onTabChange,
}: {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}) {
  const t = useTranslations('settings');
  return (
    <div className="flex flex-col h-full py-4">
      <div className="px-2">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('general')}
        </div>
        <div className="mt-1 space-y-1">
          <NavItem
            icon={Building2}
            label={t('workspaceTab')}
            active={activeTab === 'workspace'}
            onClick={() => onTabChange('workspace')}
            testId="settings-workspace"
          />
          <NavItem
            icon={Globe}
            label={t('language')}
            active={activeTab === 'language'}
            onClick={() => onTabChange('language')}
            testId="settings-language"
          />
        </div>
      </div>
    </div>
  );
}

function WorkspaceTab({
  canEdit,
  workspaceId,
  settings,
  onSettingsChange,
}: {
  canEdit: boolean;
  workspaceId: string;
  settings: WorkspaceSettings | null;
  onSettingsChange: (s: WorkspaceSettings) => void;
}) {
  const t = useTranslations('settings');
  const { currentWorkspace } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentWorkspace?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(currentWorkspace?.logo_url ?? '');
  const [spokenName, setSpokenName] = useState(settings?.spoken_name ?? '');
  const [savingField, setSavingField] = useState<string | null>(null);

  // Sync when settings load
  useEffect(() => {
    if (settings) {
      setSpokenName(settings.spoken_name ?? '');
    }
  }, [settings]);

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name);
      setLogoUrl(currentWorkspace.logo_url ?? '');
    }
  }, [currentWorkspace]);

  const saveWorkspaceField = async (field: string, updates: Record<string, unknown>) => {
    setSavingField(field);
    try {
      await updateWorkspace(workspaceId, updates as { name?: string; logo_url?: string | null });
    } catch {
      toast.error(t('saveFailed'));
      // Revert
      if (field === 'name') setName(currentWorkspace?.name ?? '');
      if (field === 'logo') setLogoUrl(currentWorkspace?.logo_url ?? '');
    } finally {
      setSavingField(null);
    }
  };

  const saveSettingsField = async (field: string, updates: Record<string, unknown>) => {
    setSavingField(field);
    try {
      const updated = await updateWorkspaceSettings(workspaceId, updates as { spoken_name?: string | null });
      onSettingsChange(updated);
    } catch {
      toast.error(t('saveFailed'));
      if (field === 'spokenName') setSpokenName(settings?.spoken_name ?? '');
    } finally {
      setSavingField(null);
    }
  };

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentWorkspace?.name) return;
    saveWorkspaceField('name', { name: trimmed });
  };

  const handleSpokenNameBlur = () => {
    const trimmed = spokenName.trim();
    const current = settings?.spoken_name ?? '';
    if (trimmed === current) return;
    saveSettingsField('spokenName', { spoken_name: trimmed || null });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    // Max 500KB for logo
    if (file.size > 500 * 1024) {
      toast.error('Logo must be under 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoUrl(dataUrl);
      saveWorkspaceField('logo', { logo_url: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLogoRemove = () => {
    setLogoUrl('');
    saveWorkspaceField('logo', { logo_url: null });
  };

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t('workspaceTab')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('workspaceDesc')}</p>
      </div>

      {/* Workspace Name */}
      <div className="space-y-2">
        <Label htmlFor="workspace-name">{t('workspaceName')}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="workspace-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            disabled={!canEdit}
            className="w-[320px]"
            maxLength={100}
          />
          {savingField === 'name' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        <p className="text-xs text-gray-400">{t('workspaceNameHint')}</p>
      </div>

      {/* Workspace Logo */}
      <div className="space-y-2">
        <Label>{t('workspaceLogo')}</Label>
        <div className="flex items-center gap-4">
          <div
            className="w-[72px] h-[72px] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-gray-300" />
            )}
          </div>
          {canEdit && (
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {t('workspaceLogoChange')}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  {t('workspaceLogoRemove')}
                </button>
              )}
            </div>
          )}
          {savingField === 'logo' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        <p className="text-xs text-gray-400">{t('workspaceLogoHint')}</p>
      </div>

      {/* Spoken Name */}
      <div className="space-y-2">
        <Label htmlFor="spoken-name">{t('spokenName')}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="spoken-name"
            value={spokenName}
            onChange={(e) => setSpokenName(e.target.value)}
            onBlur={handleSpokenNameBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            disabled={!canEdit}
            placeholder={t('spokenNamePlaceholder')}
            className="w-[320px]"
            maxLength={100}
          />
          {savingField === 'spokenName' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        <p className="text-xs text-gray-400">{t('spokenNameHint')}</p>
      </div>
    </div>
  );
}

function LanguageTab({
  canEdit,
  workspaceId,
  settings,
  onSettingsChange,
}: {
  canEdit: boolean;
  workspaceId: string;
  settings: WorkspaceSettings | null;
  onSettingsChange: (s: WorkspaceSettings) => void;
}) {
  const t = useTranslations('settings');
  const { locale, setLocale } = useLocale();
  const [saving, setSaving] = useState(false);
  const currentLanguage = settings?.language ?? (locale as WorkspaceLanguage);

  const handleLanguageChange = async (value: string) => {
    const newLang = value as WorkspaceLanguage;
    if (newLang === currentLanguage) return;

    const previousLang = currentLanguage;
    // Optimistic update
    onSettingsChange({ ...settings!, language: newLang });
    setLocale(newLang as Locale);
    setSaving(true);

    try {
      const updated = await updateWorkspaceSettings(workspaceId, { language: newLang });
      onSettingsChange(updated);
    } catch {
      onSettingsChange({ ...settings!, language: previousLang });
      setLocale(previousLang as Locale);
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t('language')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('languageDesc')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language-select">{t('interfaceLanguage')}</Label>
        <div className="flex items-center gap-2">
          <Select
            value={currentLanguage}
            onValueChange={handleLanguageChange}
            disabled={!canEdit}
          >
            <SelectTrigger id="language-select" className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nl">Nederlands</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        <p className="text-xs text-gray-400">
          {canEdit ? t('languageHint') : t('languageReadOnly')}
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { locale, setLocale } = useLocale();
  const { currentWorkspace } = useAuth();
  const t = useTranslations('settings');

  const workspaceId = currentWorkspace?.id;
  const userRole = currentWorkspace?.role ?? 'member';
  const canEdit = userRole === 'super_admin' || userRole === 'owner' || userRole === 'admin';

  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const s = await getWorkspaceSettings(workspaceId);
      setSettings(s);
      if (s.language !== locale) {
        setLocale(s.language);
      }
    } catch {
      // Fall back to defaults
      setSettings({ language: locale as WorkspaceLanguage });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">{t('title')}</h1>
        </div>
      </PageLayoutHeader>

      <PageLayoutContent
        sidebar={<SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />}
        sidebarPosition="left"
        sidebarWidth={240}
        sidebarClassName="bg-gray-50/50"
      >
        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-400">{t('loading')}</span>
          </div>
        ) : (
          <>
            {activeTab === 'workspace' && (
              <WorkspaceTab
                canEdit={canEdit}
                workspaceId={workspaceId!}
                settings={settings}
                onSettingsChange={setSettings}
              />
            )}
            {activeTab === 'language' && (
              <LanguageTab
                canEdit={canEdit}
                workspaceId={workspaceId!}
                settings={settings}
                onSettingsChange={setSettings}
              />
            )}
          </>
        )}
      </PageLayoutContent>
    </PageLayout>
  );
}
