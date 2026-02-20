import { useState, useCallback, useRef, useEffect } from 'react';
import CameraCapture from './components/CameraCapture';
import AnimatedAvatar from './components/AnimatedAvatar';
import VoiceInterface from './components/VoiceInterface';
import ConversationHistory from './components/ConversationHistory';
import type { VisionState, ChatMessage, UserProfile } from './types';
import { analyzeFace, searchOrIndexFace, checkLiveness, createCollection, checkDemoMode } from './api/verifeye';
import { getChatResponse } from './api/claude';
import { saveUserProfile, getCollectionId, getUserProfile, getUserProfiles, deleteUserProfile } from './utils/storage';
import { speak } from './utils/elevenlabs'; // Using ElevenLabs TTS (falls back to Web Speech API if not configured)
import { VideoRecorder } from './utils/videoRecorder';

function App() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [visionState, setVisionState] = useState<VisionState>({
    userId: null,
    userName: null,
    confidence: 0,
    isLive: true,
    age: null,
    gender: null,
    emotion: null,
    attention: null,
    isNewUser: false,
    lastUpdate: Date.now(),
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [demoMode, setDemoMode] = useState<boolean | null>(null); // null = unknown, true = demo, false = live

  // Keep refs in sync with state
  useEffect(() => {
    visionStateRef.current = visionState;
  }, [visionState]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      // Check demo mode
      const isDemoMode = await checkDemoMode();
      setDemoMode(isDemoMode);

      // Create collection
      try {
        await createCollection(
          collectionIdRef.current,
          'Vision Avatar Face Recognition Collection'
        );
        console.log('✅ Collection ready:', collectionIdRef.current);
      } catch (error) {
        console.error('❌ Failed to create collection:', error);
      }
    };

    initialize();
  }, []);

  const videoRecorderRef = useRef<VideoRecorder>(new VideoRecorder());
  const videoStreamRef = useRef<MediaStream | null>(null);
  const livenessCheckIntervalRef = useRef<number | null>(null);
  const collectionIdRef = useRef<string>(getCollectionId());
  const hasGreetedRef = useRef(false);
  const greetedWithNameRef = useRef<string | null>(null); // Track if we greeted with a specific name
  const visionStateRef = useRef<VisionState>(visionState);
  const isSpeakingRef = useRef<boolean>(false);
  const lastUserChangeRef = useRef<number>(0); // Timestamp of last user change announcement

  // Give initial greeting after first face analysis
  const giveInitialGreeting = useCallback((userName: string | null) => {
    if (hasGreetedRef.current) return;
    hasGreetedRef.current = true;
    greetedWithNameRef.current = userName; // Track what name we greeted with

    const greeting = userName
      ? `Hey ${userName}! Welcome back. What would you like to talk about?`
      : `Hi there! I'm VerifEye, an AI avatar with vision capabilities. I can see you and respond to your expressions. What's your name?`;

    console.log('👋 Initial greeting:', { userName, greeting: greeting.substring(0, 50) });

    const avatarMessage: ChatMessage = {
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
    };
    setMessages([avatarMessage]);

    // Set speaking BEFORE calling speak() to prevent race conditions
    setIsSpeaking(true);
    setTimeout(() => {
      speak(greeting, () => {
        setIsSpeaking(false);
        setIsListening(true);
      });
    }, 100);
  }, []);

  // Handle frame capture for fast analysis (demographics, emotion, attention)
  const handleFrameCapture = useCallback(async (dataUrl: string) => {
    try {
      console.log('🔍 Running face analysis...');

      // Analyze face (emotion, attention, demographics)
      const result = await analyzeFace(dataUrl);

      // Search for face or index if not found (single API call)
      let faceResult: any = null;
      try {
        faceResult = await searchOrIndexFace(dataUrl, collectionIdRef.current, 40); // 40% threshold - more permissive to handle lighting/angle variations
        console.log('✅ Face result:', faceResult.resultSource, '| faceId:', faceResult.faceId);
      } catch (error) {
        console.log('❌ Face search-or-index error:', error);
      }

      // Determine attention level
      const attention = result.attention
        ? result.attention > 0.7 ? 'high' as const
          : result.attention > 0.4 ? 'medium' as const
          : 'low' as const
        : null;

      setVisionState(prev => {
        const newUserId = faceResult?.faceId || prev.userId;
        const profile = newUserId ? getUserProfile(newUserId) : null;
        const isNewUser = faceResult?.resultSource === 'Index'; // New if we had to index

        console.log('👤 Vision state update:', {
          resultSource: faceResult?.resultSource,
          faceId: faceResult?.faceId,
          newUserId,
          profile,
          isNewUser,
          allProfiles: getUserProfiles().length,
        });

        if (!profile && newUserId) {
          console.warn('⚠️ Profile not found for faceId:', newUserId);
          console.log('Available profiles:', getUserProfiles().map(p => ({ id: p.id, name: p.name })));
        }

        // Detect user recognition change (null -> recognized, or recognized -> different person)
        const wentFromUnknownToRecognized = !prev.userId && newUserId && profile?.name && profile.name !== 'Unknown';

        // Also handle case where initial greeting was generic but we now recognize them
        const newName = profile?.name && profile.name !== 'Unknown' ? profile.name : null;
        const recognizedAfterGenericGreeting = hasGreetedRef.current &&
                                               !greetedWithNameRef.current &&
                                               newName;

        // Also detect demographic changes (different person)
        const demographicsChanged =
          prev.age && result.demographics?.age &&
          Math.abs(prev.age.estimate - result.demographics.age.estimate) > 10; // 10+ year difference

        const timeSinceLastChange = Date.now() - lastUserChangeRef.current;
        const canAnnounceChange = timeSinceLastChange > 60000; // 60 second cooldown

        // For recognition after generic greeting, use shorter cooldown (10 seconds)
        const canAnnounceRecognition = recognizedAfterGenericGreeting &&
                                       timeSinceLastChange > 10000;

        // Announce if: went from unknown to recognized, OR demographics changed, OR recognized after generic greeting
        const shouldAnnounce = ((wentFromUnknownToRecognized || demographicsChanged) && canAnnounceChange ||
                               canAnnounceRecognition) &&
                               !isSpeakingRef.current &&
                               !isThinking &&
                               hasGreetedRef.current;

        if (shouldAnnounce) {
          lastUserChangeRef.current = Date.now();
          greetedWithNameRef.current = newName; // Update greeted name

          const message = newName
            ? `Oh, hi ${newName}! Nice to see you.`
            : `Oh, hi there! I don\'t think we\'ve met before.`;

          console.log('👋 Announcing user recognition:', {
            newName,
            wentFromUnknownToRecognized,
            demographicsChanged,
            recognizedAfterGenericGreeting,
          });

          // Set speaking BEFORE calling speak() to prevent race conditions
          setIsSpeaking(true);

          // Add message to conversation first
          const avatarMessage: ChatMessage = {
            role: 'assistant',
            content: message,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, avatarMessage]);

          // Then speak with longer delay to ensure state propagates and no conflicts
          setTimeout(() => {
            if (!isSpeakingRef.current) {
              console.log('⚠️ Speaking state was cleared before greeting - re-setting');
              setIsSpeaking(true);
            }
            speak(message, () => setIsSpeaking(false));
          }, 300);
        }

        // Give initial greeting after first successful face analysis
        if (!hasGreetedRef.current && isMonitoring) {
          const userName = profile?.name && profile.name !== 'Unknown' ? profile.name : null;
          console.log('🎤 Giving initial greeting, userName:', userName);
          setTimeout(() => giveInitialGreeting(userName), 500);
        }

        const finalUserName = profile?.name && profile.name !== 'Unknown' ? profile.name : (prev.userName || null);

        console.log('👤 Determining userName:', {
          profileName: profile?.name,
          prevUserName: prev.userName,
          finalUserName,
        });

        return {
          userId: newUserId,
          // Preserve current userName if profile doesn't have a name (don't overwrite!)
          userName: finalUserName,
          confidence: faceResult?.face?.confidence || 0,
          isLive: prev.isLive, // Updated by liveness check
          age: result.demographics?.age || prev.age,
          gender: result.demographics?.gender || prev.gender,
          emotion: result.emotion?.dominant || prev.emotion,
          attention,
          isNewUser,
          lastUpdate: Date.now(),
        };
      });

      // If this was a new face (indexed), save the profile
      if (faceResult?.resultSource === 'Index' && faceResult.faceId) {
        try {
          // Check if there's a global default name for this browser
          const defaultName = localStorage.getItem('verifeye-default-name') || 'Unknown';

          const newProfile: UserProfile = {
            id: faceResult.faceId,
            name: defaultName, // Use global name if available
            embedding: [], // Not used with API
            firstSeen: Date.now(),
            lastSeen: Date.now(),
          };
          saveUserProfile(newProfile);
          console.log('💾 Saved new profile:', faceResult.faceId, 'with name:', defaultName);
        } catch (error) {
          console.error('❌ Failed to save profile:', error);
        }
      }
    } catch (error) {
      console.error('❌ Vision analysis error:', error);
    }
  }, [isSpeaking, isThinking, isMonitoring, giveInitialGreeting]);

  // Periodic liveness check (every 60 seconds, silent)
  const startLivenessChecks = useCallback((stream: MediaStream) => {
    videoStreamRef.current = stream;
    let hasWarnedOnce = false;

    const runLivenessCheck = async () => {
      try {
        console.log('Starting liveness check...');
        const videoDataUrl = await videoRecorderRef.current.startRecording(stream, 3000);

        const livenessResult = await checkLiveness(videoDataUrl);

        setVisionState(prev => ({
          ...prev,
          isLive: livenessResult.isLive || false,
        }));

        // Only warn once about liveness failures, don't interrupt conversation
        if (!livenessResult.isLive && !hasWarnedOnce && !isSpeakingRef.current && !isThinking) {
          hasWarnedOnce = true;
          console.warn('Liveness check failed - might be photo/video');
          // Just log it, don't speak - too disruptive
        }

        console.log('Liveness check result:', livenessResult.isLive);
      } catch (error) {
        console.error('Liveness check error:', error);
        // Assume live if check fails (better UX than false positives)
        setVisionState(prev => ({ ...prev, isLive: true }));
      }
    };

    // Run first check after 60 seconds (give user time to interact first)
    setTimeout(runLivenessCheck, 60000);

    // Then every 60 seconds
    const interval = window.setInterval(runLivenessCheck, 60000);
    livenessCheckIntervalRef.current = interval;
  }, [isSpeaking, isThinking]);

  const stopLivenessChecks = useCallback(() => {
    if (livenessCheckIntervalRef.current) {
      clearInterval(livenessCheckIntervalRef.current);
      livenessCheckIntervalRef.current = null;
    }
  }, []);

  // Note: Face recognition happens automatically every 3 seconds via handleFrameCapture
  // This function just ensures the vision state is fresh for identity questions
  const forceRecognitionCheck = useCallback(async () => {
    console.log('🔍 Using latest vision state for identity question');
    // The automatic frame capture will provide the most recent data
    // No need to manually capture - just return and use current visionStateRef
    return;
  }, []);

  // Handle voice transcript
  const handleVoiceTranscript = useCallback(async (transcript: string) => {
    setIsListening(false);

    const userMessage: ChatMessage = {
      role: 'user',
      content: transcript,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Check if user wants to be forgotten (delete all profiles)
    const forgetMe = /(?:forget me|delete me|delete (?:my |all )?(?:profile|record|data)|clear (?:my |all )?(?:profile|record|data)|remove me)/i.test(transcript);
    if (forgetMe) {
      console.log('🗑️ User requested to be forgotten - clearing all profiles and default name');
      localStorage.removeItem('verifeye-profiles');
      localStorage.removeItem('verifeye-collection-id');
      localStorage.removeItem('verifeye-default-name'); // Clear global default name too

      // Reset vision state
      setVisionState(prev => ({
        ...prev,
        userId: null,
        userName: null,
        isNewUser: true,
      }));

      console.log('✅ All profiles and default name deleted');
      // Don't add to conversation history - Claude will respond naturally
      return;
    }

    // Check if user is introducing themselves (VERY conservative to avoid false positives)
    // ONLY match explicit name introductions - "I'm" is too ambiguous (matches "I'm wondering", "I'm thinking", etc.)
    const nameMatch = transcript.match(/^(?:my name is|call me)\s+(\w+)/i);
    if (nameMatch) {
      const name = nameMatch[1];
      const userId = visionStateRef.current.userId; // Use ref to get latest userId

      console.log('👤 User introduced themselves:', name, '| current faceId:', userId);

      // CRITICAL: Save name globally for this browser
      // ALL future profiles will use this name automatically
      localStorage.setItem('verifeye-default-name', name);

      // Also update ALL existing profiles in this collection with the name
      // Face recognition might return different faceIds for same person
      const allProfiles = getUserProfiles();
      const updatedCount = allProfiles.filter(p => {
        if (!p.name || p.name === 'Unknown') {
          p.name = name;
          saveUserProfile(p);
          return true;
        }
        return false;
      }).length;

      console.log(`👤 Saved name globally and updated ${updatedCount} existing profiles: ${name}`);

      // Also update/create current userId's profile
      if (userId) {
        let profile = getUserProfile(userId);
        if (!profile) {
          profile = {
            id: userId,
            name: name,
            embedding: [],
            firstSeen: Date.now(),
            lastSeen: Date.now(),
          };
        } else {
          profile.name = name;
        }
        saveUserProfile(profile);
      }

      // Update state and ref
      setVisionState(prev => ({ ...prev, userName: name }));
      visionStateRef.current = { ...visionStateRef.current, userName: name };
      console.log('👤 Name saved to all profiles, state, and ref:', name);
    }

    // Check if user is asking about their identity - trigger fresh recognition
    const identityQuestions = /(?:do you know (?:me|my name|who i am)|know my name|recognize me|remember me|who am i|what'?s my name|you know me)/i;
    if (identityQuestions.test(transcript)) {
      console.log('🔍 Identity question detected - running fresh face recognition');
      await forceRecognitionCheck();
    }

    // Check if user wants to be forgotten
    const forgetMePattern = /(?:forget (?:me|about me)|delete (?:me|my (?:profile|data|information))|remove (?:me|my (?:profile|data))|don'?t remember me|erase me)/i;
    if (forgetMePattern.test(transcript)) {
      const currentUserId = visionStateRef.current.userId;
      if (currentUserId) {
        console.log('🗑️ User requested to be forgotten:', currentUserId);

        // Delete their profile from localStorage
        const deleted = deleteUserProfile(currentUserId);

        if (deleted) {
          // Reset current session identity
          setVisionState(prev => ({
            ...prev,
            userId: null,
            userName: null,
            isNewUser: false,
            confidence: 0,
          }));
          visionStateRef.current = {
            ...visionStateRef.current,
            userId: null,
            userName: null,
            isNewUser: false,
            confidence: 0,
          };

          console.log('🗑️ Profile deleted and session reset');
        }
      }
    }

    setIsThinking(true);
    try {
      // Use ref to get LATEST vision state, not stale closure value
      const currentVisionState = visionStateRef.current;
      console.log('📸 Using current vision state for Claude:', {
        userName: currentVisionState.userName,
        emotion: currentVisionState.emotion,
        attention: currentVisionState.attention,
      });
      const response = await getChatResponse([...messages, userMessage], currentVisionState);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      setIsSpeaking(true);
      speak(response, () => {
        setIsSpeaking(false);
        setIsListening(true);
      });
    } catch (error: any) {
      console.error('Chat error:', error);

      // Provide more helpful error messages
      let errorMessage = 'Sorry, I encountered an error. ';

      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        errorMessage += 'The backend server might be waking up (takes ~30 seconds on free tier). Please try again in a moment.';
      } else if (error?.status === 429) {
        errorMessage += 'Rate limit reached. Please wait a moment and try again.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage += 'Request timed out. The server might be starting up. Please try again.';
      } else {
        errorMessage += 'Please try again.';
        // Log detailed error for debugging
        console.error('Detailed error:', {
          message: error?.message,
          status: error?.status,
          type: error?.type,
          error: error
        });
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      setIsSpeaking(true);
      speak(errorMessage, () => {
        setIsSpeaking(false);
        setIsListening(true);
      });
    } finally {
      setIsThinking(false);
    }
  }, [messages, forceRecognitionCheck]); // Removed visionState from deps since we use ref

  // Start demo
  const startDemo = () => {
    setShowDemo(true);
    setIsMonitoring(true);
  };

  if (!showDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <div className="text-8xl mb-4">🤖👁️</div>
            <h1 className="text-4xl font-bold text-dark-text mb-3">
              Vision-Aware Voice Avatar
            </h1>
            <p className="text-lg text-grey-dark">
              Have a real-time voice conversation with an AI that can see you
            </p>
          </div>

          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-dark-text mb-4">What Can I Do?</h2>
            <ul className="text-left space-y-3 text-grey-dark">
              <li className="flex items-start gap-2">
                <span className="text-2xl">💬</span>
                <span>Have a <strong>natural voice conversation</strong> - just talk to me like a friend</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-2xl">👁️</span>
                <span><strong>I can see you</strong> - I notice your expressions and reactions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-2xl">🧠</span>
                <span><strong>Tell me your name</strong> and I'll remember you next time you visit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-2xl">😊</span>
                <span><strong>Ask me how you're feeling</strong> - I can read your mood</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-2xl">🤫</span>
                <span><strong>Ask me to forget you</strong> and I'll get total amnesia after this chat</span>
              </li>
            </ul>
          </div>

          <button onClick={startDemo} className="btn-primary text-lg">
            Start Voice Demo →
          </button>

          <p className="text-sm text-grey-mid mt-4">
            You'll need to grant camera and microphone permissions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-dark-text">Vision-Aware Voice Avatar 🎙️👁️</h1>
          <p className="text-grey-dark">Real VerifEye API + Voice Conversation</p>
        </div>

        {/* Demo Mode Banner */}
        {demoMode === true && (
          <div className="mb-6 card bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-1">Demo Mode - Simulated Responses</h3>
                <p className="text-sm text-amber-800">
                  VerifEye API key not configured. Using realistic mock data for demonstration.
                  <a href="https://github.com/yourusername/vision-chat-avatar#setup" className="ml-1 underline font-semibold">
                    Add your API keys
                  </a> for real face recognition.
                </p>
              </div>
            </div>
          </div>
        )}

        {demoMode === false && (
          <div className="mb-6 card bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">
                  Live Mode - Using real VerifEye APIs
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <CameraCapture
              onFrameCapture={handleFrameCapture}
              captureInterval={3000}
              isActive={isMonitoring}
              onStreamReady={startLivenessChecks}
            />

            <div className="card">
              <button
                onClick={() => {
                  if (isMonitoring) {
                    stopLivenessChecks();
                  }
                  setIsMonitoring(!isMonitoring);
                }}
                className={isMonitoring ? 'btn-secondary w-full' : 'btn-primary w-full'}
              >
                {isMonitoring ? '⏸️ Pause Vision' : '▶️ Resume Vision'}
              </button>
              <p className="text-xs text-grey-mid mt-2 text-center">
                Fast: Every 3s (emotion, demographics)<br/>
                Slow: Every 30s (liveness check)
              </p>
            </div>

            <div className="card bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200">
              <h3 className="text-sm font-bold text-dark-text mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span>
                Try saying...
              </h3>
              <ul className="text-xs space-y-2 text-grey-dark">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-green">•</span>
                  <span><strong>"How am I feeling?"</strong> - I'll describe your mood</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-green">•</span>
                  <span><strong>"My name is [name]"</strong> - I'll remember you next time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-green">•</span>
                  <span><strong>"Do you know me?"</strong> - I'll check if we've met before</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-green">•</span>
                  <span><strong>"Forget me"</strong> - I'll get amnesia and treat you as a stranger next session</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <AnimatedAvatar
              visionState={visionState}
              isThinking={isThinking}
              isSpeaking={isSpeaking}
              isListening={isListening}
            />

            <VoiceInterface
              onTranscript={handleVoiceTranscript}
              isAvatarSpeaking={isSpeaking}
              isListening={isListening}
              onListeningChange={setIsListening}
            />
          </div>

          <div className="lg:col-span-1 h-[600px]">
            <ConversationHistory messages={messages} />
          </div>
        </div>

        <details className="mt-6 card text-xs">
          <summary className="cursor-pointer text-grey-mid font-semibold">Debug Info</summary>
          <div className="mt-3 space-y-4">
            <div>
              <h3 className="font-semibold text-grey-dark mb-2">Current Vision State:</h3>
              <pre className="text-grey-dark overflow-auto bg-grey-lightest p-2 rounded">
                {JSON.stringify({ ...visionState, collectionId: collectionIdRef.current }, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold text-grey-dark mb-2">Stored User Profiles ({getUserProfiles().length}):</h3>
              <pre className="text-grey-dark overflow-auto bg-grey-lightest p-2 rounded">
                {JSON.stringify(getUserProfiles(), null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default App;
