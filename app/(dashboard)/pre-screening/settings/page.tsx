'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar, MessageCircle, CheckCircle2, ShieldQuestion, MessageSquare, Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Timeline, TimelineNode } from '@/components/kit/timeline';

export default function PreScreeningSettingsPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Exit thresholds
  const [maxUnrelatedAnswers, setMaxUnrelatedAnswers] = useState(2);

  // Scheduling
  const [scheduleDaysAhead, setScheduleDaysAhead] = useState(3);
  const [scheduleStartOffset, setScheduleStartOffset] = useState(1);

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
            <h1 className="text-lg font-semibold text-gray-900">Pre-screening instellingen</h1>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-500 hover:bg-blue-600">
            <Save className="w-4 h-4" />
            {isSaving ? 'Bewaren...' : 'Bewaren'}
          </Button>
        </div>
      </PageLayoutHeader>
      <PageLayoutContent>
        <div className="space-y-8 max-w-2xl">
          {/* Exit Thresholds Section */}
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

          {/* Scheduling Section */}
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

          {/* Interview Outline Section */}
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
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
