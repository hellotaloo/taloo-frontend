'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar, MessageCircle, CheckCircle2, ShieldQuestion, MessageSquare, Pencil, Check, X, Phone, Info, Mic, SlidersHorizontal, ListOrdered } from 'lucide-react';
import Link from 'next/link';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Timeline, TimelineNode } from '@/components/kit/timeline';
import { NavItem } from '@/components/kit/nav-item';

type SettingsSection = 'algemeen' | 'planning' | 'escalatie' | 'interview';

export default function PreScreeningSettingsPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('algemeen');

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

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Simulate API save
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    router.push('/pre-screening');
  }, [router]);

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
          icon={ListOrdered}
          label="Interview"
          active={activeSection === 'interview'}
          onClick={() => setActiveSection('interview')}
          testId="settings-interview"
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
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
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
        <div className="max-w-2xl space-y-8">
          {/* ── Algemeen ── */}
          {activeSection === 'algemeen' && (
            <>
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
                              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleSaveConsent}
                              className="p-1.5 rounded-md text-teal-600 hover:text-teal-700 hover:bg-teal-100 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="rounded-lg bg-gray-50 p-3 flex items-start gap-3 group cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setTempConsent(consentMessage);
                            setEditingConsent(true);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                            <Mic className="w-4 h-4 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">&quot;{consentMessage}&quot;</p>
                          </div>
                          <button
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all shrink-0"
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
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'
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
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
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
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleSaveIntro}
                            className="p-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-lg bg-gray-100 p-3 flex items-start gap-3 group cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setTempIntro(introMessage);
                          setEditingIntro(true);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">Intro & begroeting</p>
                          <p className="text-xs text-gray-500 mt-0.5">{introMessage}</p>
                        </div>
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all shrink-0"
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
                    <div className="rounded-lg bg-gray-100 p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <ShieldQuestion className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Knockout vragen</p>
                        <p className="text-xs text-gray-500">Gebaseerd op vacature</p>
                      </div>
                    </div>
                  </TimelineNode>

                  {/* Open Questions - Not editable */}
                  <TimelineNode animationDelay={160}>
                    <div className="rounded-lg bg-gray-100 p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-orange-600" />
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
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-purple-600" />
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
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
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
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleSaveSuccess}
                            className="p-1.5 rounded-md text-green-600 hover:text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-lg bg-green-50 border border-green-100 p-3 flex items-start gap-3 group cursor-pointer hover:bg-green-100/50 transition-colors"
                        onClick={() => {
                          setTempSuccess(successMessage);
                          setEditingSuccess(true);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">Succes bericht</p>
                          <p className="text-xs text-gray-600 mt-0.5">&quot;{successMessage}&quot;</p>
                        </div>
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-green-200 opacity-0 group-hover:opacity-100 transition-all shrink-0"
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

              {/* Info Section */}
              <section className="rounded-xl bg-blue-50 border border-blue-100 p-5">
                <h3 className="font-medium text-gray-900 mb-2">Over Pre-screening</h3>
                <p className="text-sm text-gray-600">
                  De pre-screening agent voert eerste gesprekken met kandidaten. Het gesprek volgt de
                  interview outline hierboven. De knockout en open vragen worden automatisch overgenomen
                  uit de interview configuratie van de vacature.
                </p>
              </section>
            </>
          )}
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
