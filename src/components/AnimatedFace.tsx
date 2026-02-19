import { useEffect, useState } from 'react';

interface AnimatedFaceProps {
  isSpeaking: boolean;
  isListening: boolean;
  emotion?: string | null;
}

export default function AnimatedFace({ isSpeaking, isListening, emotion }: AnimatedFaceProps) {
  const [mouthOpen, setMouthOpen] = useState(false);

  // Animate mouth when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return;
    }

    // Oscillate mouth open/closed while speaking
    const interval = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 150); // Toggle every 150ms for speech animation

    return () => clearInterval(interval);
  }, [isSpeaking]);


  // Determine mouth based on speaking state
  const getMouth = () => {
    if (isSpeaking && mouthOpen) {
      return (
        <div className="w-12 h-8 bg-dark-text rounded-full mt-2" />
      );
    }
    if (isSpeaking && !mouthOpen) {
      return (
        <div className="w-10 h-2 bg-dark-text rounded-full mt-2" />
      );
    }
    if (emotion === 'happy') {
      return (
        <div className="w-12 h-6 border-4 border-dark-text border-t-0 rounded-b-full mt-2" />
      );
    }
    // Default neutral mouth
    return (
      <div className="w-10 h-1 bg-dark-text rounded-full mt-2" />
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Face container */}
      <div className="relative w-48 h-48 bg-gradient-to-br from-mint-green to-emerald-green rounded-full flex flex-col items-center justify-center shadow-lg">
        {/* Eyes */}
        <div className="flex gap-6 mb-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <div className={`w-6 h-6 bg-dark-text rounded-full ${isSpeaking ? 'animate-pulse' : ''}`} />
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <div className={`w-6 h-6 bg-dark-text rounded-full ${isSpeaking ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Mouth */}
        {getMouth()}

        {/* Listening indicator */}
        {isListening && !isSpeaking && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-emerald-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-emerald-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-emerald-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
