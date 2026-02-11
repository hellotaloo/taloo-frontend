'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  Grid3X3,
  Plus,
  Video,
  User,
} from 'lucide-react';

export type CallState = 'idle' | 'ringing' | 'active' | 'ended';

export interface VoiceCallMockupProps {
  callerName?: string;
  callerSubtitle?: string;
  callState?: CallState;
  onStateChange?: (state: CallState) => void;
}

export function VoiceCallMockup({
  callerName = 'Izzy',
  callerSubtitle = 'Voice Assistant',
  callState = 'idle',
  onStateChange,
}: VoiceCallMockupProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [duration, setDuration] = useState(0);

  // Duration timer for active calls
  useEffect(() => {
    if (callState !== 'active') {
      setDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  // Format duration as MM:SS
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle state changes
  const handleAnswer = () => {
    onStateChange?.('active');
  };

  const handleDecline = () => {
    onStateChange?.('ended');
  };

  const handleHangup = () => {
    onStateChange?.('ended');
  };

  // Get status text based on call state
  const getStatusText = () => {
    switch (callState) {
      case 'idle':
        return 'Tap to start demo';
      case 'ringing':
        return 'Incoming call...';
      case 'active':
        return formatDuration(duration);
      case 'ended':
        return 'Call ended';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* iOS Status bar */}
      <div className="px-6 flex items-center justify-between text-white text-sm font-semibold h-[50px]">
        <span className="mt-1">22:07</span>
        <div className="flex items-center gap-1 mt-1">
          <div className="flex gap-0.5 items-end">
            <div className="w-[3px] h-[4px] bg-white rounded-sm" />
            <div className="w-[3px] h-[6px] bg-white rounded-sm" />
            <div className="w-[3px] h-[8px] bg-white rounded-sm" />
            <div className="w-[3px] h-[10px] bg-white rounded-sm" />
          </div>
          <svg className="w-4 h-3 ml-1" viewBox="0 0 16 12" fill="currentColor">
            <path d="M8 0C5.5 0 3.2 1 1.5 2.7L0 1.2V6h4.8L3 4.2C4.3 2.9 6.1 2 8 2s3.7.9 5 2.2L15 3C13.3 1.2 11 0 8 0z" />
          </svg>
          <div className="ml-1 flex items-center">
            <div className="w-[22px] h-[11px] border border-white rounded-[3px] relative flex items-center p-px">
              <div className="bg-white rounded-sm h-full" style={{ width: '100%' }} />
            </div>
            <div className="w-px h-[4px] bg-white rounded-r-sm ml-px" />
          </div>
        </div>
      </div>

      {/* Main call content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Avatar */}
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <span className="text-white text-5xl font-semibold">
              {callerName.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Pulse animation for ringing */}
          {callState === 'ringing' && (
            <>
              <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
              <div
                className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"
                style={{ animationDelay: '0.5s' }}
              />
            </>
          )}
        </div>

        {/* Caller info */}
        <h2 className="text-white text-3xl font-semibold mb-1">{callerName}</h2>
        <p className="text-gray-400 text-lg mb-2">{callerSubtitle}</p>

        {/* Status text */}
        <p
          className={`text-lg ${
            callState === 'active' ? 'text-green-400' : 'text-gray-400'
          }`}
        >
          {getStatusText()}
        </p>

        {/* Audio waveform animation for active calls */}
        {callState === 'active' && (
          <div className="flex items-center gap-1 mt-6 h-12">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-green-400 rounded-full"
                style={{
                  animation: 'waveform 0.8s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                  height: '20px',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="px-8 pb-8">
        {callState === 'ringing' ? (
          /* Ringing state - Accept/Decline buttons */
          <div className="flex items-center justify-center gap-16">
            <button
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </button>
            <button
              onClick={handleAnswer}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Phone className="w-8 h-8 text-white" />
            </button>
          </div>
        ) : callState === 'active' ? (
          /* Active call - Full control grid */
          <>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex flex-col items-center gap-2 ${
                  isMuted ? 'opacity-100' : 'opacity-70'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isMuted ? 'bg-white' : 'bg-gray-700'
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 text-gray-900" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </div>
                <span className="text-white text-xs">
                  {isMuted ? 'Unmute' : 'Mute'}
                </span>
              </button>

              <button className="flex flex-col items-center gap-2 opacity-70">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <Grid3X3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">Keypad</span>
              </button>

              <button
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`flex flex-col items-center gap-2 ${
                  isSpeaker ? 'opacity-100' : 'opacity-70'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isSpeaker ? 'bg-white' : 'bg-gray-700'
                  }`}
                >
                  <Volume2
                    className={`w-6 h-6 ${isSpeaker ? 'text-gray-900' : 'text-white'}`}
                  />
                </div>
                <span className="text-white text-xs">Speaker</span>
              </button>

              <button className="flex flex-col items-center gap-2 opacity-70">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">Add call</span>
              </button>

              <button className="flex flex-col items-center gap-2 opacity-70">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">FaceTime</span>
              </button>

              <button className="flex flex-col items-center gap-2 opacity-70">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs">Contacts</span>
              </button>
            </div>

            {/* End call button */}
            <div className="flex justify-center">
              <button
                onClick={handleHangup}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
            </div>
          </>
        ) : (
          /* Idle/Ended state - Just show placeholder */
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center opacity-50">
              <Phone className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Waveform animation keyframes */}
      <style jsx>{`
        @keyframes waveform {
          0%,
          100% {
            height: 8px;
          }
          50% {
            height: 32px;
          }
        }
      `}</style>

      {/* Bottom safe area / home indicator */}
      <div className="h-5 flex items-center justify-center">
        <div className="w-32 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  );
}
