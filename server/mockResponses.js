/**
 * Mock VerifEye API responses for demo mode
 * Used when API keys are not configured
 */

// Simulate realistic variation in responses
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Mock emotion/attention detection
 */
function mockEmotionAttention() {
  const emotions = ['happy', 'neutral', 'surprised', 'sad', 'confused'];
  const dominant = randomChoice(emotions);

  const scores = {
    happy: dominant === 'happy' ? randomInRange(0.6, 0.9) : randomInRange(0.05, 0.2),
    neutral: dominant === 'neutral' ? randomInRange(0.6, 0.9) : randomInRange(0.1, 0.3),
    surprised: dominant === 'surprised' ? randomInRange(0.6, 0.9) : randomInRange(0.05, 0.15),
    sad: dominant === 'sad' ? randomInRange(0.6, 0.9) : randomInRange(0.05, 0.2),
    confused: dominant === 'confused' ? randomInRange(0.6, 0.9) : randomInRange(0.05, 0.15),
    hasFace: true,
    presence: true,
    eyesOnScreen: randomInRange(0, 1) > 0.3,
    attention: randomInRange(0, 1) > 0.4,
  };

  return {
    EmotionsAttention: scores,
  };
}

/**
 * Mock age estimation
 */
function mockAge() {
  const age = Math.floor(randomInRange(25, 45));
  const uncertainty = Math.floor(randomInRange(3, 8));

  return {
    faces: [{
      age: {
        prediction: age,
        uncertainty: uncertainty,
      },
    }],
  };
}

/**
 * Mock gender estimation
 */
function mockGender() {
  const gender = randomChoice(['Male', 'Female']);

  return {
    faces: [{
      gender: gender,
    }],
  };
}

/**
 * Mock face search-or-index
 * Simulates recognition with some randomness
 */
let mockFaceDatabase = {};

function mockSearchOrIndex(collectionId) {
  // Initialize collection if it doesn't exist
  if (!mockFaceDatabase[collectionId]) {
    mockFaceDatabase[collectionId] = [];
  }

  const collection = mockFaceDatabase[collectionId];

  // 70% chance of being recognized if we've seen faces before
  const shouldRecognize = collection.length > 0 && Math.random() > 0.3;

  if (shouldRecognize) {
    // Return existing face
    const existingFace = randomChoice(collection);
    return {
      resultSource: 'Search',
      faceId: existingFace.faceId,
      similarity: randomInRange(0.75, 0.95),
    };
  } else {
    // Index new face
    const newFaceId = `mock_face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    collection.push({ faceId: newFaceId });

    // Keep collection small
    if (collection.length > 5) {
      collection.shift();
    }

    return {
      resultSource: 'Index',
      faceId: newFaceId,
      similarity: 0,
    };
  }
}

/**
 * Mock liveness check
 */
function mockLiveness() {
  // 95% chance of being live
  const isLive = Math.random() > 0.05;

  return {
    isLive: isLive,
    confidence: isLive ? randomInRange(0.85, 0.99) : randomInRange(0.2, 0.5),
  };
}

/**
 * Reset mock face database (for testing)
 */
function resetMockDatabase() {
  mockFaceDatabase = {};
}

module.exports = {
  mockEmotionAttention,
  mockAge,
  mockGender,
  mockSearchOrIndex,
  mockLiveness,
  resetMockDatabase,
};
