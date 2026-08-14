// components/voice/ConversationManager.tsx
'use client';

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';

// ✅ Type definitions for Web Speech API
interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: SpeechRecognitionResult;
      isFinal?: boolean;
      length: number;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

// ✅ Extend Window interface
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ConversationManagerProps {
  onSpeechDetected: (text: string) => void;
  isDisabled?: boolean;
  onStatusChange?: (status: 'idle' | 'listening' | 'processing') => void;
}

export interface ConversationManagerRef {
  startListening: () => void;
  stopListening: () => void;
  cancel: () => void;
}

const ConversationManager = forwardRef<ConversationManagerRef, ConversationManagerProps>(
  function ConversationManager(
    { onSpeechDetected, isDisabled = false, onStatusChange },
    ref
  ) {
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    const startListening = () => {
      if (isDisabled || !isSupported || status === 'listening') return;

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalText = '';
      let interimText = '';

      // ✅ Properly typed event handler
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;
          if (result[0].isFinal) {
            finalText += transcriptPart;
          } else {
            interimText += transcriptPart;
          }
        }
        setTranscript(interimText || finalText);

        // ✅ 2.5 SECOND SILENCE DETECTION
        silenceTimerRef.current = setTimeout(() => {
          if (finalText.trim()) {
            recognition.stop();
          }
        }, 2500);
      };

      // ✅ Properly typed error handler
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('STT error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Please allow microphone access.');
        }
        setStatus('idle');
        setTranscript('');
        onStatusChange?.('idle');
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
        setStatus('idle');
        onStatusChange?.('idle');
        if (finalText.trim()) {
          onSpeechDetected(finalText.trim());
        } else if (interimText.trim()) {
          onSpeechDetected(interimText.trim());
        }
        setTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setStatus('listening');
      onStatusChange?.('listening');
      setTranscript('Listening...');
    };

    const stopListening = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setStatus('idle');
      onStatusChange?.('idle');
    };

    const cancel = () => {
      stopListening();
      setTranscript('');
    };

    useImperativeHandle(ref, () => ({
      startListening,
      stopListening,
      cancel,
    }));

    if (!isSupported) {
      return (
        <div className="text-center">
          <p className="text-gray-500 text-sm">Voice not supported in this browser. Use Chrome or Edge.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <button
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={isDisabled && status !== 'listening'}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition ${
            status === 'listening'
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : isDisabled
              ? 'bg-gray-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90'
          }`}
        >
          {status === 'listening' ? '⏹' : '🎤'}
        </button>
        {status === 'listening' && (
          <div className="mt-2 text-green-400 text-sm animate-pulse">🔴 Recording... Speak now</div>
        )}
        {transcript && status === 'listening' && (
          <p className="text-xs text-gray-400 mt-2 max-w-xs text-center truncate">
            {transcript}
          </p>
        )}
      </div>
    );
  }
);

export default ConversationManager;