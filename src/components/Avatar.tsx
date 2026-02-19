import type { VisionState } from '../types';

interface AvatarProps {
  visionState: VisionState;
  isThinking: boolean;
}

export default function Avatar({ visionState, isThinking }: AvatarProps) {
  // Determine avatar expression based on context
  const getExpression = () => {
    if (!visionState.isLive) return '⚠️';
    if (isThinking) return '🤔';
    if (visionState.attention === 'low') return '👋';
    if (visionState.emotion === 'happy') return '😊';
    if (visionState.emotion === 'confused') return '🤨';
    if (visionState.emotion === 'surprised') return '😮';
    return '👁️';
  };

  const getStatusColor = () => {
    if (!visionState.isLive) return 'bg-red-100 border-red-400';
    if (visionState.attention === 'low') return 'bg-yellow-100 border-yellow-400';
    return 'bg-emerald-100 border-emerald-400';
  };

  const getStatusText = () => {
    if (!visionState.isLive) return 'Liveness check failed';
    if (visionState.userName) {
      return `Hi ${visionState.userName}!`;
    }
    return 'I don\'t think we\'ve met';
  };

  return (
    <div className={`card ${getStatusColor()} transition-all duration-300`}>
      <div className="flex items-start gap-4">
        {/* Avatar face */}
        <div className="text-6xl select-none">
          {getExpression()}
        </div>

        {/* Status info */}
        <div className="flex-1">
          <div className="text-lg font-semibold text-dark-text mb-2">
            {getStatusText()}
          </div>

          <div className="space-y-1 text-sm text-grey-dark">
            {visionState.age && (
              <div>Age: ~{visionState.age.estimate} years</div>
            )}
            {visionState.attention && (
              <div className="flex items-center gap-2">
                <span>Attention:</span>
                <span className={`font-semibold ${
                  visionState.attention === 'high' ? 'text-emerald-green' :
                  visionState.attention === 'medium' ? 'text-blue-mid' :
                  'text-grey-mid'
                }`}>
                  {visionState.attention.toUpperCase()}
                </span>
              </div>
            )}
            {visionState.emotion && (
              <div>Mood: {visionState.emotion}</div>
            )}
            {isThinking && (
              <div className="text-mint-green font-semibold animate-pulse">
                Thinking...
              </div>
            )}
          </div>

          {/* Confidence indicator */}
          {visionState.userName && (
            <div className="mt-3">
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
      </div>
    </div>
  );
}
