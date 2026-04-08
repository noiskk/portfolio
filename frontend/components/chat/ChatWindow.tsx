'use client';

import { useState, useRef, useEffect } from 'react';
import { streamChatMessage } from '@/lib/api';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: '안녕하세요! 포트폴리오에 대해 궁금한 점을 질문해 주세요.',
};

const MESSAGES_STORAGE_KEY = 'chat_messages';

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
}

function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Message[];
  } catch {}
  return [INITIAL_MESSAGE];
}

function saveMessages(messages: Message[]) {
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [streaming, setStreaming] = useState(false);
  const sessionIdRef = useRef<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    setMessages(loadMessages());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // 첫 렌더(초기값 [INITIAL_MESSAGE])로 localStorage를 덮어쓰지 않도록 스킵
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      return;
    }
    saveMessages(messages);
  }, [messages]);

  async function handleSend(content: string) {
    setMessages(prev => [...prev, { role: 'user', content }]);
    setStreaming(true);

    // 빈 assistant 메시지 추가 후 스트리밍으로 채워나감
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      for await (const chunk of streamChatMessage(sessionIdRef.current, content)) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}
