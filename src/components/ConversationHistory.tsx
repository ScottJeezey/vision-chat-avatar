import { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface ConversationHistoryProps {
  messages: ChatMessage[];
}

export default function ConversationHistory({ messages }: ConversationHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="card h-full flex items-center justify-center">
        <p className="text-grey-mid text-center">
          Start speaking! The avatar will introduce itself.
        </p>
      </div>
    );
  }

  return (
    <div className="card h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-dark-text mb-4 sticky top-0 bg-white pb-2 border-b border-grey-light">
        Conversation Transcript
      </h3>

      <div className="space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row' : 'flex-row'}`}
          >
            <div className="text-2xl flex-shrink-0">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="flex-1">
              <div className="text-xs text-grey-mid mb-1">
                {msg.role === 'user' ? 'You' : 'VerifEye'} •{' '}
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
              <div className={`text-sm ${msg.role === 'user' ? 'text-dark-text' : 'text-grey-dark'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
