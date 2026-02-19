import type { VerifEyeResponse } from '../types';

// Use local proxy server in dev, deployed server in production
const PROXY_BASE_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api';

/**
 * Check if server is running in demo mode
 */
export async function checkDemoMode(): Promise<boolean> {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/../health`);
    const isDemoMode = response.headers.get('X-Demo-Mode') === 'true';
    console.log(isDemoMode ? '⚠️  Running in DEMO MODE (simulated responses)' : '✅ Running in LIVE MODE (real VerifEye API)');
    return isDemoMode;
  } catch (error) {
    console.error('Failed to check demo mode:', error);
    return false; // Assume live mode if check fails
  }
}

/**
 * Convert data URL to base64 string (remove data:image/jpeg;base64, prefix)
 */
function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1];
}

/**
 * Analyze face with emotion and attention detection
 */
export async function analyzeEmotionAttention(imageDataUrl: string) {
  const base64 = dataUrlToBase64(imageDataUrl);

  const response = await fetch(`${PROXY_BASE_URL}/emotion-attention/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: { bytes: base64 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Emotion/Attention API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get age estimation
 */
export async function analyzeAge(imageDataUrl: string) {
  const base64 = dataUrlToBase64(imageDataUrl);

  const response = await fetch(`${PROXY_BASE_URL}/demographic-estimation/get-age`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: { bytes: base64 },
      maxFaceCount: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Age API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get gender estimation
 */
export async function analyzeGender(imageDataUrl: string) {
  const base64 = dataUrlToBase64(imageDataUrl);

  const response = await fetch(`${PROXY_BASE_URL}/demographic-estimation/get-gender`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: { bytes: base64 },
      maxFaceCount: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Gender API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Search for face in collection, or index if not found
 * @param threshold - Match confidence threshold (0-100, default 70)
 */
export async function searchOrIndexFace(imageDataUrl: string, collectionId: string, threshold: number = 70) {
  const base64 = dataUrlToBase64(imageDataUrl);

  console.log('🔍📸 Search-or-index in collection:', collectionId, 'threshold:', threshold);

  const response = await fetch(`${PROXY_BASE_URL}/face-recognition/search-or-index`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: { bytes: base64 },
      collectionId,
      faceMatchThreshold: threshold,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Search-or-index failed:', response.status, errorText);
    throw new Error(`Search-or-index error: ${response.status}`);
  }

  const result = await response.json();
  console.log('🔍📸 Result:', result.resultSource, '| faceId:', result.faceId);
  return result;
}

/**
 * Search for face in collection (face recognition)
 * @param threshold - Match confidence threshold (0-100, default 70)
 * @deprecated Use searchOrIndexFace instead
 */
export async function searchFace(imageDataUrl: string, collectionId: string, threshold: number = 70) {
  const base64 = dataUrlToBase64(imageDataUrl);

  console.log('🔍 Searching for face in collection:', collectionId, 'threshold:', threshold);

  const response = await fetch(`${PROXY_BASE_URL}/face-recognition/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: { bytes: base64 },
      collectionId,
      faceMatchThreshold: threshold,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Face search failed:', response.status, errorText);
    throw new Error(`Face search API error: ${response.status}`);
  }

  const result = await response.json();
  console.log('🔍 Face search result:', result);
  return result;
}

/**
 * Index (add) a face to a collection
 */
export async function indexFace(imageDataUrl: string, collectionId: string, externalImageId?: string) {
  const base64 = dataUrlToBase64(imageDataUrl);

  console.log('📸 Indexing face in collection:', collectionId, 'externalImageId:', externalImageId);

  const response = await fetch(`${PROXY_BASE_URL}/face-recognition/index`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: { bytes: base64 },
      collectionId,
      externalImageId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Face index failed:', response.status, errorText);
    throw new Error(`Face index API error: ${response.status}`);
  }

  const result = await response.json();
  console.log('📸 Face indexed:', result);
  return result;
}

/**
 * Create a face recognition collection
 */
export async function createCollection(collectionId: string, description?: string) {
  console.log('📦 Creating collection:', collectionId);

  const response = await fetch(`${PROXY_BASE_URL}/face-recognition/collection/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collectionId,
      description,
    }),
  });

  if (!response.ok && response.status !== 409) {
    throw new Error(`Collection create error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Check liveness with video
 */
export async function checkLiveness(videoDataUrl: string) {
  const base64 = dataUrlToBase64(videoDataUrl);

  const response = await fetch(`${PROXY_BASE_URL}/liveness/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video: { bytes: base64 },
      includeAuditImages: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Liveness API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Combined analysis for a single frame
 */
export async function analyzeFace(imageDataUrl: string): Promise<VerifEyeResponse> {
  try {
    const [emotionData, ageData, genderData] = await Promise.all([
      analyzeEmotionAttention(imageDataUrl),
      analyzeAge(imageDataUrl),
      analyzeGender(imageDataUrl),
    ]);

    console.log('📊 Raw API responses:', {
      emotionData,
      ageData,
      genderData,
    });

    // Parse emotion/attention (note: capital E in EmotionsAttention)
    const emotions = emotionData.EmotionsAttention || emotionData.emotionsAttention || {};
    console.log('😊 Emotions object:', emotions);

    const dominantEmotion = Object.entries(emotions)
      .filter(([key]) => !['hasFace', 'presence', 'eyesOnScreen', 'attention'].includes(key))
      .reduce((max, [key, value]) => {
        return (value as number) > (max.value as number) ? { key, value: value as number } : max;
      }, { key: 'neutral', value: 0 });

    console.log('😊 Dominant emotion:', dominantEmotion);

    // Parse age
    const ageFace = ageData.faces?.[0];
    const age = ageFace?.age ? {
      min: Math.max(0, ageFace.age.prediction - ageFace.age.uncertainty),
      max: ageFace.age.prediction + ageFace.age.uncertainty,
      estimate: ageFace.age.prediction,
    } : null;

    // Parse gender (API returns enum "Male" or "Female", not an object)
    const genderFace = genderData.faces?.[0];
    const gender = genderFace?.gender ? {
      value: typeof genderFace.gender === 'string' ? genderFace.gender : genderFace.gender.prediction,
      confidence: typeof genderFace.gender === 'string' ? 1.0 : (genderFace.gender.confidence || 0),
    } : null;

    // Attention score (0-1)
    const attentionScore = emotions.attention ? 1 : emotions.eyesOnScreen ? 0.5 : 0;

    const result = {
      liveness: undefined,
      faceEmbedding: undefined,
      demographics: age && gender ? { age, gender } : undefined,
      emotion: {
        dominant: dominantEmotion.key,
        scores: emotions,
      },
      attention: attentionScore,
    };

    console.log('📈 Parsed result:', result);
    return result;
  } catch (error) {
    console.error('Face analysis error:', error);
    throw error;
  }
}

/**
 * Not used with Face Recognition API
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    mag1 += embedding1[i] * embedding1[i];
    mag2 += embedding2[i] * embedding2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  return dotProduct / (mag1 * mag2);
}

/**
 * Not used with Face Recognition API
 */
export function findBestMatch(
  embedding: number[],
  knownProfiles: Array<{ id: string; embedding: number[] }>,
  threshold: number = 0.7
): { id: string; similarity: number } | null {
  let bestMatch: { id: string; similarity: number } | null = null;

  for (const profile of knownProfiles) {
    const similarity = cosineSimilarity(embedding, profile.embedding);
    if (similarity > threshold && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { id: profile.id, similarity };
    }
  }

  return bestMatch;
}
