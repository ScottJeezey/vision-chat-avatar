import type { VisionState } from '../types';
import AnimatedFace from './AnimatedFace';

interface AnimatedAvatarProps {
  visionState: VisionState;
  isThinking: boolean;
  isSpeaking: boolean;
  isListening: boolean;
}

export default function AnimatedAvatar({
  visionState,
  isThinking,
  isSpeaking,
  isListening
}: AnimatedAvatarProps) {
  const getGreeting = () => {
    if (visionState.userName) {
      return `Hi ${visionState.userName}!`;
    }
    return 'I don\'t think we\'ve met';
  };

  const getStatus = () => {
    if (!visionState.isLive) return 'Liveness check failed';
    if (isSpeaking) return 'Speaking';
    if (isListening) return 'Listening';
    if (isThinking) return 'Thinking';
    if (visionState.attention === 'low') return 'Trying to get your attention';
    return 'Ready to chat';
  };

  const getColor = () => {
    if (!visionState.isLive) return 'bg-red-100 border-red-400';
    if (visionState.attention === 'low') return 'bg-yellow-100 border-yellow-400';
    return 'bg-emerald-100 border-emerald-400';
  };

  return (
    <div className={`card ${getColor()} transition-all duration-300`}>
      {/* Animated Face */}
      <AnimatedFace
        isSpeaking={isSpeaking}
        isListening={isListening}
        emotion={visionState.emotion}
      />

      {/* Status */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-dark-text mb-1">
          {getGreeting()}
        </div>
        <div className="text-lg text-grey-dark">
          {getStatus()}
        </div>
      </div>

      {/* Vision stats in compact grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {visionState.age && (
          <div className="bg-white/50 rounded-lg p-2">
            <div className="text-grey-mid text-xs">Age</div>
            <div className="text-dark-text font-semibold">~{visionState.age.estimate} years</div>
          </div>
        )}
        {visionState.gender && (
          <div className="bg-white/50 rounded-lg p-2">
            <div className="text-grey-mid text-xs">Gender</div>
            <div className="text-dark-text font-semibold capitalize">{visionState.gender.value}</div>
          </div>
        )}
        {visionState.attention && (
          <div className="bg-white/50 rounded-lg p-2">
            <div className="text-grey-mid text-xs">Attention</div>
            <div className={`font-semibold ${
              visionState.attention === 'high' ? 'text-emerald-green' :
              visionState.attention === 'medium' ? 'text-blue-mid' :
              'text-grey-mid'
            }`}>
              {visionState.attention.toUpperCase()}
            </div>
          </div>
        )}
        {visionState.emotion && (
          <div className="bg-white/50 rounded-lg p-2">
            <div className="text-grey-mid text-xs">Mood</div>
            <div className="text-dark-text font-semibold capitalize">{visionState.emotion}</div>
          </div>
        )}
      </div>

      {/* Recognition confidence */}
      {visionState.userName && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-grey-mid mb-1">
            <span>Recognition confidence</span>
            <span>{(visionState.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-grey-lighter rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-green transition-all duration-300"
              style={{ width: `${visionState.confidence * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
