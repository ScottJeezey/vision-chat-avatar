# Vision-Aware Voice Avatar 🎙️👁️

A live AI avatar you can **talk to** (not type to) that demonstrates VerifEye's real-time vision capabilities.

**Try the live demo:** Coming soon! _(Will use demo mode - no setup required)_

**Or run locally** with your own API keys for real VerifEye integration.

**GitHub:** https://github.com/ScottJeezey/vision-chat-avatar

## Features

The avatar:

- **Speaks and listens** - real voice conversation using Web Speech API
- **Recognizes users** across sessions using face embeddings
- **Detects person changes** mid-conversation
- **Knows your age** and adjusts conversation style
- **Monitors attention** and re-engages when distracted
- **Reads emotions** and responds appropriately
- **Verifies liveness** and rejects photos/videos

## Demo Mode vs Live Mode

**Demo Mode (Default)**
- ✅ No API keys required
- ✅ Works out of the box
- ⚠️ Uses simulated VerifEye responses (realistic mock data)
- Perfect for exploring the UI and concept

**Live Mode (Requires API Keys)**
- ✅ Real VerifEye face recognition, emotion detection, demographics
- ✅ Persistent user recognition across sessions
- 🔑 Requires VerifEye API key (contact Realeyes)
- 🔑 Requires Anthropic API key (get at console.anthropic.com)

## Setup

### Quick Start (Demo Mode)

```bash
npm install
cd server && npm install && cd ..

# Start proxy server (uses demo mode by default)
cd server && npm start &

# Start frontend
npm run dev
```

Open http://localhost:5173 - Demo mode will be active (simulated responses)

### Full Setup (Live Mode)

### 1. Install Dependencies

```bash
npm install
cd server && npm install && cd ..
```

### 2. Configure API Keys

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```
# Anthropic API Key
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# VerifEye API Key
VERIFEYE_API_KEY=your_verifeye_api_key

# VerifEye Region (us or eu)
VERIFEYE_REGION=us
```

### 3. Start the Proxy Server

The proxy server handles VerifEye API calls (to avoid CORS issues):

```bash
cd server
npm start
```

This starts the proxy on http://localhost:3001

### 4. Run Development Server

In a separate terminal:

```bash
npm run dev
```

Open http://localhost:5173

## How It Works

### Voice Conversation Flow

1. **You speak** → Web Speech API (speech-to-text)
2. **Transcript sent** → Claude API (with vision context)
3. **Claude responds** → Web Speech API (text-to-speech)
4. **Avatar speaks back** → Animated avatar reacts

### Vision Analysis Loop (runs in parallel)

- Camera captures frame every 3 seconds
- Sends to VerifEye API → liveness, demographics, emotion, embedding
- Matches face against known users (cosine similarity)
- Updates avatar state in real-time

### Context Injection

Every conversation turn includes live vision data:

```
Current vision state:
- User: Scott (returning user, 95% confidence)
- Liveness: LIVE person detected
- Age: 35 years old
- Gender: male (98% confidence)
- Attention: HIGH - User is focused
- Emotion: neutral
```

Claude uses this to:
- Greet returning users by name
- Detect person swaps ("Wait, you're not Scott...")
- React to attention drops
- Respond to emotional cues
- Catch spoofing attempts

## Demo Scenarios

### 1. First Time User
- Avatar: "Hi there! I'm VerifEye. What's your name?"
- You: "I'm Scott"
- Avatar stores your face embedding + name

### 2. Returning User
- Refresh page
- Avatar: "Hey Scott! Welcome back. What would you like to talk about?"

### 3. Person Swap
- Someone else sits down mid-conversation
- Avatar: "Wait, you're not Scott... Hi there! I don't think we've met."

### 4. Photo Attack
- Hold up a photo of yourself
- Avatar: "I can tell that's a photo, not really you. Show me your live face!"

### 5. Distraction
- Look away for 10+ seconds
- Avatar notices low attention and tries to re-engage

### 6. Emotional Response
- Look confused
- Avatar: "You seem confused - let me explain that differently."

## Tech Stack

- **Voice Input:** Web Speech API (speech-to-text)
- **Voice Output:** Web Speech API (text-to-speech)
- **Vision:** VerifEye REST API (Face Recognition, Emotion/Attention, Demographics, Liveness)
- **AI Chat:** Claude Sonnet 4.5 (Anthropic SDK)
- **Proxy Server:** Express.js (handles VerifEye API calls)
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (Realeyes brand colors)
- **Storage:** Browser localStorage (face recognition collection)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User's Face                      │
└─────────────────────────────────────────────────────┘
           ↓                              ↓
    [Webcam Feed]                  [Microphone]
           ↓                              ↓
   CameraCapture.tsx              VoiceInterface.tsx
           ↓                              ↓
   (every 3 seconds)              (on speech detected)
           ↓                              ↓
    analyzeFace()                  handleTranscript()
           ↓                              ↓
    VerifEye API                    Claude API
           ↓                              ↓
 {liveness, age,              {response based on
  emotion, embedding}          vision context}
           ↓                              ↓
    findBestMatch()                  speak()
           ↓                              ↓
   Update VisionState            Web Speech API (TTS)
           ↓                              ↓
  AnimatedAvatar.tsx            [Speakers Output]
```

## Browser Compatibility

**Requires Chrome or Edge** for best experience:
- ✅ Chrome/Edge - Full support (Web Speech API)
- ⚠️ Safari - Limited speech recognition support
- ❌ Firefox - No speech recognition support

**Permissions needed:**
- Camera (for vision analysis)
- Microphone (for voice input)

## VerifEye API Integration

Fully integrated with VerifEye production APIs:

**APIs Used:**
- ✅ **Face Recognition API** - Search-or-index for user recognition across sessions
- ✅ **Emotion & Attention API** - Real-time emotion detection
- ✅ **Demographics API** - Age and gender estimation
- ✅ **Liveness Detection API** - Video-based spoof detection

**Files:**
- `server/index.js` - Express proxy server (handles CORS)
- `src/api/verifeye.ts` - Client-side API wrapper

## Development

### Key Files

- `src/App.tsx` - Main app logic, voice + vision coordination
- `src/components/AnimatedAvatar.tsx` - Animated avatar face
- `src/components/VoiceInterface.tsx` - Speech-to-text input
- `src/components/ConversationHistory.tsx` - Transcript log
- `src/utils/speech.ts` - Text-to-speech utilities
- `src/api/verifeye.ts` - VerifEye API (needs verification)
- `src/api/claude.ts` - Claude API integration

### Build for Production

```bash
npm run build
```

Deploy `dist/` to Vercel, Netlify, or any static host.

## Features

### What You Can Say

- **"My name is [name]"** - Avatar will remember you across sessions
- **"How am I feeling?"** - Avatar describes your current mood
- **"Do you know me?"** - Triggers fresh face recognition check
- **"Forget me"** - Deletes your profile (full privacy control)

### Privacy

- All face recognition data stored **locally in your browser** (localStorage)
- Each browser gets its own VerifEye face collection
- Delete your profile anytime by saying "forget me"

## Future Enhancements

- [ ] Add option to use ElevenLabs for better voice quality
- [ ] Add voice selection (male/female, accent options)
- [ ] Add visual waveform during speaking/listening
- [ ] Improve mobile support (may need fallback UI)
- [ ] Cloud-based profile persistence (optional)

## Demo Use Cases

Once VerifEye API is connected:

1. **Sales Demo** - "This is how we verify identity in real-time"
2. **Age Verification** - Voice-first age gating for content
3. **Virtual Assistant** - Avatar that remembers you
4. **Customer Support** - Authenticated voice support
5. **Healthcare** - Patient verification for telehealth

## License

Private demo for Realeyes internal use.
