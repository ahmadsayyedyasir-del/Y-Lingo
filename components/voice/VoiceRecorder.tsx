// components/voice/VoiceRecorder.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (text: string) => void;
  isDisabled?: boolean;
  setIsRecording?: (isRecording: boolean) => void;
}

export default function VoiceRecorder({
  onRecordingComplete,
  isDisabled = false,
  setIsRecording: setParentIsRecording,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
    }
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, []);

  const startRecording = () => {
    if (isDisabled || !isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = '';
    let interimText = '';

    recognition.onresult = (event: any) => {
      // Reset silence timer on new speech
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcriptPart;
        } else {
          interimText += transcriptPart;
        }
      }
      setTranscript(interimText || finalText);

      // Wait 3 seconds after user stops speaking before auto-submitting
      silenceTimerRef.current = setTimeout(() => {
        if (finalText.trim()) {
          recognition.stop();
        }
      }, 3000);
    };

    recognition.onerror = (event: any) => {
      console.error('STT error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Please allow microphone access to use voice features.');
      }
      setIsRecording(false);
      setParentIsRecording?.(false);
      setTranscript('');
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setIsRecording(false);
      setParentIsRecording?.(false);
      if (finalText.trim()) {
        onRecordingComplete(finalText.trim());
      } else if (interimText.trim()) {
        onRecordingComplete(interimText.trim());
      }
      setTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setParentIsRecording?.(true);
    setTranscript('Listening...');
  };

  const stopRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setParentIsRecording?.(false);
  };

  if (!isSupported) {
    return (
      <div className="text-center">
        <p className="text-gray-500 text-sm">Voice not supported. Use Chrome or Edge.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled && !isRecording}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
            : isDisabled
            ? 'bg-gray-700 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'
        }`}
      >
        {isRecording ? '⏹' : '🎤'}
      </button>
      {transcript && (
        <p className="text-xs text-gray-400 mt-2 max-w-xs text-center truncate">
          {transcript}
        </p>
      )}
    </div>
  );
}