const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
const {
  mockEmotionAttention,
  mockAge,
  mockGender,
  mockSearchOrIndex,
  mockLiveness,
} = require('./mockResponses');

const app = express();
const PORT = 3001;

// VerifEye API credentials from environment variables
const VERIFEYE_API_KEY = process.env.VERIFEYE_API_KEY;
const REGION = process.env.VERIFEYE_REGION || 'us';

// Check if running in demo mode (no API key)
const DEMO_MODE = !VERIFEYE_API_KEY;

if (DEMO_MODE) {
  console.warn('⚠️  DEMO MODE: VERIFEYE_API_KEY not found in .env');
  console.warn('⚠️  Using simulated responses for demonstration');
  console.warn('⚠️  Add VERIFEYE_API_KEY to .env for real API calls');
  console.warn('');
} else {
  console.log('✅ Live mode: Using real VerifEye API');
}

const BASE_URLS = {
  faceRecognition: `https://face-recognition-api-${REGION}.realeyes.ai/v1`,
  liveness: `https://liveness-detection-api-${REGION}.realeyes.ai/v1`,
  emotion: `https://emotion-attention-api-${REGION}.realeyes.ai/v1`,
  demographics: `https://demographic-estimation-api-${REGION}.realeyes.ai/v1`,
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.setHeader('X-Demo-Mode', DEMO_MODE ? 'true' : 'false');
  res.json({
    status: 'ok',
    message: 'VerifEye proxy server running',
    demoMode: DEMO_MODE,
  });
});

// Proxy endpoint for emotion/attention
app.post('/api/emotion-attention/detect', async (req, res) => {
  // Add demo mode header
  res.setHeader('X-Demo-Mode', DEMO_MODE ? 'true' : 'false');

  if (DEMO_MODE) {
    // Return mock data
    const mockData = mockEmotionAttention();
    console.log('😊 [DEMO] Emotion (simulated):', mockData.EmotionsAttention);
    return res.json(mockData);
  }

  try {
    const response = await fetch(`${BASE_URLS.emotion}/emotion-attention/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${VERIFEYE_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('😊 Emotion API response:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Emotion API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for age estimation
app.post('/api/demographic-estimation/get-age', async (req, res) => {
  res.setHeader('X-Demo-Mode', DEMO_MODE ? 'true' : 'false');

  if (DEMO_MODE) {
    const mockData = mockAge();
    console.log('👴 [DEMO] Age (simulated):', mockData.faces[0].age.prediction);
    return res.json(mockData);
  }

  try {
    const response = await fetch(`${BASE_URLS.demographics}/demographic-estimation/get-age`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${VERIFEYE_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('👴 Age API response:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Age API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for gender estimation
app.post('/api/demographic-estimation/get-gender', async (req, res) => {
  res.setHeader('X-Demo-Mode', DEMO_MODE ? 'true' : 'false');

  if (DEMO_MODE) {
    const mockData = mockGender();
    console.log('👤 [DEMO] Gender (simulated):', mockData.faces[0].gender);
    return res.json(mockData);
  }

  try {
    const response = await fetch(`${BASE_URLS.demographics}/demographic-estimation/get-gender`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${VERIFEYE_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('👤 Gender API response:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Gender API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for face search
app.post('/api/face-recognition/search', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URLS.faceRecognition}/face/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${VERIFEYE_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    console.log('🔍 Face search raw response:', text);

    try {
      const data = JSON.parse(text);
      console.log('🔍 Face search parsed:', JSON.stringify(data, null, 2));
      res.json(data);
    } catch (e) {
      console.error('🔍 Failed to parse as JSON:', e.message);
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Face search API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for face indexing
app.post('/api/face-recognition/index', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URLS.faceRecognition}/face/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${VERIFEYE_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    console.log('📸 Face index raw response:', text);

    try {
      const data = JSON.parse(text);
      console.log('📸 Face index parsed:', JSON.stringify(data, null, 2));
      res.json(data);
    } catch (e) {
      console.error('📸 Failed to parse as JSON:', e.message);
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Face index API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for liveness check
app.post('/api/liveness/check', async (req, res) => {
  res.setHeader('X-Demo-Mode', DEMO_MODE ? 'true' : 'false');

  if (DEMO_MODE) {
    const mockData = mockLiveness();
    console.log('🎥 [DEMO] Liveness (simulated):', mockData.isLive);
    return res.json(mockData);
  }

  try {
    const response = await fetch(`${BASE_URLS.liveness}/liveness/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${VERIFEYE_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Liveness API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for search-or-index
app.post('/api/face-recognition/search-or-index', async (req, res) => {
  res.setHeader('X-Demo-Mode', DEMO_MODE ? 'true' : 'false');

  if (DEMO_MODE) {
    const { collectionId } = req.body;
    const mockData = mockSearchOrIndex(collectionId);
    console.log('🔍📸 [DEMO] Face recognition (simulated):', mockData.resultSource, '| faceId:', mockData.faceId);
    return res.json(mockData);
  }

  try {
    const response = await fetch(`${BASE_URLS.faceRecognition}/face/search-or-index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${VERIFEYE_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      console.log('🔍📸 Search-or-index result:', data.resultSource, '| faceId:', data.faceId);
      res.json(data);
    } catch (e) {
      console.error('🔍📸 Failed to parse:', e.message);
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Search-or-index error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for creating collection
app.post('/api/face-recognition/collection/create', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URLS.faceRecognition}/collection/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${VERIFEYE_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    console.log('📦 Collection create response:', text);

    // 409 means collection already exists - that's OK
    if (response.status === 409) {
      res.json({ success: true, message: 'Collection already exists' });
      return;
    }

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (e) {
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Collection create error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ VerifEye proxy server running on http://localhost:${PORT}`);
  console.log(`🔌 Frontend should connect to: http://localhost:${PORT}/api/*`);
});
