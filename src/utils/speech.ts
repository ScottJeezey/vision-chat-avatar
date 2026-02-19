/**
 * Text-to-Speech utility using Web Speech API
 */

// Track current speech state
let currentSpeechTimer: number | null = null;
let currentOnEndCallback: (() => void) | null = null;

export function speak(text: string, onEnd?: () => void): void {
  // Cancel any ongoing speech and its callbacks
  if (currentSpeechTimer) {
    clearTimeout(currentSpeechTimer);
    currentSpeechTimer = null;
  }

  // Clear previous callback to prevent double-firing
  const previousCallback = currentOnEndCallback;
  currentOnEndCallback = null;

  window.speechSynthesis.cancel();

  // Small delay to ensure cancel completes
  setTimeout(() => {
    console.log('🔊 Starting TTS:', text.substring(0, 50) + '...');

    const utterance = new SpeechSynthesisUtterance(text);

    // Configure voice
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.name.includes('Microsoft') ||
      voice.name.includes('Google') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Daniel')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Store callback
    currentOnEndCallback = onEnd || null;

    const cleanup = () => {
      console.log('🔊 TTS ended');
      if (currentSpeechTimer) {
        clearTimeout(currentSpeechTimer);
        currentSpeechTimer = null;
      }
      const callback = currentOnEndCallback;
      currentOnEndCallback = null;
      if (callback) callback();
    };

    utterance.onend = cleanup;
    utterance.onerror = (error) => {
      console.error('🔊 TTS error:', error);
      cleanup();
    };

    // Fallback: force end after reasonable time
    const maxDuration = Math.max(5000, text.length * 100); // ~100ms per character
    currentSpeechTimer = window.setTimeout(() => {
      console.warn('🔊 TTS timeout - forcing end');
      window.speechSynthesis.cancel();
      cleanup();
    }, maxDuration);

    window.speechSynthesis.speak(utterance);
  }, 50); // 50ms delay to ensure previous speech is fully cancelled
}

export function stopSpeaking(): void {
  console.log('🔊 Stopping TTS');
  window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return window.speechSynthesis.speaking;
}

// Load voices (needed for some browsers)
if (typeof window !== 'undefined') {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
