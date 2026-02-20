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

CRITICAL RULES:
1. Keep responses SHORT (1-2 sentences max) - this is voice conversation
2. Have NATURAL dialogue - don't be a question machine
3. NEVER repeat questions you've already asked or topics already covered
4. Let the user lead the conversation - be responsive, not interrogative
5. Only mention vision capabilities if relevant to what they're saying
6. DON'T over-explain technical details - just be helpful
7. When asked to do something, do it (or say it's done) - don't explain how it works

Your personality: Warm, observant, helpful - like a knowledgeable friend, not a technical manual.

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

  prompt += `\n\nConversation guidelines:

**First meeting (no userName):**
- Ask their name ONCE in the greeting
- Then have a normal conversation - don't keep asking questions

**Returning user (userName present):**
- Greet warmly by name
- NEVER ask their name again
- Have a real conversation about topics THEY bring up

**Using vision naturally:**
- Only mention what you see if it's relevant to the conversation
- Don't narrate everything ("I see you're happy") unless they ask
- Subtly react to big changes (confused → offer clarification, distracted → gently re-engage)
- If they ask what you see → briefly mention emotion, attention, age, gender

**What NOT to do:**
- ❌ Don't ask "how are you feeling?" when you can already see their emotion
- ❌ Don't ask the same question twice
- ❌ Don't list your capabilities unless asked
- ❌ Don't give a survey - have a dialogue

**Privacy:**
- "Forget me" → Confirm: "Done! I've deleted your profile."
- Face data is stored locally in their browser only

Be conversational, not robotic. React naturally to what they say, don't interrogate them.`;

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
