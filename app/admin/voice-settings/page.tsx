'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Save, ChevronDown, Check, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useConversation } from '@elevenlabs/react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { IPhoneMockup, VoiceCallMockup, type CallState } from '@/components/blocks/phone-simulator';
import { type VoiceOption } from '@/components/blocks/voice-settings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { updateElevenLabsAgentConfig, saveElevenLabsVoiceConfig, getElevenLabsVoiceConfig } from '@/lib/api';

const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_DEMO_AGENT_ID || '';
const ELEVENLABS_VOICE_ID_GEERT = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID_GEERT || '';
const ELEVENLABS_VOICE_ID_LUC = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID_LUC || '';

// Voice options with ElevenLabs voice IDs
const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'emma',
    name: 'Emma',
    description: 'Warm and professional',
    gender: 'female',
    voiceId: ELEVENLABS_VOICE_ID_GEERT,
    avatar: '/avatars/large/emma.png',
  },
  {
    id: 'bob',
    name: 'Bob',
    description: 'Confident and clear',
    gender: 'male',
    voiceId: ELEVENLABS_VOICE_ID_GEERT,
    avatar: '/avatars/large/bob.png',
  },
  {
    id: 'luc',
    name: 'Luc',
    description: 'Energetic and friendly',
    gender: 'male',
    voiceId: ELEVENLABS_VOICE_ID_LUC,
    avatar: '/avatars/large/luc.png',
  },
];

// Voice engine options (ElevenLabs model IDs)
const VOICE_ENGINES = [
  {
    id: 'eleven_v3_conversational',
    name: 'Natural Expression',
    description: 'Most expressive, context-aware (70+ languages)',
    badge: 'Alpha',
  },
  {
    id: 'eleven_flash_v2_5',
    name: 'F1',
    description: 'Ultra-low latency ~75ms (32 languages)',
    badge: 'Fastest',
  },
  {
    id: 'eleven_turbo_v2_5',
    name: 'Swiss knife',
    description: 'Balanced quality and speed (32 languages)',
  },
  {
    id: 'eleven_multilingual_v2',
    name: 'Polyglot',
    description: 'High quality, rich emotional expression (29 languages)',
  },
] as const;

// Expression level labels
const EXPRESSION_LABELS = ['Low', 'Medium', 'High', 'Extreme'] as const;

// Convert expression level (0-3) to stability (1-0) - reversed mapping
// Low expression (0) -> stability 1.0 (most stable)
// Extreme expression (3) -> stability 0.0 (most expressive)
const expressionToStability = (level: number): number => {
  return Math.round((1 - level / 3) * 100) / 100;
};

// Convert stability (0-1) to expression level (3-0) - reversed mapping
const stabilityToExpression = (stability: number): number => {
  return Math.round((1 - stability) * 3);
};

export default function VoiceSettingsPage() {
  const router = useRouter();
  const [selectedVoice, setSelectedVoice] = useState<string>('emma');
  const [selectedEngine, setSelectedEngine] = useState<string>('eleven_v3');
  const [expressionLevel, setExpressionLevel] = useState<number>(0);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [voiceSelectOpen, setVoiceSelectOpen] = useState(false);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved voice config on mount
  useEffect(() => {
    async function loadVoiceConfig() {
      try {
        const config = await getElevenLabsVoiceConfig(ELEVENLABS_AGENT_ID);
        if (config) {
          // Load voice option ID from localStorage (since multiple voices can share the same voiceId)
          const savedVoiceOptionId = localStorage.getItem(`voice-option-${ELEVENLABS_AGENT_ID}`);
          if (savedVoiceOptionId && VOICE_OPTIONS.some((v) => v.id === savedVoiceOptionId)) {
            setSelectedVoice(savedVoiceOptionId);
          } else {
            // Fallback: find voice option by voiceId
            const voice = VOICE_OPTIONS.find((v) => v.voiceId === config.voice_id);
            if (voice) {
              setSelectedVoice(voice.id);
            }
          }
          // Set engine/model
          if (config.model_id) {
            setSelectedEngine(config.model_id);
          }
          // Set expression level from stability (reversed)
          if (config.stability !== undefined) {
            setExpressionLevel(stabilityToExpression(config.stability));
          }
        }
      } catch (error) {
        console.error('Failed to load voice config:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadVoiceConfig();
  }, []);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('[ElevenLabs] Connected');
      setCallState('active');
    },
    onDisconnect: (details) => {
      console.log('[ElevenLabs] Disconnected:', details);
      setCallState('ended');
    },
    onError: (error) => {
      console.error('[ElevenLabs] Error:', error);
      setCallState('idle');
    },
    onMessage: (message) => {
      console.log('[ElevenLabs] Message:', message);
    },
  });

  // Detect user speaking by polling input volume
  useEffect(() => {
    if (callState !== 'active') {
      setIsUserSpeaking(false);
      return;
    }

    const interval = setInterval(() => {
      const volume = conversation.getInputVolume();
      setIsUserSpeaking(volume > 0.05); // Threshold for "speaking"
    }, 100);

    return () => clearInterval(interval);
  }, [callState, conversation]);

  // Handle voice selection
  const handleSelectVoice = useCallback((voiceId: string) => {
    setSelectedVoice(voiceId);
    // Reset call state when voice changes
    if (callState !== 'idle') {
      setCallState('idle');
    }
  }, [callState]);

  // Handle call me button - start ElevenLabs conversation
  const handleCallMe = useCallback(async () => {
    setCallState('ringing');

    // Play beep sound
    if (!beepAudioRef.current) {
      beepAudioRef.current = new Audio('/phone-beep.mp3');
    }
    beepAudioRef.current.currentTime = 0;
    beepAudioRef.current.play().catch(() => {});

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Update agent config with selected voice engine and stability
      const selectedVoiceId = VOICE_OPTIONS.find((v) => v.id === selectedVoice)?.voiceId || ELEVENLABS_VOICE_ID_GEERT;
      const stability = expressionToStability(expressionLevel);
      console.log('[ElevenLabs] Updating agent config...', { voiceId: selectedVoiceId, modelId: selectedEngine, stability });
      await updateElevenLabsAgentConfig({
        agentId: ELEVENLABS_AGENT_ID,
        voiceId: selectedVoiceId,
        modelId: selectedEngine,
        stability,
      });
      console.log('[ElevenLabs] Agent config updated');

      // Wait minimum 2 seconds for the beep to play
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Stop the beep
      if (beepAudioRef.current) {
        beepAudioRef.current.pause();
        beepAudioRef.current.currentTime = 0;
      }

      // Start the conversation with the agent
      const voiceName = VOICE_OPTIONS.find((v) => v.id === selectedVoice)?.name || 'Assistant';
      await conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        connectionType: 'webrtc',
        dynamicVariables: {
          agent_name: voiceName,
        },
      });
    } catch (error) {
      console.error('[ElevenLabs] Failed to start:', error);
      setCallState('idle');
      // Stop beep on error too
      if (beepAudioRef.current) {
        beepAudioRef.current.pause();
        beepAudioRef.current.currentTime = 0;
      }
    }
  }, [conversation, selectedEngine, selectedVoice, expressionLevel]);

  // Reset to idle state
  const handleReset = useCallback(async () => {
    if (conversation.status === 'connected') {
      await conversation.endSession();
    }
    setCallState('idle');
  }, [conversation]);

  // Handle call state changes from the mockup (e.g., hang up button)
  const handleCallStateChange = useCallback(async (newState: CallState) => {
    if (newState === 'ended' && conversation.status === 'connected') {
      await conversation.endSession();
    }
    setCallState(newState);
  }, [conversation]);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setShowSaveDialog(false);
    try {
      const selectedVoiceId = VOICE_OPTIONS.find((v) => v.id === selectedVoice)?.voiceId || ELEVENLABS_VOICE_ID_GEERT;
      const stability = expressionToStability(expressionLevel);

      // Save voice config to database
      await saveElevenLabsVoiceConfig({
        agentId: ELEVENLABS_AGENT_ID,
        voiceId: selectedVoiceId,
        modelId: selectedEngine,
        stability,
      });

      // Save voice option ID to localStorage (since multiple voices can share the same voiceId)
      localStorage.setItem(`voice-option-${ELEVENLABS_AGENT_ID}`, selectedVoice);

      toast.success('Voice instellingen opgeslagen');
      router.push('/admin');
    } catch (error) {
      console.error('Failed to save voice config:', error);
      toast.error('Opslaan mislukt. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  }, [router, selectedVoice, selectedEngine, expressionLevel]);

  // Get selected voice for display
  const selectedVoiceData = VOICE_OPTIONS.find((v) => v.id === selectedVoice);

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Voice instellingen</h1>
          </div>
          <Button onClick={() => setShowSaveDialog(true)} disabled={isSaving} className="gap-2 bg-blue-500 hover:bg-blue-600">
            <Save className="w-4 h-4" />
            {isSaving ? 'Bewaren...' : 'Bewaren'}
          </Button>
        </div>
      </PageLayoutHeader>
      <PageLayoutContent
        sidebar={
          <div className="flex flex-col items-center justify-center bg-gray-100 p-6 h-full">
            <IPhoneMockup size="compact">
              <VoiceCallMockup
                callerName={selectedVoiceData?.name || 'Izzy'}
                callerSubtitle="Voice Assistant"
                callerAvatar={selectedVoiceData?.avatar}
                callState={callState}
                onStateChange={handleCallStateChange}
                onCallMe={handleCallMe}
                isSpeaking={conversation.isSpeaking}
                isUserSpeaking={isUserSpeaking}
              />
            </IPhoneMockup>

            {/* Reset button below mockup */}
            {callState !== 'idle' && (
              <button
                onClick={handleReset}
                className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        }
        sidebarWidth={600}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Instellingen laden...</div>
          </div>
        ) : (
        <div className="space-y-8 max-w-2xl">
          {/* Voice Selection Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select Voice</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose a voice for your AI agent
              </p>
            </div>

            <Popover open={voiceSelectOpen} onOpenChange={setVoiceSelectOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={callState === 'active' || callState === 'ringing'}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
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
          </section>

          {/* Voice Engine Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Voice Engine</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select the voice model that best fits your needs
              </p>
            </div>

            <RadioGroup
              value={selectedEngine}
              onValueChange={setSelectedEngine}
              className="space-y-3"
            >
              {VOICE_ENGINES.map((engine) => (
                <div
                  key={engine.id}
                  className="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEngine(engine.id)}
                >
                  <RadioGroupItem value={engine.id} id={engine.id} className="mt-0.5" />
                  <Label htmlFor={engine.id} className="flex-1 cursor-pointer">
                    <span className="font-medium text-gray-900">{engine.name}</span>
                    {'badge' in engine && engine.badge && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                        {engine.badge}
                      </span>
                    )}
                    <p className="text-sm text-gray-500 mt-0.5">{engine.description}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </section>

          {/* Expression Level Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Expression Level</h2>
              <p className="text-sm text-gray-500 mt-1">
                Adjust emotional expressiveness from stable to dynamic
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={expressionLevel}
                onChange={(e) => setExpressionLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-sm">
                {EXPRESSION_LABELS.map((label, index) => (
                  <button
                    key={label}
                    onClick={() => setExpressionLevel(index)}
                    className={`px-2 py-1 rounded transition-colors ${
                      expressionLevel === index
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                {expressionLevel === 0 && 'Low: Most stable and consistent voice output'}
                {expressionLevel === 1 && 'Medium: Balanced expression with natural variation'}
                {expressionLevel === 2 && 'High: More dynamic and emotionally responsive'}
                {expressionLevel === 3 && 'Extreme: Maximum expressiveness (may be unpredictable)'}
              </p>
            </div>
          </section>

          {/* Info Section */}
          <section className="rounded-xl bg-blue-50 border border-blue-100 p-5">
            <h3 className="font-medium text-gray-900 mb-2">About Voice Agents</h3>
            <p className="text-sm text-gray-600">
              Voice agents conduct phone interviews with candidates using natural language
              processing. They can screen candidates, ask qualifying questions, and provide
              a human-like conversation experience. The selected voice determines how the
              agent sounds during calls.
            </p>
          </section>
        </div>
        )}
      </PageLayoutContent>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voice instellingen opslaan?</AlertDialogTitle>
            <AlertDialogDescription>
              Stem en model wijzigingen kunnen de conversatie-ervaring beïnvloeden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
              Opslaan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
