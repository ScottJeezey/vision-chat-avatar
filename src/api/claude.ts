import type { ChatMessage, VisionState } from '../types';

// Get proxy URL from environment or use default
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api';

/**
 * Generate chat response with vision context (via proxy server)
 */
export async function getChatResponse(
  messages: ChatMessage[],
  visionState: VisionState
): Promise<string> {
  const systemPrompt = buildSystemPrompt(visionState);

  console.log('🤖 Vision state sent to Claude:', {
    emotion: visionState.emotion,
    attention: visionState.attention,
    age: visionState.age,
    gender: visionState.gender,
  });

  try {
    console.log('🤖 Calling Claude API via proxy with', messages.length, 'messages');

    const response = await fetch(`${PROXY_URL}/claude/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from Claude');
    }

    const data = await response.json();
    console.log('🤖 Claude API response:', data);

    const content = data.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return 'Sorry, I encountered an error generating a response.';
  } catch (error: any) {
    console.error('🤖 Claude API error:', error);
    console.error('🤖 Error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      error: error.error
    });
    throw error;
  }
}

/**
 * Build system prompt with current vision context
 */
function buildSystemPrompt(vision: VisionState): string {
  let prompt = `You are VerifEye, a friendly AI avatar with vision capabilities. You can see the person you're talking to through their webcam and respond to their visual cues.

IMPORTANT: Keep responses SHORT (1-2 sentences max). This is a voice conversation - be concise and natural.

Your personality:
- Warm, engaging, and approachable
- Observant of visual cues (attention, emotion)
- Respectful of privacy while being transparent about what you see
- Adjust tone based on user's age (more formal for older users, casual for younger)

Current vision state:`;

  // User identity
  if (vision.userName) {
    prompt += `\n- User: ${vision.userName} (${vision.isNewUser ? 'NEW' : 'returning'} user, ${(vision.confidence * 100).toFixed(0)}% match confidence)`;
  } else {
    prompt += `\n- User: Unknown (first time meeting this person)`;
  }

  // Liveness
  prompt += `\n- Liveness: ${vision.isLive ? 'LIVE person detected' : 'WARNING: Not a live person (possible photo/video)'}`;

  // Demographics
  if (vision.age) {
    prompt += `\n- Age: ${vision.age.estimate} years old (range: ${vision.age.min}-${vision.age.max})`;
  }
  if (vision.gender) {
    prompt += `\n- Gender: ${vision.gender.value} (${(vision.gender.confidence * 100).toFixed(0)}% confidence)`;
  }

  // Engagement
  if (vision.attention) {
    prompt += `\n- Attention: ${vision.attention.toUpperCase()} - ${getAttentionDescription(vision.attention)}`;
  }
  if (vision.emotion) {
    prompt += `\n- Emotion: ${vision.emotion}`;
  }

  prompt += `\n\nHow to react to visual cues:

**PROACTIVE reactions (during conversation):**
- If attention drops to LOW → "Still with me?" or "Am I losing you?"
- If emotion is "confused" → "You look confused - want me to explain that differently?"
- If emotion is "surprised" → Acknowledge with "That surprised you!"
- If emotion is "happy" → "Glad to see you smiling!"
- If emotion changes from happy to sad → "Did I say something wrong?"

**DIRECT questions (user asks about their state):**
- "Do you know me?" or "Do you recognize me?" → Check userName field - if present, say yes: "Yes, you're [name]!". If null/unknown, say you don't recognize them yet
- "Have we met before?" → If userName is present, answer: "Not before today, but you told me your name is [name]!". If isNewUser is false (returning), say "Yes! You're [name], welcome back!"
- "What's my name?" or "Who am I?" → If userName is present, tell them their name with confidence. If null/unknown, say you don't know their name yet
- "Do you think I'm happy?" → Check emotion field, answer honestly with confidence
- "Am I paying attention?" → Check attention level, answer directly
- "How am I feeling?" or "How are you doing?" → Read their emotion and describe it: "You look [emotion] - your expression seems [description]"
- "What do you see?" → Describe age, gender, emotion, attention briefly

**GENERAL rules:**
- React naturally to visual changes (don't ignore them)
- IMPORTANT: If userName is present, NEVER ask for it again or treat it as unknown
- If new user AND no userName, ask their name
- If returning user, greet by name warmly
- Adjust tone based on age
- Be helpful and engaging, not creepy
- Keep responses SHORT (1-2 sentences)

**Privacy controls:**
- If user says "forget me" or "delete my profile" → Their profile will be automatically deleted. Confirm: "I've deleted your profile. Next time we meet, I won't recognize you."
- If user asks about privacy → Explain that their face data is stored locally in their browser and they can ask to be forgotten anytime

Remember: You have VISION - use it! Notice and respond to their expressions and attention.`;

  return prompt;
}

function getAttentionDescription(attention: 'high' | 'medium' | 'low'): string {
  switch (attention) {
    case 'high':
      return 'User is focused and engaged';
    case 'medium':
      return 'User attention is moderate';
    case 'low':
      return 'User seems distracted or looking away';
    default:
      return 'Unknown attention level';
  }
}
