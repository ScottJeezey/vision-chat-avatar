/**
 * ElevenLabs Text-to-Speech integration
 * Fallback to Web Speech API if ElevenLabs is not configured
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah (female, friendly)

// Track current audio state
let currentAudio: HTMLAudioElement | null = null;
let isCurrentlySpeaking = false;

/**
 * Speak text using ElevenLabs API
 * Falls back to Web Speech API if ElevenLabs is not configured
 */
export async function speak(text: string, onEnd?: () => void): Promise<void> {
  // Stop any ongoing speech
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.remove();
    currentAudio = null;
  }

  // Check if ElevenLabs is configured
  if (!ELEVENLABS_API_KEY) {
    console.warn('⚠️ ElevenLabs API key not configured - falling back to Web Speech API');
    const { speak: webSpeak } = await import('./speech');
    webSpeak(text, onEnd);
    return;
  }

  console.log('🎙️ ElevenLabs TTS:', text.substring(0, 50) + '...');
  isCurrentlySpeaking = true;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('🎙️ ElevenLabs API error:', error);
      // Fallback to Web Speech API
      console.warn('🎙️ Falling back to Web Speech API');
      const { speak: webSpeak } = await import('./speech');
      webSpeak(text, onEnd);
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    currentAudio = new Audio(audioUrl);

    currentAudio.onended = () => {
      console.log('🎙️ ElevenLabs TTS ended');
      URL.revokeObjectURL(audioUrl);
      isCurrentlySpeaking = false;
      if (onEnd) onEnd();
    };

    currentAudio.onerror = (error) => {
      console.error('🎙️ Audio playback error:', error);
      URL.revokeObjectURL(audioUrl);
      isCurrentlySpeaking = false;
      if (onEnd) onEnd();
    };

    await currentAudio.play();
  } catch (error) {
    console.error('🎙️ ElevenLabs error:', error);
    isCurrentlySpeaking = false;
    // Fallback to Web Speech API
    console.warn('🎙️ Falling back to Web Speech API');
    const { speak: webSpeak } = await import('./speech');
    webSpeak(text, onEnd);
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.remove();
    currentAudio = null;
  }
  isCurrentlySpeaking = false;
}

export function isSpeaking(): boolean {
  return isCurrentlySpeaking;
}

/**
 * Available ElevenLabs voices (free tier)
 * You can get your own voice IDs from: https://elevenlabs.io/app/voice-library
 */
export const VOICES = {
  SARAH: 'EXAVITQu4vr4xnSDxMaL', // Female, friendly (default)
  RACHEL: '21m00Tcm4TlvDq8ikWAM', // Female, calm
  DOMI: 'AZnzlk1XvdvUeBnXmlld',  // Female, strong
  BELLA: 'EXAVITQu4vr4xnSDxMaL', // Female, soft
  ANTONI: 'ErXwobaYiN019PkySvjV', // Male, well-rounded
  JOSH: 'TxGEqnHWrfWFTfGW9XjX',  // Male, deep
  ARNOLD: 'VR6AewLTigWG4xSOukaG', // Male, crisp
  ADAM: 'pNInz6obpgDQGcFmaJgB',  // Male, deep
  SAM: 'yoZ06aMxZJJ28mfd3POQ',   // Male, young
};
