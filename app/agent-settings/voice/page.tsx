'use client';

import { useState, useCallback } from 'react';
import { RotateCcw, Play } from 'lucide-react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { IPhoneMockup, VoiceCallMockup, type CallState } from '@/components/blocks/phone-simulator';
import { VoiceSelectionCard, type VoiceOption } from '@/components/blocks/voice-settings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Dummy voice options
const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'emma',
    name: 'Emma',
    description: 'Warm and professional',
    gender: 'female',
  },
  {
    id: 'liam',
    name: 'Liam',
    description: 'Confident and clear',
    gender: 'male',
  },
  {
    id: 'sophie',
    name: 'Sophie',
    description: 'Energetic and friendly',
    gender: 'female',
  },
];

// Voice engine options
const VOICE_ENGINES = [
  {
    id: 'default',
    name: 'Default Model',
    description: 'Balanced performance and quality',
  },
  {
    id: 'multilang',
    name: 'Multilang Model',
    description: 'When language switching in call is needed',
  },
  {
    id: 'expression',
    name: 'Expression Model',
    description: 'Experimental - Enhanced emotional range',
  },
] as const;

// Expression level labels
const EXPRESSION_LABELS = ['Low', 'Medium', 'High', 'Extreme'] as const;

export default function VoiceAgentSettingsPage() {
  const [selectedVoice, setSelectedVoice] = useState<string>('emma');
  const [selectedEngine, setSelectedEngine] = useState<string>('default');
  const [expressionLevel, setExpressionLevel] = useState<number>(0);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isTriggering, setIsTriggering] = useState(false);

  // Handle voice selection
  const handleSelectVoice = useCallback((voiceId: string) => {
    setSelectedVoice(voiceId);
    // Reset call state when voice changes
    if (callState !== 'idle') {
      setCallState('idle');
    }
  }, [callState]);

  // Simulate triggering a demo call
  const handleTriggerDemo = useCallback(async () => {
    setIsTriggering(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Start ringing
    setCallState('ringing');
    setIsTriggering(false);

    // Auto-answer after 2 seconds for demo
    setTimeout(() => {
      setCallState('active');
    }, 2000);

    // End call after 8 seconds total (simulating a short demo)
    setTimeout(() => {
      setCallState('ended');
    }, 10000);
  }, []);

  // Reset to idle state
  const handleReset = useCallback(() => {
    setCallState('idle');
  }, []);

  // Handle call state changes from the mockup
  const handleCallStateChange = useCallback((newState: CallState) => {
    setCallState(newState);
  }, []);

  // Get selected voice for display
  const selectedVoiceData = VOICE_OPTIONS.find((v) => v.id === selectedVoice);

  return (
    <PageLayout>
      <PageLayoutHeader
        title="Voice Agent"
        description="Configure voice settings and test demo calls"
      />
      <PageLayoutContent
        sidebar={
          <div className="flex flex-col items-center justify-center bg-gray-100 p-6 h-full">
            <IPhoneMockup size="compact">
              <VoiceCallMockup
                callerName={selectedVoiceData?.name || 'Izzy'}
                callerSubtitle="Voice Assistant"
                callState={callState}
                onStateChange={handleCallStateChange}
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
        sidebarWidth={420}
      >
        <div className="space-y-8 max-w-2xl">
          {/* Voice Selection Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select Voice</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose a voice for your AI agent
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {VOICE_OPTIONS.map((voice) => (
                <VoiceSelectionCard
                  key={voice.id}
                  voice={voice}
                  isSelected={selectedVoice === voice.id}
                  onSelect={handleSelectVoice}
                  disabled={callState === 'active' || callState === 'ringing'}
                />
              ))}
            </div>
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
                    {engine.id === 'expression' && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        Experimental
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

          {/* Test Demo Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Test Demo</h2>
              <p className="text-sm text-gray-500 mt-1">
                Trigger a demo call to hear the selected voice in action
              </p>
            </div>

            <Button
              onClick={handleTriggerDemo}
              disabled={isTriggering || callState === 'active' || callState === 'ringing'}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Start Demo Call
            </Button>

            {callState !== 'idle' && (
              <p className="text-sm text-gray-500">
                {callState === 'ringing' && 'Incoming call...'}
                {callState === 'active' && 'Demo call in progress'}
                {callState === 'ended' && 'Demo call ended. Click reset to try again.'}
              </p>
            )}
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
      </PageLayoutContent>
    </PageLayout>
  );
}
