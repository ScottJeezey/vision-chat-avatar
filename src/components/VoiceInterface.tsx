import { useState, useEffect, useRef } from 'react';

interface VoiceInterfaceProps {
  onTranscript: (text: string) => void;
  isAvatarSpeaking: boolean;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

export default function VoiceInterface({
  onTranscript,
  isAvatarSpeaking,
  isListening,
}: VoiceInterfaceProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const recognitionRef = useRef<any>(null);
  const isRestartingRef = useRef<boolean>(false);

  // Request microphone permission
  useEffect(() => {
    async function requestMicPermission() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission('granted');
      } catch (error) {
        console.error('Microphone permission denied:', error);
        setMicPermission('denied');
      }
    }

    requestMicPermission();
  }, []);

  useEffect(() => {
    if (micPermission !== 'granted') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Don't set lang - let browser use default
    // recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 Speech recognition STARTED');
    };

    recognition.onresult = (event: any) => {
      console.log('🎤 Speech recognition received result:', event);
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log('🎤 Final transcript:', finalTranscript);
        setTranscript('');
        onTranscript(finalTranscript.trim());
      } else {
        console.log('🎤 Interim transcript:', interimTranscript);
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      // Handle fatal errors
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsSupported(false);
        return;
      }

      // Non-fatal errors (no-speech, audio-capture, network, etc.)
      // These should allow recognition to restart via onend
      if (event.error === 'no-speech') {
        console.log('🎤 No speech detected - will restart on end');
      } else if (event.error === 'aborted') {
        console.log('🎤 Recognition aborted - will restart if needed');
      } else {
        console.warn('🎤 Non-fatal recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      console.log('🎤 Recognition ended, isListening:', isListening, 'isAvatarSpeaking:', isAvatarSpeaking);

      // Always restart if we should be listening (unless avatar is speaking)
      if (isListening && !isAvatarSpeaking && !isRestartingRef.current) {
        isRestartingRef.current = true;

        // Small delay to avoid rapid restart loops
        setTimeout(() => {
          try {
            console.log('🎤 Auto-restarting recognition...');
            recognition.start();
            isRestartingRef.current = false;
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            isRestartingRef.current = false;
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [micPermission]);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening && !isAvatarSpeaking) {
      // Don't interfere if auto-restart is in progress
      if (isRestartingRef.current) {
        console.log('🎤 Auto-restart in progress, skipping manual start');
        return;
      }

      try {
        console.log('🎤 Attempting to start recognition...');
        recognitionRef.current.start();
      } catch (e) {
        console.log('🎤 Recognition already started or error:', e);
      }
    } else {
      try {
        console.log('🎤 Stopping recognition...');
        recognitionRef.current.stop();
        isRestartingRef.current = false; // Cancel any pending restarts
      } catch (e) {
        console.log('🎤 Recognition already stopped or error:', e);
      }
    }
  }, [isListening, isAvatarSpeaking]);

  if (!isSupported) {
    return (
      <div className="card bg-red-50 border-red-300">
        <p className="text-red-600 text-sm">
          Speech recognition is not supported in your browser. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Status indicator */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-grey-lightest border-2 border-grey-light">
          {isAvatarSpeaking ? (
            <>
              <div className="w-3 h-3 bg-blue-mid rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-dark-text">Avatar speaking...</span>
            </>
          ) : isListening ? (
            <>
              <div className="w-3 h-3 bg-emerald-green rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-emerald-green">Listening...</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-grey-mid rounded-full" />
              <span className="text-sm text-grey-mid">Standby</span>
            </>
          )}
        </div>
      </div>

      {/* Live transcript */}
      {transcript && (
        <div className="mt-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-sm text-grey-dark italic">"{transcript}"</p>
        </div>
      )}

      {/* Help text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-grey-mid">
          {isAvatarSpeaking
            ? "Waiting for avatar to finish..."
            : "Just start speaking - I'm always listening!"}
        </p>
      </div>
    </div>
  );
}
