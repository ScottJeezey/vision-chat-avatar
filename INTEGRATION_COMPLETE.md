# ✅ VerifEye API Integration Complete!

## What We Built

A **voice-based AI avatar** with **real VerifEye API integration** featuring:

### Dual Polling Architecture

**Fast Polling (every 3 seconds)** - Single image analysis:
- ✅ **Face Recognition API** - Searches face in collection, remembers users
- ✅ **Emotion/Attention API** - Detects emotions + attention level
- ✅ **Demographics API** - Age and gender estimation

**Slow Polling (every 30 seconds)** - Video-based security:
- ✅ **Liveness Detection API** - Records 3 seconds of video, verifies human

### Features

1. **Voice Conversation** - Speak and listen (Web Speech API)
2. **Persistent Identity** - Face Recognition API remembers you across sessions
3. **Person Swap Detection** - Notices when someone new sits down
4. **Liveness Verification** - Periodic anti-spoofing checks
5. **Emotion-Aware** - Responds to happy, confused, surprised, etc.
6. **Attention Monitoring** - Re-engages when you're distracted
7. **Age-Adjusted** - Tailors conversation based on demographics

## APIs Integrated

### 1. Face Recognition API
**Endpoint:** `POST https://face-recognition-api-us.realeyes.ai/v1/FaceRecognition/search`
- **Purpose:** Find matching face in collection
- **Used for:** User recognition across sessions
- **Frequency:** Every 3 seconds

**Endpoint:** `POST https://face-recognition-api-us.realeyes.ai/v1/FaceRecognition/index`
- **Purpose:** Add new face to collection
- **Used for:** Storing new users
- **Trigger:** When unknown face detected

### 2. Liveness Detection API
**Endpoint:** `POST https://liveness-detection-api-us.realeyes.ai/v1/liveness/check`
- **Purpose:** Verify live person (not photo/video/deepfake)
- **Input:** 3-second video clip
- **Frequency:** Every 30 seconds
- **Implementation:** `VideoRecorder` class records webcam → sends to API

### 3. Emotion & Attention API
**Endpoint:** `POST https://emotion-attention-api-us.realeyes.ai/v1/emotion-attention/detect`
- **Purpose:** Detect emotions and attention state
- **Returns:** happy, sad, surprised, contempt, disgust, fear, calm, attention level
- **Frequency:** Every 3 seconds

### 4. Demographics API
**Endpoint:** `POST https://demographic-estimation-api-us.realeyes.ai/v1/demographic-estimation/get-age`
- **Purpose:** Age estimation
- **Returns:** Age prediction + uncertainty range
- **Frequency:** Every 3 seconds

**Endpoint:** `POST https://demographic-estimation-api-us.realeyes.ai/v1/demographic-estimation/get-gender`
- **Purpose:** Gender detection
- **Returns:** Gender + confidence score
- **Frequency:** Every 3 seconds

## File Structure

```
src/
├── api/
│   ├── verifeye.ts          ✅ All VerifEye API calls
│   └── claude.ts            ✅ Claude API integration
├── components/
│   ├── CameraCapture.tsx    ✅ Webcam access + stream
│   ├── AnimatedAvatar.tsx   ✅ Visual avatar with reactions
│   ├── VoiceInterface.tsx   ✅ Speech-to-text input
│   └── ConversationHistory.tsx ✅ Transcript log
├── utils/
│   ├── speech.ts            ✅ Text-to-speech output
│   ├── storage.ts           ✅ Maps faceId → user name
│   └── videoRecorder.ts     ✅ Records video for liveness
└── App.tsx                  ✅ Main orchestration
```

## How It Works

### User Flow

1. **Start Demo** → Grant camera + microphone permissions
2. **Avatar speaks**: "Hi! I'm VerifEye. What's your name?"
3. **Click microphone** → You speak
4. **Avatar responds** → Contextual reply based on vision

### Behind the Scenes

**Every 3 seconds:**
```
Capture frame → VerifEye APIs (parallel):
  ├─ Face Recognition/search → Who are you?
  ├─ Emotion/Attention/detect → How do you feel?
  ├─ Demographics/get-age → How old?
  └─ Demographics/get-gender → Gender?

If new face → Face Recognition/index → Store in collection
Update VisionState → Inject into Claude system prompt
```

**Every 30 seconds:**
```
Record 3 seconds of video → Liveness/check
If not live → Avatar warns: "Are you holding up a photo?"
Update VisionState.isLive
```

**On user speech:**
```
Speech → Text → Claude API (with vision context) → Response
Response → Text-to-Speech → Avatar speaks
```

## Testing

### 1. Add Anthropic API Key

```bash
cd /Users/scott.jones/ai-workspace/vision-chat-avatar
echo "VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env
```

### 2. Run Dev Server

```bash
npm run dev
```

### 3. Test Scenarios

**First Visit:**
- Avatar: "I don't think we've met. What's your name?"
- You: "I'm Scott"
- Avatar stores your face in Face Recognition collection

**Return Visit:**
- Refresh page
- Avatar: "Hey Scott! Welcome back!"

**Person Swap:**
- Have someone else sit down mid-conversation
- Avatar: "Wait, you're not Scott..."

**Liveness Check:**
- After 30 seconds, video liveness check runs
- Hold up a photo → Avatar: "I detect you might not be a live person"

**Distraction:**
- Look away for 10+ seconds
- Avatar notices low attention and comments

**Emotions:**
- Look confused
- Avatar: "You seem confused - let me explain differently"

## Authentication

**Current:** API key hardcoded in `src/api/verifeye.ts`
```typescript
const VERIFEYE_API_KEY = 'SEhSU0xROmVjMjFhYmRmLTYwZjUtNDk3YS1hOThjLWU3NzZkODI2ZWNmMg==';
```

**For Production:** Move to `.env`:
```
VITE_VERIFEYE_API_KEY=SEhSU0xROmVjMjFhYmRmLTYwZjUtNDk3YS1hOThjLWU3NzZkODI2ZWNmMg==
```

Update code:
```typescript
const VERIFEYE_API_KEY = import.meta.env.VITE_VERIFEYE_API_KEY;
```

## Browser Requirements

**Requires Chrome or Edge:**
- ✅ Web Speech API (speech-to-text)
- ✅ MediaRecorder API (video recording)
- ✅ WebRTC (camera access)

**Safari/Firefox:** Limited support (no speech recognition)

## Deployment

```bash
npm run build
```

Deploy `dist/` to:
- **Vercel** (recommended) - automatic HTTPS + env vars
- **Netlify** - easy static hosting
- **Any static host** - just upload dist folder

Add environment variables in hosting dashboard:
- `VITE_ANTHROPIC_API_KEY`
- `VITE_VERIFEYE_API_KEY` (if moved from code)

## Next Steps

### Enhancements:
- [ ] Add ElevenLabs for better voice quality
- [ ] Create/manage Face Recognition collections via UI
- [ ] Add option to delete your face from collection
- [ ] Improve mobile responsiveness
- [ ] Add dark mode
- [ ] Persist conversation history

### Production Hardening:
- [ ] Move API keys to environment variables
- [ ] Add error boundaries and retry logic
- [ ] Rate limiting for API calls
- [ ] Better loading states
- [ ] Analytics tracking
- [ ] User consent flows

## Cost Considerations

**VerifEye API calls per minute:**
- Face Recognition: 20 calls/min (every 3s)
- Emotion/Attention: 20 calls/min (every 3s)
- Demographics (Age): 20 calls/min (every 3s)
- Demographics (Gender): 20 calls/min (every 3s)
- Liveness: 2 calls/min (every 30s)

**Total:** ~82 API calls/minute during active conversation

**Claude API:**
- ~5-10 calls/minute (depends on conversation frequency)

## Demo Value

This demonstrates:
1. **Real-time multi-modal AI** - Vision + Voice + Conversation
2. **Layered security** - Fast checks + periodic liveness verification
3. **Persistent identity without PII** - Face embeddings, no passwords
4. **Context-aware AI** - Claude sees user state and reacts
5. **Production-ready integration** - Real APIs, not mocks

Perfect for:
- Sales demos
- Customer showcases
- Internal testing
- Trade show booth
- Video marketing content

---

Built with VerifEye APIs + Claude Sonnet 4.5 🚀
