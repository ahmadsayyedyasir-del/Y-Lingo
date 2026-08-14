// components/voice/VoicePlayer.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface VoicePlayerProps {
  audioUrl?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onEnd?: () => void;
}

export default function VoicePlayer({
  audioUrl,
  autoPlay = false,
  onPlay,
  onEnd,
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoading(false);
        onPlay?.();
      };
      audio.onended = () => {
        setIsPlaying(false);
        onEnd?.();
      };
      audio.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
      };
      if (autoPlay) {
        setIsLoading(true);
        audio.play().catch(() => {
          setIsLoading(false);
        });
      }
      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [audioUrl, autoPlay, onPlay, onEnd]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audioRef.current.play().catch(() => {
        setIsLoading(false);
      });
    }
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <button
      onClick={togglePlay}
      disabled={isLoading}
      className="w-10 h-10 rounded-full bg-gray-800/80 border border-gray-700 hover:border-gray-500 transition flex items-center justify-center text-lg disabled:opacity-50"
    >
      {isLoading ? (
        <span className="animate-spin">⏳</span>
      ) : isPlaying ? (
        '⏸'
      ) : (
        '▶️'
      )}
    </button>
  );
}