'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar, MessageCircle, CheckCircle2, ShieldQuestion, MessageSquare, Pencil, Check, X, Phone, Info, Mic, SlidersHorizontal, ListOrdered, ChevronDown, User, Briefcase, PanelTop } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { type VoiceOption } from '@/components/blocks/voice-settings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Timeline, TimelineNode } from '@/components/kit/timeline';
import { NavItem } from '@/components/kit/nav-item';
import { toast } from 'sonner';
import { getPreScreeningConfig, updatePreScreeningConfig, getApplyPopupContent, updateApplyPopupContent } from '@/lib/interview-api';
import { getElevenLabsVoiceConfig } from '@/lib/api';

const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_DEMO_AGENT_ID || '';

// Voice options with ElevenLabs voice IDs
const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'bob',
    name: 'Bob',
    description: 'Zelfverzekerd en helder',
    gender: 'male',
    voiceId: "s7Z6uboUuE4Nd8Q2nye6",
    avatar: '/avatars/large/male_2.png',
  },
  {
    id: 'emma',
    name: 'Louise',
    description: 'Warm en professioneel',
    gender: 'female',
    voiceId: 'v3V1d2rk6528UrLKRuy8',
    avatar: '/avatars/large/female_6.png',
  },
  {
    id: 'luc',
    name: 'Luc',
    description: 'Energiek en vriendelijk',
    gender: 'male',
    voiceId: "IPgYtHTNLjC7Bq7IPHrm",
    avatar: '/avatars/large/male_1.png',
  }
];

type SettingsSection = 'voice' | 'algemeen' | 'generator' | 'planning' | 'escalatie' | 'interview' | 'popup';

export default function PreScreeningSettingsPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>('algemeen');

  // Voice settings state
  const [selectedVoice, setSelectedVoice] = useState<string>('emma');
  const [isVoiceLoading, setIsVoiceLoading] = useState(true);
  const [voiceSelectOpen, setVoiceSelectOpen] = useState(false);

  // Exit thresholds
  const [maxUnrelatedAnswers, setMaxUnrelatedAnswers] = useState(2);

  // Scheduling
  const [scheduleDaysAhead, setScheduleDaysAhead] = useState(3);
  const [scheduleStartOffset, setScheduleStartOffset] = useState(1);

  // Consent recording
  const [consentEnabled, setConsentEnabled] = useState(false);
  const [consentMessage, setConsentMessage] = useState(
    'Dit gesprek kan worden opgenomen voor kwaliteitsdoeleinden. Gaat u hiermee akkoord?'
  );
  const [editingConsent, setEditingConsent] = useState(false);
  const [tempConsent, setTempConsent] = useState(consentMessage);

  // Escalation to human
  const [escalationEnabled, setEscalationEnabled] = useState(false);
  const [escalationDays, setEscalationDays] = useState<string[]>(['ma', 'di', 'wo', 'do', 'vr']);
  const [escalationStartTime, setEscalationStartTime] = useState('09:00');
  const [escalationEndTime, setEscalationEndTime] = useState('17:00');
  const [escalationPhoneMode, setEscalationPhoneMode] = useState<'auto' | 'custom'>('auto');
  const [escalationCustomPhone, setEscalationCustomPhone] = useState('');

  // Review & publishing settings
  const [requireReview, setRequireReview] = useState(false);
  const [defaultChannels, setDefaultChannels] = useState({ voice: true, whatsapp: true, cv: true });
  const [autoGenerate, setAutoGenerate] = useState(true);

  // Persona name (general setting, used by voice agent + popup)
  const [personaName, setPersonaName] = useState('Anna');

  // Generator custom instructions
  const [generatorInstructions, setGeneratorInstructions] = useState('');

  // Apply popup content
  const [popupYaml, setPopupYaml] = useState('');
  const [popupVariables, setPopupVariables] = useState<Record<string, string>>({});
  const [popupVersion, setPopupVersion] = useState(0);
  const [isPopupSaving, setIsPopupSaving] = useState(false);

  const allDays = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const;

  const toggleEscalationDay = (day: string) => {
    setEscalationDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Interview outline
  const [introMessage, setIntroMessage] = useState(
    'Hoi! Ik ben de virtuele assistent van [Bedrijf]. Ik help je graag met het plannen van een kennismakingsgesprek.'
  );
  const [successMessage, setSuccessMessage] = useState(
    'Bedankt! Je ontvangt nog een reminder voor het gesprek.'
  );
  const [schedulingOption, setSchedulingOption] = useState<'funnel' | 'direct'>('funnel');

  // Edit states
  const [editingIntro, setEditingIntro] = useState(false);
  const [editingSuccess, setEditingSuccess] = useState(false);
  const [tempIntro, setTempIntro] = useState(introMessage);
  const [tempSuccess, setTempSuccess] = useState(successMessage);

  // Fetch config from API on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getPreScreeningConfig();
        const { general, generator, planning, interview, escalation, publishing } = config.settings;
        if (generator?.custom_instructions) setGeneratorInstructions(generator.custom_instructions);
        if (general.persona_name) setPersonaName(general.persona_name);
        setMaxUnrelatedAnswers(general.max_unrelated_answers);
        setScheduleDaysAhead(planning.schedule_days_ahead);
        setScheduleStartOffset(planning.schedule_start_offset);
        setConsentEnabled(interview.require_consent);
        setEscalationEnabled(escalation.allow_escalation);
        // Publishing settings (with fallback to general for backwards compat)
        setRequireReview(publishing?.require_review ?? general.require_review ?? false);
        if (publishing?.default_channels) setDefaultChannels(publishing.default_channels);
        else if (general.default_channels) setDefaultChannels(general.default_channels);
        setAutoGenerate(publishing?.auto_generate ?? true);
        setSchedulingOption(planning.planning_mode as 'funnel' | 'direct');
        if (general.intro_message) {
          setIntroMessage(general.intro_message);
          setTempIntro(general.intro_message);
        }
        if (general.success_message) {
          setSuccessMessage(general.success_message);
          setTempSuccess(general.success_message);
        }
      } catch (error) {
        console.error('Failed to load pre-screening config:', error);
        setLoadError('Kon instellingen niet laden');
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Load apply popup content on mount
  useEffect(() => {
    async function loadPopupContent() {
      try {
        const data = await getApplyPopupContent();
        setPopupYaml(data.content_yaml);
        setPopupVariables(data.variables);
        setPopupVersion(data.version);
      } catch (error) {
        console.error('Failed to load apply popup content:', error);
      }
    }
    loadPopupContent();
  }, []);

  // Load voice config on mount
  useEffect(() => {
    async function loadVoiceConfig() {
      try {
        const config = await getElevenLabsVoiceConfig(ELEVENLABS_AGENT_ID);
        if (config) {
          const savedVoiceOptionId = localStorage.getItem(`voice-option-${ELEVENLABS_AGENT_ID}`);
          if (savedVoiceOptionId && VOICE_OPTIONS.some((v) => v.id === savedVoiceOptionId)) {
            setSelectedVoice(savedVoiceOptionId);
          } else {
            const voice = VOICE_OPTIONS.find((v) => v.voiceId === config.voice_id);
            if (voice) setSelectedVoice(voice.id);
          }
        }
      } catch (error) {
        console.error('Failed to load voice config:', error);
      } finally {
        setIsVoiceLoading(false);
      }
    }
    loadVoiceConfig();
  }, []);

  // Handle voice selection
  const handleSelectVoice = useCallback((voiceId: string) => {
    setSelectedVoice(voiceId);
    localStorage.setItem(`voice-option-${ELEVENLABS_AGENT_ID}`, voiceId);
  }, []);

  // Get selected voice for display
  const selectedVoiceData = VOICE_OPTIONS.find((v) => v.id === selectedVoice);

  const handleSaveConsent = () => {
    setConsentMessage(tempConsent);
    setEditingConsent(false);
  };

  const handleCancelConsent = () => {
    setTempConsent(consentMessage);
    setEditingConsent(false);
  };

  const handleSaveIntro = () => {
    setIntroMessage(tempIntro);
    setEditingIntro(false);
  };

  const handleCancelIntro = () => {
    setTempIntro(introMessage);
    setEditingIntro(false);
  };

  const handleSaveSuccess = () => {
    setSuccessMessage(tempSuccess);
    setEditingSuccess(false);
  };

  const handleCancelSuccess = () => {
    setTempSuccess(successMessage);
    setEditingSuccess(false);
  };

  const handleSavePopup = useCallback(async () => {
    setIsPopupSaving(true);
    try {
      const data = await updateApplyPopupContent({
        content_yaml: popupYaml,
        variables: popupVariables,
      });
      setPopupVersion(data.version);
      toast.success('Popup content opgeslagen');
    } catch (error) {
      console.error('Failed to save popup content:', error);
      toast.error('Opslaan mislukt. Controleer de YAML syntax.');
    } finally {
      setIsPopupSaving(false);
    }
  }, [popupYaml, popupVariables]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updatePreScreeningConfig({
        settings: {
          general: {
            persona_name: personaName,
            max_unrelated_answers: maxUnrelatedAnswers,
            intro_message: introMessage,
            success_message: successMessage,
          },
          generator: {
            custom_instructions: generatorInstructions,
          },
          planning: {
            schedule_days_ahead: scheduleDaysAhead,
            schedule_start_offset: scheduleStartOffset,
            planning_mode: schedulingOption,
          },
          interview: {
            require_consent: consentEnabled,
          },
          escalation: {
            allow_escalation: escalationEnabled,
          },
          publishing: {
            auto_generate: autoGenerate,
            require_review: requireReview,
            default_channels: defaultChannels,
          },
        },
      });
      toast.success('Instellingen opgeslagen');
      router.refresh();
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Opslaan mislukt. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  }, [
    router,
    personaName,
    maxUnrelatedAnswers,
    scheduleDaysAhead,
    scheduleStartOffset,
    schedulingOption,
    introMessage,
    successMessage,
    consentEnabled,
    escalationEnabled,
    requireReview,
    defaultChannels,
    autoGenerate,
    generatorInstructions,
  ]);

  const sidebar = (
    <div className="flex flex-col h-full py-4">
      <div className="px-2 space-y-1">
        <NavItem
          icon={SlidersHorizontal}
          label="Algemeen"
          active={activeSection === 'algemeen'}
          onClick={() => setActiveSection('algemeen')}
          testId="settings-algemeen"
        />
        <NavItem
          icon={Mic}
          label="Voice"
          active={activeSection === 'voice'}
          onClick={() => setActiveSection('voice')}
          testId="settings-voice"
        />
        <NavItem
          icon={Calendar}
          label="Planning"
          active={activeSection === 'planning'}
          onClick={() => setActiveSection('planning')}
          testId="settings-planning"
        />
        <NavItem
          icon={Phone}
          label="Escalatie"
          active={activeSection === 'escalatie'}
          onClick={() => setActiveSection('escalatie')}
          testId="settings-escalatie"
        />
        <NavItem
          icon={Briefcase}
          label="Interview Generator"
          active={activeSection === 'generator'}
          onClick={() => setActiveSection('generator')}
          testId="settings-generator"
        />
        <NavItem
          icon={ListOrdered}
          label="Interview"
          active={activeSection === 'interview'}
          onClick={() => setActiveSection('interview')}
          testId="settings-interview"
        />
        <NavItem
          icon={PanelTop}
          label="Sollicitatie popup"
          active={activeSection === 'popup'}
          onClick={() => setActiveSection('popup')}
          testId="settings-popup"
        />
      </div>
    </div>
  );

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link
              href="/pre-screening"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Instellingen</h1>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-500 hover:bg-blue-600">
            <Save className="w-4 h-4" />
            {isSaving ? 'Bewaren...' : 'Bewaren'}
          </Button>
        </div>
      </PageLayoutHeader>
      <PageLayoutContent
        sidebar={sidebar}
        sidebarPosition="left"
        sidebarWidth="w-64"
        sidebarClassName="bg-gray-50/50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Instellingen laden...</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-red-500">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-500 hover:underline text-sm"
            >
              Opnieuw proberen
            </button>
          </div>
        ) : (
        <div className="max-w-2xl space-y-8">
          {/* ── Generator ── */}
          {activeSection === 'generator' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Interview Generator</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Extra instructies die de AI-agent meekrijgt bij het genereren van interviewvragen.
                  Gebruik dit om sector-specifieke richtlijnen, bedrijfsregels of specifieke vraagstijlen mee te geven.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="generator-instructions" className="text-sm font-medium text-gray-700">
                  Extra instructies
                </Label>
                <textarea
                  id="generator-instructions"
                  value={generatorInstructions}
                  onChange={(e) => setGeneratorInstructions(e.target.value)}
                  rows={12}
                  placeholder="Bijv: Stel altijd een vraag over ervaring met heftrucks. Gebruik een informele toon. Vermijd vragen over leeftijd."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y font-mono"
                />
                <p className="text-xs text-gray-400">
                  Ondersteunt markdown. Deze instructies worden aan elke nieuwe interviewgeneratie meegegeven.
                </p>
              </div>

              <section className="rounded-xl bg-gray-50 border border-gray-200 p-5">
                <h3 className="font-medium text-gray-900 mb-2">Voorbeelden</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Stel altijd een vraag over beschikbaarheid voor weekendwerk</li>
                  <li>Gebruik een informele, vlotte toon — geen formeel taalgebruik</li>
                  <li>Focus op praktijkervaring, niet op diploma&apos;s</li>
                  <li>Voeg altijd een vraag toe over talenkennis (NL/FR/EN)</li>
                </ul>
              </section>
            </section>
          )}

          {/* ── Voice ── */}
          {activeSection === 'voice' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Selecteer stem</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Kies een stem voor je AI-agent
                </p>
              </div>

              {isVoiceLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Voice instellingen laden...</div>
                </div>
              ) : (
                <Popover open={voiceSelectOpen} onOpenChange={setVoiceSelectOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {selectedVoiceData?.avatar ? (
                          <Image
                            src={selectedVoiceData.avatar}
                            alt={selectedVoiceData.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedVoiceData?.gender === 'female'
                                ? 'bg-gradient-to-br from-pink-400 to-purple-500'
                                : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                            }`}
                          >
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900">{selectedVoiceData?.name}</span>
                          <p className="text-sm text-gray-500">{selectedVoiceData?.description}</p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                    <div className="space-y-1">
                      {VOICE_OPTIONS.map((voice) => (
                        <button
                          key={voice.id}
                          type="button"
                          onClick={() => {
                            handleSelectVoice(voice.id);
                            setVoiceSelectOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                            selectedVoice === voice.id
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {voice.avatar ? (
                            <Image
                              src={voice.avatar}
                              alt={voice.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                voice.gender === 'female'
                                  ? 'bg-gradient-to-br from-pink-400 to-purple-500'
                                  : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                              }`}
                            >
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{voice.name}</span>
                            <p className="text-sm text-gray-500">{voice.description}</p>
                          </div>
                          {selectedVoice === voice.id && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </section>
          )}

          {/* ── Algemeen ── */}
          {activeSection === 'algemeen' && (
            <>
              {/* Assistant Name */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Assistent</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    De naam van de virtuele assistent zoals kandidaten deze zien
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex-1">
                    <Label htmlFor="persona-name" className="font-medium text-gray-900">Naam assistent</Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Wordt gebruikt in de sollicitatie popup en voice gesprekken
                    </p>
                  </div>
                  <input
                    id="persona-name"
                    type="text"
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                    placeholder="Anna"
                    className="w-48 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </section>

              {/* Exit Thresholds */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Exit drempels</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configureer wanneer het gesprek wordt beëindigd
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium text-gray-900">Max irrelevante antwoorden</Label>
                        {maxUnrelatedAnswers === 2 && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">optimaal</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Beëindig het gesprek na dit aantal irrelevante antwoorden
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setMaxUnrelatedAnswers(Math.max(1, maxUnrelatedAnswers - 1))}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{maxUnrelatedAnswers}</span>
                      <button
                        onClick={() => setMaxUnrelatedAnswers(Math.min(10, maxUnrelatedAnswers + 1))}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Consent Recording */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Opname toestemming</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Vraag toestemming aan de kandidaat om het gesprek op te nemen voor kwaliteitsdoeleinden
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex-1">
                      <Label className="font-medium text-gray-900">Toestemming vragen</Label>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Aan het begin van het gesprek wordt toestemming gevraagd voor opname
                      </p>
                    </div>
                    <Switch
                      checked={consentEnabled}
                      onCheckedChange={setConsentEnabled}
                    />
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      consentEnabled ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-3">
                      <div>
                        <Label className="font-medium text-gray-900">Toestemmingsbericht</Label>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Dit bericht wordt voorgelezen aan het begin van het gesprek
                        </p>
                      </div>

                      {editingConsent ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempConsent}
                            onChange={(e) => setTempConsent(e.target.value)}
                            rows={2}
                            autoFocus
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={handleCancelConsent}
                              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleSaveConsent}
                              className="p-1.5 rounded-md text-teal-600 hover:text-teal-700 hover:bg-gray-50 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="rounded-lg bg-gray-50 p-3 flex items-start gap-3 group cursor-pointer hover:bg-white transition-colors"
                          onClick={() => {
                            setTempConsent(consentMessage);
                            setEditingConsent(true);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-brand-dark-blue flex items-center justify-center shrink-0">
                            <Mic className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">&quot;{consentMessage}&quot;</p>
                          </div>
                          <button
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTempConsent(consentMessage);
                              setEditingConsent(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Review & Publish */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Review & publicatie</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Bepaal hoe pre-screenings worden goedgekeurd en gepubliceerd
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Auto Generate */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium text-gray-900">Automatisch genereren</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[260px]">
                            Indien ingeschakeld wordt elke vacature die vanuit het ATS wordt geïmporteerd automatisch omgezet naar een pre-screening. Pre-screenings kunnen altijd later worden aangepast.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Genereer automatisch pre-screening vragen voor nieuwe vacatures
                      </p>
                    </div>
                    <Switch
                      checked={autoGenerate}
                      onCheckedChange={setAutoGenerate}
                    />
                  </div>

                  {/* Require Review */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium text-gray-900">Review vereisen</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[260px]">
                            Indien ingeschakeld wordt elke pre-screening eerst ter review aangeboden aan de manager, ook bij een positief verdict. Een negatief verdict vereist altijd review.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Stuur alle resultaten ter goedkeuring naar de manager
                      </p>
                    </div>
                    <Switch
                      checked={requireReview}
                      onCheckedChange={setRequireReview}
                    />
                  </div>

                  {/* Default Channels */}
                  <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Label className="font-medium text-gray-900">Standaard kanalen</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[260px]">
                            Kanalen die standaard worden ingeschakeld wanneer een pre-screening automatisch wordt gepubliceerd.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Selecteer welke kanalen standaard actief zijn bij publicatie
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={defaultChannels.voice}
                          onCheckedChange={(checked) => setDefaultChannels(prev => ({ ...prev, voice: checked }))}
                        />
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-sm text-gray-700">Voice</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={defaultChannels.whatsapp}
                          onCheckedChange={(checked) => setDefaultChannels(prev => ({ ...prev, whatsapp: checked }))}
                        />
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-sm text-gray-700">WhatsApp</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={defaultChannels.cv}
                          onCheckedChange={(checked) => setDefaultChannels(prev => ({ ...prev, cv: checked }))}
                        />
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-sm text-gray-700">CV</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ── Planning ── */}
          {activeSection === 'planning' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Planning</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configureer de beschikbare planning slots
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium text-gray-900">Dagen vooruit</Label>
                      {scheduleDaysAhead === 3 && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">optimaal</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Hoeveel dagen aan slots worden getoond
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setScheduleDaysAhead(Math.max(1, scheduleDaysAhead - 1))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{scheduleDaysAhead}</span>
                    <button
                      onClick={() => setScheduleDaysAhead(Math.min(14, scheduleDaysAhead + 1))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium text-gray-900">Start offset</Label>
                      {scheduleStartOffset === 1 && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">optimaal</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Start vanaf X dagen in de toekomst
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setScheduleStartOffset(Math.max(0, scheduleStartOffset - 1))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{scheduleStartOffset}</span>
                    <button
                      onClick={() => setScheduleStartOffset(Math.min(14, scheduleStartOffset + 1))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Escalatie ── */}
          {activeSection === 'escalatie' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Escalatie naar mens</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sta kandidaten toe om doorverbonden te worden met een medewerker
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex-1">
                    <Label className="font-medium text-gray-900">Escalatie toestaan</Label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Kandidaat kan tijdens het gesprek vragen om een mens
                    </p>
                  </div>
                  <Switch
                    checked={escalationEnabled}
                    onCheckedChange={setEscalationEnabled}
                  />
                </div>

                <div
                  className={`space-y-3 overflow-hidden transition-all duration-300 ${
                    escalationEnabled ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-4">
                    <div>
                      <Label className="font-medium text-gray-900">Beschikbaarheid</Label>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Op welke dagen en tijden kan er geëscaleerd worden
                      </p>
                    </div>

                    <div className="flex gap-1.5">
                      {allDays.map(day => (
                        <button
                          key={day}
                          onClick={() => toggleEscalationDay(day)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium capitalize transition-colors ${
                            escalationDays.includes(day)
                              ? 'bg-amber-500 text-white border border-amber-500'
                              : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-white'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">Van</label>
                        <input
                          type="time"
                          value={escalationStartTime}
                          onChange={(e) => setEscalationStartTime(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                      <span className="text-gray-300">—</span>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">Tot</label>
                        <input
                          type="time"
                          value={escalationEndTime}
                          onChange={(e) => setEscalationEndTime(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-3">
                    <div>
                      <Label className="font-medium text-gray-900">Telefoonnummer</Label>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Naar welk nummer wordt doorverbonden
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setEscalationPhoneMode('auto')}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          escalationPhoneMode === 'auto'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${escalationPhoneMode === 'auto' ? 'text-amber-700' : 'text-gray-900'}`}>
                            Automatisch
                          </p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px]">
                              Het telefoonnummer van de contactpersoon gekoppeld aan de vacature wordt gebruikt
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-gray-500">
                          Gebruik het nummer van de contactpersoon op de vacature
                        </p>
                      </button>

                      <button
                        onClick={() => setEscalationPhoneMode('custom')}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          escalationPhoneMode === 'custom'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <p className={`text-sm font-medium ${escalationPhoneMode === 'custom' ? 'text-amber-700' : 'text-gray-900'}`}>
                          Handmatig
                        </p>
                        <p className="text-xs text-gray-500">
                          Vul een specifiek telefoonnummer in
                        </p>
                      </button>

                      {escalationPhoneMode === 'custom' && (
                        <div className="pt-1">
                          <input
                            type="tel"
                            value={escalationCustomPhone}
                            onChange={(e) => setEscalationCustomPhone(e.target.value)}
                            placeholder="+31 6 12345678"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Interview ── */}
          {activeSection === 'interview' && (
            <>
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Interview outline</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    De volgorde en inhoud van het pre-screening gesprek
                  </p>
                </div>

                <Timeline>
                  {/* Intro & Hello - Editable */}
                  <TimelineNode animationDelay={0}>
                    {editingIntro ? (
                      <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-dark-blue flex items-center justify-center shrink-0">
                            <MessageCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">Intro & begroeting</p>
                          </div>
                        </div>
                        <textarea
                          value={tempIntro}
                          onChange={(e) => setTempIntro(e.target.value)}
                          rows={2}
                          autoFocus
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleCancelIntro}
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleSaveIntro}
                            className="p-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:bg-gray-50 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-lg bg-gray-50 p-3 flex items-start gap-3 group cursor-pointer hover:bg-white transition-colors"
                        onClick={() => {
                          setTempIntro(introMessage);
                          setEditingIntro(true);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-dark-blue flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">Intro & begroeting</p>
                          <p className="text-xs text-gray-500 mt-0.5">{introMessage}</p>
                        </div>
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempIntro(introMessage);
                            setEditingIntro(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </TimelineNode>

                  {/* Knockout Questions - Not editable */}
                  <TimelineNode animationDelay={80}>
                    <div className="rounded-lg bg-gray-50 p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-dark-blue flex items-center justify-center">
                        <ShieldQuestion className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Knockout vragen</p>
                        <p className="text-xs text-gray-500">Gebaseerd op vacature</p>
                      </div>
                    </div>
                  </TimelineNode>

                  {/* Open Questions - Not editable */}
                  <TimelineNode animationDelay={160}>
                    <div className="rounded-lg bg-gray-50 p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-dark-blue flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Open vragen</p>
                        <p className="text-xs text-gray-500">Gebaseerd op vacature</p>
                      </div>
                    </div>
                  </TimelineNode>

                  {/* Planning - Select option */}
                  <TimelineNode animationDelay={240} alignDot="top">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-dark-blue flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Planning</p>
                          <p className="text-xs text-gray-500">Hoe worden slots aangeboden</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSchedulingOption('funnel')}
                          className={`w-full p-3 rounded-lg border text-left transition-colors ${
                            schedulingOption === 'funnel'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <p className={`text-sm font-medium ${schedulingOption === 'funnel' ? 'text-purple-700' : 'text-gray-900'}`}>
                            Trechter flow
                          </p>
                          <p className="text-xs text-gray-500">
                            Stap voor stap: eerst dag kiezen, dan tijdslot
                          </p>
                        </button>
                        <button
                          onClick={() => setSchedulingOption('direct')}
                          className={`w-full p-3 rounded-lg border text-left transition-colors ${
                            schedulingOption === 'direct'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <p className={`text-sm font-medium ${schedulingOption === 'direct' ? 'text-purple-700' : 'text-gray-900'}`}>
                            Direct aanbieden
                          </p>
                          <p className="text-xs text-gray-500">
                            Alle beschikbare slots in één overzicht
                          </p>
                        </button>
                      </div>
                    </div>
                  </TimelineNode>

                  {/* Success message - Editable */}
                  <TimelineNode animationDelay={320} dotColor="green" isLast>
                    {editingSuccess ? (
                      <div className="rounded-lg border border-green-300 bg-green-50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">Succes bericht</p>
                          </div>
                        </div>
                        <textarea
                          value={tempSuccess}
                          onChange={(e) => setTempSuccess(e.target.value)}
                          rows={2}
                          autoFocus
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleCancelSuccess}
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleSaveSuccess}
                            className="p-1.5 rounded-md text-green-600 hover:text-green-700 hover:bg-gray-50 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-lg bg-green-50 border border-green-100 p-3 flex items-start gap-3 group cursor-pointer hover:bg-white transition-colors"
                        onClick={() => {
                          setTempSuccess(successMessage);
                          setEditingSuccess(true);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">Succes bericht</p>
                          <p className="text-xs text-gray-600 mt-0.5">&quot;{successMessage}&quot;</p>
                        </div>
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempSuccess(successMessage);
                            setEditingSuccess(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </TimelineNode>
                </Timeline>
              </section>
            </>
          )}

          {/* ── Sollicitatie Popup ── */}
          {activeSection === 'popup' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sollicitatie popup</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Beheer de teksten en content van de sollicitatie popup op de vacaturepagina.
                  De content wordt in YAML-formaat beheerd.
                </p>
              </div>

              {/* Variables */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Variabelen</h3>
                <p className="text-xs text-gray-500">
                  Deze variabelen worden automatisch ingevuld in de popup content via {'{'}variabele{'}'} placeholders.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="popup-privacy" className="text-sm text-gray-700">Privacy policy URL</Label>
                  <input
                    id="popup-privacy"
                    type="url"
                    value={popupVariables.privacy_url || ''}
                    onChange={(e) => setPopupVariables(prev => ({ ...prev, privacy_url: e.target.value }))}
                    placeholder="https://example.com/privacy"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* YAML Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="popup-yaml" className="text-sm font-medium text-gray-900">
                    Content (YAML)
                  </Label>
                  {popupVersion > 0 && (
                    <span className="text-xs text-gray-400">versie {popupVersion}</span>
                  )}
                </div>
                <textarea
                  id="popup-yaml"
                  value={popupYaml}
                  onChange={(e) => setPopupYaml(e.target.value)}
                  rows={24}
                  spellCheck={false}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y font-mono leading-relaxed"
                />
                <p className="text-xs text-gray-400">
                  Gebruik {'{'}persona_name{'}'} en {'{'}privacy_url{'}'} als placeholders. De YAML syntax wordt gevalideerd bij opslaan.
                </p>
              </div>

              {/* Save button for popup (separate from main save) */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  onClick={handleSavePopup}
                  disabled={isPopupSaving}
                  className="gap-2 bg-blue-500 hover:bg-blue-600"
                >
                  <Save className="w-4 h-4" />
                  {isPopupSaving ? 'Bewaren...' : 'Popup content bewaren'}
                </Button>
              </div>

              {/* Info */}
              <section className="rounded-xl bg-gray-50 border border-gray-200 p-5">
                <h3 className="font-medium text-gray-900 mb-2">Over de sollicitatie popup</h3>
                <p className="text-sm text-gray-600">
                  De popup verschijnt op de vacaturepagina en biedt kandidaten twee opties:
                  bellen met de virtuele assistent (voice) of klassiek solliciteren met CV.
                  De content is opgebouwd uit drie schermen: keuzescherm, telefoonformulier en CV-formulier.
                </p>
              </section>
            </section>
          )}
        </div>
        )}
      </PageLayoutContent>
    </PageLayout>
  );
}
