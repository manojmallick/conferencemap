// src/components/ChatInterface.tsx
'use client';
import { useState, useRef, useCallback } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { Input } from '@progress/kendo-react-inputs';
import { Loader } from '@progress/kendo-react-indicators';
import TokenPanel from './TokenPanel';
import type { QueryMetrics } from '@/lib/sigmap/types';

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  metrics?: QueryMetrics;
  noContext?: boolean;
  noContextMsg?: string;
}

const WELCOME: Message = {
  role: 'assistant',
  text: `Hi! I'm ConferenceMap - your verified AI guide to JSNation & React Summit Amsterdam 2026.

Every answer I give is sourced from the actual conference data and verified by SigMap. I'll show you exactly how many tokens I used and whether every claim is grounded.

Try asking:
• "Who is speaking about React Server Components?"
• "What AI workshops are on today?"
• "Tell me about the Progress sponsor"
• "When does the hackathon finish?"`,
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [preflight, setPreflight] = useState<any>(null);
  const [firstToken, setFirstToken] = useState<any>(null);
  const [liveMetrics, setLiveMetrics] = useState<QueryMetrics | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      // Add user message
      setMessages((prev) => [...prev, { role: 'user', text }]);
      setInput('');
      setIsStreaming(true);
      setPreflight(null);
      setFirstToken(null);
      setLiveMetrics(null);

      // Placeholder assistant message
      setMessages((prev) => [...prev, { role: 'assistant', text: '' }]);

      try {
        const resp = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text }),
        });

        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw = decoder.decode(value);
          const lines = raw.split('\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'preflight') {
              setPreflight(event);
            } else if (event.type === 'first_token') {
              setFirstToken(event);
            } else if (event.type === 'text') {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  text: next[next.length - 1].text + event.content,
                };
                return next;
              });
              scrollToBottom();
            } else if (event.type === 'final_metrics') {
              setLiveMetrics(event.metrics);
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  metrics: event.metrics,
                };
                return next;
              });
            } else if (event.type === 'no_context') {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  text: event.message,
                  noContext: true,
                  noContextMsg: event.message,
                };
                return next;
              });
            } else if (event.type === 'error') {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  text: `Error: ${event.message}`,
                };
                return next;
              });
            }
          }
        }
      } catch {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            text: 'Connection error. Please try again.',
          };
          return next;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1 className="chat-title">Ask ConferenceMap</h1>
        <p className="chat-subtitle">
          Verified answers · Zero hallucination · Powered by SigMap + Gemini 2.5
        </p>
      </div>

      <div className="chat-body">
        {/* Messages */}
        <div className="messages-list">
          {messages.map((msg, i) => (
            <div key={i} className={`message message--${msg.role}`}>
              {msg.role === 'assistant' && <div className="message-avatar">◆</div>}
              <div className="message-content">
                <div className="message-text">
                  {msg.text ||
                    (isStreaming && i === messages.length - 1 ? (
                      <Loader size="small" type="pulsing" />
                    ) : null)}
                </div>
                {/* Show TokenPanel inline with last assistant message */}
                {msg.role === 'assistant' && i === messages.length - 1 && (
                  <TokenPanel
                    preflight={preflight}
                    firstToken={firstToken}
                    metrics={liveMetrics}
                    isStreaming={isStreaming}
                  />
                )}
                {/* Show stored metrics for older messages */}
                {msg.metrics && i < messages.length - 1 && (
                  <TokenPanel metrics={msg.metrics} isStreaming={false} />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <Input
            value={input}
            onChange={(e) => setInput(e.value as string)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about sessions, speakers, schedule, sponsors..."
            disabled={isStreaming}
            className="chat-input"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={isStreaming || !input.trim()}
            themeColor="primary"
            className="chat-send-btn"
          >
            {isStreaming ? <Loader size="small" type="pulsing" /> : 'Send →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
