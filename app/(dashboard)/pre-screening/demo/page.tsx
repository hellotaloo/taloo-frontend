'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronDown, Check, User, UserCheck, Phone, MessageCircle, CheckCircle, RotateCcw, AlertTriangle, Globe, MapPin, Briefcase, ListChecks, BarChart3, PhoneForwarded, ShieldCheck, ShieldOff, PhoneOff, X, HelpCircle } from 'lucide-react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { IPhoneMockup, WhatsAppChat, type ChatScenario, VoiceCallMockup, type CallState } from '@/components/blocks/phone-simulator';
import { type VoiceOption } from '@/components/blocks/voice-settings';
import { SolliciteerDialog } from '@/components/blocks/channel-management';
import { InterviewQuestionsPanel, type GeneratedQuestion } from '@/components/blocks/interview-editor';
import { InterviewAnalyticsPanel } from '@/components/blocks/interview-analytics';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getPreScreeningVacancies, getPreScreening, getVacancy } from '@/lib/interview-api';
import { usePlaygroundSession } from '@/hooks/use-playground-session';
import type { Vacancy, AgentVacancy } from '@/lib/types';

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'liv',
    name: 'Liv',
    description: 'Warm en professioneel',
    gender: 'female',
    voiceId: 'ANHrhmaFeVN0QJaa0PhL',
    avatar: '/avatars/large/female_6.png',
  },
  {
    id: 'bob',
    name: 'Bob',
    description: 'Zelfverzekerd en helder',
    gender: 'male',
    avatar: '/avatars/large/male_2.png',
    voiceId: 's7Z6uboUuE4Nd8Q2nye6',
  },
  {
    id: 'louise',
    name: 'Louise',
    description: 'Vriendelijk en natuurlijk',
    gender: 'female',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',
    avatar: '/avatars/large/female_1.png',
  },
  {
    id: 'luc',
    name: 'Luc',
    description: 'Energiek en vriendelijk',
    gender: 'male',
    avatar: '/avatars/large/male_1.png',
  },
];


type CandidateContext = 'unknown' | 'known' | 'known_with_vacancy' | 'blocked';

// Compute a weekday +3 days from now for the "active vacancy" scenario
function getNextWeekday3Days(): { short: string; full: string } {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() + 1); // Sun → Mon
  if (day === 6) date.setDate(date.getDate() + 2); // Sat → Mon
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const monthsShort = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return {
    short: `${date.getDate()} ${monthsShort[date.getMonth()]}`,
    full: `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} om 10 uur`,
  };
}

const BOOKING_DATE = getNextWeekday3Days();

const CANDIDATE_CONTEXT_OPTIONS: { id: CandidateContext; label: string; description: string; candidateName: string; icon: typeof User; iconBg: string }[] = [
  { id: 'unknown', label: 'Onbekende kandidaat', description: 'Nieuw persoon, geen data bekend', candidateName: 'Onbekende beller', icon: HelpCircle, iconBg: 'bg-gray-500' },
  { id: 'known', label: 'Bekende kandidaat', description: 'Werkvergunning al gevalideerd, wordt overgeslagen', candidateName: 'Jan de Vries', icon: UserCheck, iconBg: 'bg-sky-600' },
  { id: 'known_with_vacancy', label: 'Kandidaat met actieve vacature', description: `Interview bij zelfde opdrachtgever op ${BOOKING_DATE.short}`, candidateName: 'Sophie Bakker', icon: Briefcase, iconBg: 'bg-emerald-600' },
  { id: 'blocked', label: 'Geblokkeerde kandidaat', description: 'Kandidaat staat op de blokkeerlijst', candidateName: 'Geblokkeerd Persoon', icon: ShieldOff, iconBg: 'bg-red-600' },
];

type StartAgent = 'greeting' | 'screening' | 'open_questions' | 'scheduling';

const START_AGENT_OPTIONS: { id: StartAgent; label: string; description: string }[] = [
  { id: 'greeting', label: 'Welkom', description: 'Start bij de begroeting' },
  { id: 'screening', label: 'Knockout-vragen', description: 'Start bij de screeningvragen' },
  { id: 'open_questions', label: 'Kwalificatievragen', description: 'Start bij de open vragen' },
  { id: 'scheduling', label: 'Inplannen interview', description: 'Start bij het inplannen' },
];

export default function PreScreeningDemoPage() {
  // Voice selection
  const [selectedVoice, setSelectedVoice] = useState('liv');
  const [voiceSelectOpen, setVoiceSelectOpen] = useState(false);
  const selectedVoiceData = VOICE_OPTIONS.find(v => v.id === selectedVoice);

  // Vacancy selection (dynamic)
  const [vacancies, setVacancies] = useState<AgentVacancy[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState<string | null>(null);
  const [vacancySelectOpen, setVacancySelectOpen] = useState(false);
  const selectedVacancyData = vacancies.find(v => v.id === selectedVacancy);

  // Pre-screening questions (loaded per vacancy)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Full vacancy detail (for description etc.)
  const [vacancyDetail, setVacancyDetail] = useState<Vacancy | null>(null);

  // Fetch vacancies with published pre-screenings (for playground)
  useEffect(() => {
    async function fetchVacancies() {
      try {
        setVacanciesLoading(true);
        const data = await getPreScreeningVacancies();
        const published = data.vacancies.filter(v => v.agent_status === 'published');
        setVacancies(published);
        if (published.length > 0) {
          setSelectedVacancy(published[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch vacancies:', err);
      } finally {
        setVacanciesLoading(false);
      }
    }
    fetchVacancies();
  }, []);

  // Fetch pre-screening questions when selected vacancy changes
  useEffect(() => {
    if (!selectedVacancy) {
      setQuestions([]);
      return;
    }
    async function fetchQuestions() {
      try {
        setQuestionsLoading(true);
        const preScreening = await getPreScreening(selectedVacancy!);
        if (preScreening) {
          const mapped: GeneratedQuestion[] = [
            ...preScreening.knockout_questions.map(q => ({
              id: q.id,
              text: q.question_text,
              type: 'knockout' as const,
              idealAnswer: q.ideal_answer,
            })),
            ...preScreening.qualification_questions.map(q => ({
              id: q.id,
              text: q.question_text,
              type: 'qualifying' as const,
              idealAnswer: q.ideal_answer,
            })),
          ];
          setQuestions(mapped);
        } else {
          setQuestions([]);
        }
      } catch (err) {
        console.error('Failed to fetch pre-screening:', err);
        setQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    }
    fetchQuestions();
  }, [selectedVacancy]);

  // Fetch full vacancy detail when selected vacancy changes
  useEffect(() => {
    if (!selectedVacancy) {
      setVacancyDetail(null);
      return;
    }
    async function fetchVacancyDetail() {
      try {
        const data = await getVacancy(selectedVacancy!);
        setVacancyDetail(data);
      } catch (err) {
        console.error('Failed to fetch vacancy detail:', err);
        setVacancyDetail(null);
      }
    }
    fetchVacancyDetail();
  }, [selectedVacancy]);

  // Candidate context
  const [candidateContext, setCandidateContext] = useState<CandidateContext>('unknown');
  const [candidateContextOpen, setCandidateContextOpen] = useState(false);
  const selectedCandidateContextData = CANDIDATE_CONTEXT_OPTIONS.find(c => c.id === candidateContext)!;

  // Start agent
  const [startAgent, setStartAgent] = useState<StartAgent>('greeting');
  const [startAgentOpen, setStartAgentOpen] = useState(false);
  const selectedStartAgentData = START_AGENT_OPTIONS.find(a => a.id === startAgent);

  // Flags
  const [allowEscalation, setAllowEscalation] = useState(true);
  const [askConsent, setAskConsent] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [allowInterruption, setAllowInterruption] = useState(false);

  // Trigger interview dialog
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);

  // Phone simulator
  const [simulatorChannel, setSimulatorChannel] = useState<'whatsapp' | 'voice' | 'website' | 'questions' | 'analytics'>('voice');
  const [chatScenario, setChatScenario] = useState<ChatScenario>('manual');
  const [chatResetKey, setChatResetKey] = useState(0);

  // LiveKit playground session
  const {
    startSession,
    endSession,
    toggleMute,
    connectionState,
    isMuted: isSessionMuted,
    isSpeaking,
    isUserSpeaking,
    error: sessionError,
    resetError: resetSessionError,
  } = usePlaygroundSession();

  // Simulated incoming call state (for outbound call flow)
  const [isSimulatedRinging, setIsSimulatedRinging] = useState(false);

  // Derive CallState from LiveKit connection state (simulated ringing takes priority)
  const callState: CallState =
    isSimulatedRinging ? 'ringing' :
    connectionState === 'connecting' ? 'ringing' :
    connectionState === 'connected' ? 'active' :
    connectionState === 'disconnected' ? 'ended' :
    'idle';

  const isSessionActive = connectionState === 'connecting' || connectionState === 'connected';

  // macOS call notification
  const [showCallNotification, setShowCallNotification] = useState(false);

  // Simulate incoming call — shows ringing UI, user must accept
  const handleSimulateIncomingCall = () => {
    console.log('[Demo] handleSimulateIncomingCall called');
    new Audio('/phone-beep.mp3').play().catch(() => {});
    setIsSimulatedRinging(true);
  };

  const handleStartCall = useCallback(async () => {
    console.log('[Demo] handleStartCall called, selectedVacancy:', selectedVacancy);
    if (!selectedVacancy) {
      console.warn('[Demo] BLOCKED: no selectedVacancy');
      return;
    }

    // Play beep sound (fire-and-forget — must not block the API call)
    new Audio('/phone-beep.mp3').play().catch(() => {});

    const isKnown = candidateContext === 'known' || candidateContext === 'known_with_vacancy';

    console.log('[Demo] Calling startSession...');
    await startSession({
      vacancy_id: selectedVacancy,
      candidate_name: selectedCandidateContextData.candidateName,
      persona_name: selectedVoiceData?.name ?? 'Anna',
      start_agent: startAgent,
      require_consent: askConsent,
      candidate_known: isKnown,
      allow_escalation: allowEscalation,
      voice_id: selectedVoiceData?.voiceId,
      known_answers: isKnown ? { ko_1: 'ja' } : undefined,
      existing_booking_date: candidateContext === 'known_with_vacancy' ? BOOKING_DATE.full : undefined,
    });
  }, [startSession, selectedVacancy, selectedCandidateContextData, startAgent, askConsent, candidateContext, allowEscalation, selectedVoiceData]);

  const handleCallStateChange = useCallback((state: CallState) => {
    if (isSimulatedRinging) {
      setIsSimulatedRinging(false);
      if (state === 'active') {
        // User accepted — start the real LiveKit session
        handleStartCall();
      }
      return;
    }
    if (state === 'ended') {
      endSession();
      setShowCallNotification(false);
    }
    if (state === 'ringing') {
      setShowCallNotification(true);
    }
  }, [endSession, isSimulatedRinging, handleStartCall]);

  // Auto-dismiss notification after 8 seconds
  useEffect(() => {
    if (!showCallNotification) return;
    const timer = setTimeout(() => setShowCallNotification(false), 8000);
    return () => clearTimeout(timer);
  }, [showCallNotification]);

  if (vacanciesLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-40px)]">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="ml-2 text-gray-500">Vacatures laden...</span>
      </div>
    );
  }

  if (!vacanciesLoading && vacancies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-40px)] gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-medium">No vacancies found</p>
          <p className="text-sm text-gray-500 mt-1">Please import or create vacancies first.</p>
        </div>
        <Link
          href="/pre-screening"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar pre-screening
        </Link>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center gap-3">
          <Link
            href="/pre-screening"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Playground</h1>
        </div>
      </PageLayoutHeader>
      <PageLayoutContent contentClassName="!p-0">
        <div className="flex h-full">
          {/* Left panel — Controls */}
          <div className="w-[480px] shrink-0 border-r border-gray-200 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-6 space-y-8">
            {/* Error banner */}
            {sessionError && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 flex-1">{sessionError}</p>
                <button
                  onClick={resetSessionError}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Voice Selection */}
            <section className={cn("space-y-3", isSessionActive && "opacity-50 pointer-events-none")}>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Selecteer stem</h2>
                <p className="text-xs text-gray-500 mt-0.5">Kies een stem voor de demo</p>
              </div>

              <Popover open={voiceSelectOpen} onOpenChange={setVoiceSelectOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors text-left"
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
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            selectedVoiceData?.gender === 'female'
                              ? 'bg-gradient-to-br from-pink-400 to-purple-500'
                              : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                          )}
                        >
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{selectedVoiceData?.name}</span>
                        <p className="text-xs text-gray-500">{selectedVoiceData?.description}</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                  <div className="space-y-1">
                    {VOICE_OPTIONS.map((voice) => (
                      <button
                        key={voice.id}
                        type="button"
                        onClick={() => {
                          setSelectedVoice(voice.id);
                          setVoiceSelectOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors',
                          selectedVoice === voice.id
                            ? 'bg-brand-dark-blue/5 border border-brand-dark-blue/30'
                            : 'hover:bg-gray-50'
                        )}
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
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              voice.gender === 'female'
                                ? 'bg-gradient-to-br from-pink-400 to-purple-500'
                                : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                            )}
                          >
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 text-sm">{voice.name}</span>
                          <p className="text-xs text-gray-500">{voice.description}</p>
                        </div>
                        {selectedVoice === voice.id && (
                          <Check className="w-4 h-4 text-brand-dark-blue" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </section>

            {/* Vacancy Selection */}
            <section className={cn("space-y-3", isSessionActive && "opacity-50 pointer-events-none")}>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Selecteer vacature</h2>
                <p className="text-xs text-gray-500 mt-0.5">Kies een vacature voor de demo</p>
              </div>

              {vacanciesLoading ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ) : vacancies.length === 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 text-gray-400">
                  <Briefcase className="w-5 h-5" />
                  <span className="text-sm">Geen vacatures met pre-screening gevonden</span>
                </div>
              ) : (
              <Popover open={vacancySelectOpen} onOpenChange={setVacancySelectOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-dark-blue flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{selectedVacancyData?.title}</span>
                        <p className="text-xs text-gray-500">{selectedVacancyData?.company} · {selectedVacancyData?.location}</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                  <div className="space-y-1 max-h-[280px] overflow-y-auto">
                    {vacancies.map((vacancy) => (
                      <button
                        key={vacancy.id}
                        type="button"
                        onClick={() => {
                          setSelectedVacancy(vacancy.id);
                          setVacancySelectOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors',
                          selectedVacancy === vacancy.id
                            ? 'bg-brand-dark-blue/5 border border-brand-dark-blue/30'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-dark-blue/10 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-brand-dark-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 text-sm block truncate">{vacancy.title}</span>
                          <p className="text-xs text-gray-500">{vacancy.company} · {vacancy.location}</p>
                        </div>
                        {selectedVacancy === vacancy.id && (
                          <Check className="w-4 h-4 text-brand-dark-blue shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              )}
            </section>

            {/* Candidate Context */}
            <section className={cn("space-y-3", isSessionActive && "opacity-50 pointer-events-none")}>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Kandidaat context</h2>
                <p className="text-xs text-gray-500 mt-0.5">Welk type kandidaat belt er in</p>
              </div>

              <Popover open={candidateContextOpen} onOpenChange={setCandidateContextOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", selectedCandidateContextData.iconBg)}>
                        <selectedCandidateContextData.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{selectedCandidateContextData.label}</span>
                        <p className="text-xs text-gray-500">{selectedCandidateContextData.description}</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                  <div className="space-y-1">
                    {CANDIDATE_CONTEXT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setCandidateContext(option.id);
                            setCandidateContextOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors',
                            candidateContext === option.id
                              ? 'bg-brand-dark-blue/5 border border-brand-dark-blue/30'
                              : 'hover:bg-gray-50'
                          )}
                        >
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", option.iconBg)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-900 text-sm block">{option.label}</span>
                            <p className="text-xs text-gray-500">{option.description}</p>
                          </div>
                          {candidateContext === option.id && (
                            <Check className="w-4 h-4 text-brand-dark-blue shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </section>

            {/* Start Agent */}
            <section className={cn("space-y-3", isSessionActive && "opacity-50 pointer-events-none")}>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Start interview bij</h2>
                <p className="text-xs text-gray-500 mt-0.5">Kies bij welke stap het interview begint</p>
              </div>

              <Popover open={startAgentOpen} onOpenChange={setStartAgentOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{selectedStartAgentData?.label}</span>
                        <p className="text-xs text-gray-500">{selectedStartAgentData?.description}</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                  <div className="space-y-1">
                    {START_AGENT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setStartAgent(option.id);
                          setStartAgentOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors',
                          startAgent === option.id
                            ? 'bg-brand-dark-blue/5 border border-brand-dark-blue/30'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 text-sm block">{option.label}</span>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                        {startAgent === option.id && (
                          <Check className="w-4 h-4 text-brand-dark-blue shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </section>

            {/* Flags */}
            <section className={cn("space-y-3", isSessionActive && "opacity-50 pointer-events-none")}>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Opties</h2>
                <p className="text-xs text-gray-500 mt-0.5">Extra instellingen voor de demo</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <PhoneForwarded className="w-4 h-4 text-brand-dark-blue" />
                  <span className="text-sm font-medium text-gray-900">Allow human escalation</span>
                </div>
                <Switch
                  checked={allowEscalation}
                  onCheckedChange={setAllowEscalation}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-dark-blue" />
                  <span className="text-sm font-medium text-gray-900">Ask consent</span>
                </div>
                <Switch
                  checked={askConsent}
                  onCheckedChange={setAskConsent}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-900">Urgente vacature</span>
                </div>
                <Switch
                  checked={isUrgent}
                  onCheckedChange={setIsUrgent}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-brand-dark-blue" />
                  <span className="text-sm font-medium text-gray-900">Allow interruption</span>
                </div>
                <Switch
                  checked={allowInterruption}
                  onCheckedChange={setAllowInterruption}
                />
              </div>
            </section>

            {/* Actions */}
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Acties</h2>
                <p className="text-xs text-gray-500 mt-0.5">Test specifieke acties</p>
              </div>

              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <Image src="/teams.png" alt="Teams" width={20} height={20} className="shrink-0" />
                <span className="text-sm font-medium text-gray-900">Interview booked (teams)</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <Image src="/teams.png" alt="Teams" width={20} height={20} className="shrink-0" />
                <span className="text-sm font-medium text-gray-900">Pre-screening generated (teams)</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <Image src="/teams.png" alt="Teams" width={20} height={20} className="shrink-0" />
                <span className="text-sm font-medium text-gray-900">Pre-screening drop-off warning (teams)</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <Image src="/outlook.png" alt="Outlook" width={20} height={20} className="shrink-0" />
                <span className="text-sm font-medium text-gray-900">Trigger interview slot (outlook)</span>
              </button>
            </section>
          </div>

          {/* Right panel — Phone mockup */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 min-h-0 relative">
            {/* Floating channel toggle */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-between h-[270px] bg-white rounded-full shadow-lg border py-2 px-1.5">
              <button
                onClick={() => setSimulatorChannel('questions')}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  simulatorChannel === 'questions'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-gray-600'
                )}
                title="Interview vragen"
              >
                <ListChecks className="h-4 w-4" />
              </button>
              <div className="w-5 h-px bg-gray-200" />
              <button
                onClick={() => setSimulatorChannel('analytics')}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  simulatorChannel === 'analytics'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-gray-600'
                )}
                title="Analyse"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <div className="w-5 h-px bg-gray-200" />
              <button
                onClick={() => setSimulatorChannel('website')}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  simulatorChannel === 'website'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-gray-600'
                )}
                title="Website simulatie"
              >
                <Globe className="h-4 w-4" />
              </button>
              <div className="w-5 h-px bg-gray-200" />
              <button
                onClick={() => setSimulatorChannel('whatsapp')}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  simulatorChannel === 'whatsapp'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-gray-600'
                )}
                title="WhatsApp simulatie"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <div className="w-5 h-px bg-gray-200" />
              <button
                onClick={() => setSimulatorChannel('voice')}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  simulatorChannel === 'voice'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-gray-600'
                )}
                title="Voice simulatie"
              >
                <Phone className="h-4 w-4" />
              </button>
            </div>

            {simulatorChannel === 'questions' ? (
              <div className="w-full h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-8 py-6">
                <div className="max-w-[720px] mx-auto">
                  {questionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : questions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-12">Geen vragen gevonden voor deze vacature</p>
                  ) : (
                    <InterviewQuestionsPanel
                      questions={questions}
                      readOnly
                    />
                  )}
                </div>
              </div>
            ) : simulatorChannel === 'analytics' ? (
              <div className="w-full h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-8 py-6">
                <div className="max-w-[720px] mx-auto">
                  {selectedVacancy ? (
                    <InterviewAnalyticsPanel questions={questions} vacancyId={selectedVacancy} />
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-12">Selecteer een vacature om de analyse te bekijken</p>
                  )}
                </div>
              </div>
            ) : (
            <div className="flex flex-col items-center" style={{ transform: 'scale(0.75)', transformOrigin: 'center center' }}>
              <IPhoneMockup>
                {simulatorChannel === 'whatsapp' ? (
                  <WhatsAppChat
                    scenario={chatScenario}
                    resetKey={chatResetKey}
                    vacancyId={selectedVacancy ?? undefined}
                    candidateName="Test Kandidaat"
                    isActive
                  />
                ) : simulatorChannel === 'voice' ? (
                  <VoiceCallMockup
                    callerName={selectedVoiceData?.name || 'Bob'}
                    callerSubtitle="Taloo Voice Agent"
                    callerAvatar={selectedVoiceData?.avatar}
                    callState={callState}
                    onStateChange={handleCallStateChange}
                    onCallMe={handleStartCall}
                    isSpeaking={isSpeaking}
                    isUserSpeaking={isUserSpeaking}
                    isMutedExternal={isSessionMuted}
                    onMuteToggle={toggleMute}
                  />
                ) : (
                  /* Website vacancy page mockup */
                  <div className="h-full bg-white flex flex-col">
                    {/* iOS status bar */}
                    <div className="bg-white px-5 pt-2 pb-0.5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-black">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="flex items-end gap-[2px]">
                          <div className="w-[3px] h-[4px] bg-black rounded-[0.5px]" />
                          <div className="w-[3px] h-[6px] bg-black rounded-[0.5px]" />
                          <div className="w-[3px] h-[8px] bg-black rounded-[0.5px]" />
                          <div className="w-[3px] h-[10px] bg-black rounded-[0.5px]" />
                        </div>
                        <span className="text-[11px] font-semibold text-black ml-0.5">5G</span>
                        <div className="w-[22px] h-[10px] border border-black rounded-[2.5px] ml-1 relative">
                          <div className="absolute inset-[1.5px] right-[3px] bg-black rounded-[1px]" />
                          <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-[1.5px] h-[4px] bg-black rounded-r-sm" />
                        </div>
                      </div>
                    </div>
                    {/* Safari URL bar */}
                    <div className="bg-white px-4 pb-2">
                      <div className="bg-gray-50 rounded-xl px-3 py-1.5 flex items-center justify-center gap-1">
                        <svg className="w-[10px] h-[10px] text-gray-500" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a4 4 0 0 0-4 4v3H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4zm2.5 7H5.5V5a2.5 2.5 0 1 1 5 0v3z"/></svg>
                        <span className="text-[12px] text-gray-900 font-medium">{vacancyDetail?.company ? `${vacancyDetail.company.toLowerCase().replace(/\s+/g, '')}.be` : 'vacature.be'}</span>
                      </div>
                    </div>

                    {/* Site header */}
                    <div className="bg-gray-800 px-5 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                        {(vacancyDetail?.company || 'V')[0].toUpperCase()}
                      </div>
                      <span className="text-white font-semibold text-sm">{vacancyDetail?.company || 'Vacature'}</span>
                    </div>

                    {/* Hero image area */}
                    <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
                      <div className="text-center">
                        <Briefcase className="w-8 h-8 text-indigo-300 mx-auto" />
                        <p className="text-indigo-400/60 text-[10px] font-medium mt-1">{vacancyDetail?.company || ''}</p>
                      </div>
                    </div>

                    {/* Job content */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                      <div>
                        <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">Vacature</p>
                        <h2 className="text-lg font-bold text-gray-900 mt-0.5">{vacancyDetail?.title || 'Vacature laden...'}</h2>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {vacancyDetail?.location && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                            <MapPin className="w-3 h-3" />
                            {vacancyDetail.location}
                          </span>
                        )}
                        {vacancyDetail?.company && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                            <Briefcase className="w-3 h-3" />
                            {vacancyDetail.company}
                          </span>
                        )}
                      </div>

                      {vacancyDetail?.description ? (
                        <div>
                          <p className="text-xs font-bold text-gray-900 mb-1.5">Over deze job</p>
                          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                            {vacancyDetail.description}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-xs text-gray-400">Selecteer een vacature om de beschrijving te zien</p>
                        </div>
                      )}
                    </div>

                    {/* Sticky CTA */}
                    <div className="px-5 py-4 border-t border-gray-100 bg-white">
                      <button
                        onClick={() => setShowTriggerDialog(true)}
                        className="w-full py-3 rounded-lg bg-brand-lime-green text-black font-semibold text-sm hover:brightness-95 transition-colors"
                      >
                        Solliciteer nu
                      </button>
                    </div>
                  </div>
                )}
              </IPhoneMockup>

              {/* Scenario controls — Voice outbound call */}
              {simulatorChannel === 'voice' && startAgent === 'greeting' && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={handleStartCall}
                    disabled={callState !== 'idle'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      callState !== 'idle'
                        ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Bel kandidaat
                  </button>
                </div>
              )}

              {/* Scenario controls — WhatsApp only */}
              {simulatorChannel === 'whatsapp' && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => {
                      setChatScenario('manual');
                      setChatResetKey(prev => prev + 1);
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      chatScenario === 'manual'
                        ? 'bg-gray-50 text-gray-800 border border-gray-300'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    Handmatig
                  </button>
                  <button
                    onClick={() => {
                      setChatScenario('pass');
                      setChatResetKey(prev => prev + 1);
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      chatScenario === 'pass'
                        ? 'bg-green-500 text-white border border-green-500'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Auto-antwoord
                  </button>
                  <button
                    onClick={() => setChatResetKey(prev => prev + 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Herstarten
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </PageLayoutContent>

      {/* macOS incoming call notification — rendered via portal to appear above Radix dialog overlays */}
      {showCallNotification && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed top-4 right-4 z-[9999] w-[340px]"
          style={{
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <style>{`
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          <div className="rounded-2xl bg-gray-800/95 backdrop-blur-xl shadow-2xl border border-white/10 p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                  <Phone className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-gray-400 font-medium">FaceTime</span>
              </div>
              <button
                onClick={() => setShowCallNotification(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Caller info */}
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/avatars/large/female_3.png"
                alt="Recruiter"
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover"
              />
              <div>
                <p className="text-white font-semibold text-sm">Sarah De Vries</p>
                <p className="text-gray-400 text-xs">Incoming call · iPhone</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCallNotification(false)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                Decline
              </button>
              <button
                onClick={() => {
                  setShowCallNotification(false);
                  handleCallStateChange('active');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Accept
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <SolliciteerDialog
        open={showTriggerDialog}
        onOpenChange={setShowTriggerDialog}
        vacancyId={selectedVacancy ?? 'demo'}
        vacancyTitle={selectedVacancyData?.title ?? 'Demo Vacature'}
        hasWhatsApp={true}
        hasVoice={true}
        hasCv={true}
        source="test"
        onStartCall={() => {
          setShowCallNotification(true);
        }}
      />
    </PageLayout>
  );
}
