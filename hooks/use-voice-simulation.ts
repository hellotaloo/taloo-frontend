'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Vapi from '@vapi-ai/web';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface VapiWebCallConfig {
  success: boolean;
  squad_id: string;
  vapi_public_key: string;
  assistant_overrides: Record<string, unknown>;
}

interface TranscriptMessage {
  role: 'user' | 'assistant';
  text: string;
}

export function useVoiceSimulation(vacancyId: string, options?: { isPlayground?: boolean }) {
  const vapiRef = useRef<Vapi | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
    };
  }, []);

  const startCall = useCallback(async (candidateName = 'Test Kandidaat') => {
    if (!vacancyId) {
      setError('No vacancy ID provided');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setTranscript([]);

    try {
      // 1. Fetch VAPI config from backend
      const response = await fetch(`${BACKEND_URL}/screening/web-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancy_id: vacancyId,
          candidate_name: candidateName,
          is_playground: options?.isPlayground ?? false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get VAPI config');
      }

      const config: VapiWebCallConfig = await response.json();

      // 2. Initialize VAPI with public key from env (more reliable than backend response)
      const publicKey = process.env.NEXT_PUBLIC_VAPI_KEY || config.vapi_public_key;
      if (!publicKey) {
        throw new Error('VAPI public key not configured');
      }
      const vapiInstance = new Vapi(publicKey);
      vapiRef.current = vapiInstance;

      // 3. Set up event handlers
      vapiInstance.on('call-start', () => {
        setIsCallActive(true);
        setIsConnecting(false);
      });

      vapiInstance.on('call-end', () => {
        setIsCallActive(false);
        setIsConnecting(false);
        setIsSpeaking(false);
        setIsUserSpeaking(false);
      });

      vapiInstance.on('speech-start', () => {
        setIsUserSpeaking(true);
      });

      vapiInstance.on('speech-end', () => {
        setIsUserSpeaking(false);
      });

      vapiInstance.on('message', (message) => {
        // Handle final transcripts
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          setTranscript(prev => [...prev, {
            role: message.role as 'user' | 'assistant',
            text: message.transcript
          }]);
          // Clear speaking when message completes
          if (message.role === 'assistant') {
            setIsSpeaking(false);
          }
        }
        // Detect assistant speaking from partial transcripts
        if (message.type === 'transcript' && message.role === 'assistant' && message.transcriptType === 'partial') {
          setIsSpeaking(true);
        }
      });

      vapiInstance.on('error', (err) => {
        console.error('VAPI error:', err);
        setError(err.message || 'Call error occurred');
        setIsCallActive(false);
        setIsConnecting(false);
      });

      // 4. Start call with squad (pass undefined for assistant when using squad)
      await vapiInstance.start(undefined, config.assistant_overrides, config.squad_id);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start call';
      setError(message);
      setIsConnecting(false);
    }
  }, [vacancyId]);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
    setIsCallActive(false);
    setIsSpeaking(false);
    setIsUserSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    startCall,
    endCall,
    toggleMute,
    resetError,
    isCallActive,
    isConnecting,
    isMuted,
    transcript,
    error,
    isSpeaking,
    isUserSpeaking,
  };
}
