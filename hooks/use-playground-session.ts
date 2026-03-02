'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Room, RoomEvent, Track, ConnectionState, RemoteParticipant, RemoteTrackPublication, RemoteTrack } from 'livekit-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

interface PlaygroundStartRequest {
  vacancy_id: string;
  candidate_name?: string;
  start_agent?: 'greeting' | 'screening' | 'open_questions' | 'scheduling' | null;
  require_consent?: boolean;
  candidate_known?: boolean;
  allow_escalation?: boolean;
  voice_id?: string;
  known_answers?: Record<string, string>;
  existing_booking_date?: string;
}

interface PlaygroundStartResponse {
  success: boolean;
  livekit_url: string;
  access_token: string;
  room_name: string;
}

export type PlaygroundConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export function usePlaygroundSession() {
  const roomRef = useRef<Room | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connectionState, setConnectionState] = useState<PlaygroundConnectionState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // Disconnect on page leave
  useEffect(() => {
    const cleanup = () => roomRef.current?.disconnect();
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, []);

  const startSession = useCallback(async (params: PlaygroundStartRequest) => {
    console.log('[usePlaygroundSession] startSession called with:', params);

    if (!params.vacancy_id) {
      console.warn('[usePlaygroundSession] BLOCKED: no vacancy_id');
      setError('Geen vacature geselecteerd');
      return;
    }

    // Guard against multiple calls
    if (roomRef.current) {
      console.warn('[usePlaygroundSession] BLOCKED: roomRef.current is not null', roomRef.current);
      return;
    }

    // Clear any pending reset timer
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    console.log('[usePlaygroundSession] Setting connecting state, fetching', `${BACKEND_URL}/playground/start`);
    setConnectionState('connecting');
    setError(null);
    setIsMuted(false);
    setIsSpeaking(false);
    setIsUserSpeaking(false);

    try {
      // 1. Get LiveKit token from backend
      const response = await fetch(`${BACKEND_URL}/playground/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        let errorMessage = 'Er is een fout opgetreden';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.detail || errorMessage;
        } catch {
          // Response wasn't JSON
        }
        if (response.status === 404) {
          errorMessage = 'Vacature niet gevonden';
        }
        throw new Error(errorMessage);
      }

      const data: PlaygroundStartResponse = await response.json();
      setRoomName(data.room_name);

      // 2. Create and configure room
      const room = new Room();
      roomRef.current = room;

      // 3. Register event handlers before connecting
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        switch (state) {
          case ConnectionState.Connected:
            setConnectionState('connected');
            break;
          case ConnectionState.Reconnecting:
            setConnectionState('reconnecting');
            break;
          case ConnectionState.Disconnected:
            setConnectionState('disconnected');
            setIsSpeaking(false);
            setIsUserSpeaking(false);
            roomRef.current = null;
            // Auto-reset to idle after 3 seconds
            resetTimerRef.current = setTimeout(() => {
              setConnectionState('idle');
            }, 3000);
            break;
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          track.attach();
        }
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const agentSpeaking = speakers.some(
          (p) => p.identity?.startsWith('agent-') || p !== room.localParticipant
        );
        const userSpeaking = speakers.some(
          (p) => p === room.localParticipant
        );
        setIsSpeaking(agentSpeaking);
        setIsUserSpeaking(userSpeaking);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        if (participant.identity?.startsWith('agent-')) {
          room.disconnect();
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setConnectionState('disconnected');
        setIsSpeaking(false);
        setIsUserSpeaking(false);
        roomRef.current = null;
        resetTimerRef.current = setTimeout(() => {
          setConnectionState('idle');
        }, 3000);
      });

      // 4. Connect to room
      await room.connect(data.livekit_url, data.access_token);

      // 5. Enable microphone
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch {
        setError('Microfoon toegang is vereist voor de demo');
        room.disconnect();
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verbinding met de server mislukt';
      setError(message);
      setConnectionState('idle');
      roomRef.current = null;
    }
  }, []);

  const endSession = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setIsSpeaking(false);
    setIsUserSpeaking(false);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    const newMuted = !isMuted;
    room.localParticipant.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    startSession,
    endSession,
    toggleMute,
    connectionState,
    isMuted,
    isSpeaking,
    isUserSpeaking,
    error,
    resetError,
    roomName,
  };
}
