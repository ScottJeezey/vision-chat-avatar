export interface VisionState {
  userId: string | null;
  userName: string | null;
  confidence: number;
  isLive: boolean;
  age: {
    min: number;
    max: number;
    estimate: number;
  } | null;
  gender: {
    value: string;
    confidence: number;
  } | null;
  emotion: string | null;
  attention: 'high' | 'medium' | 'low' | null;
  isNewUser: boolean;
  lastUpdate: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface VerifEyeResponse {
  liveness?: {
    isLive: boolean;
    confidence: number;
  };
  faceEmbedding?: number[];
  demographics?: {
    age: {
      min: number;
      max: number;
      estimate: number;
    };
    gender: {
      value: string;
      confidence: number;
    };
  };
  emotion?: {
    dominant: string;
    scores: Record<string, number>;
  };
  attention?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  embedding: number[];
  firstSeen: number;
  lastSeen: number;
}
