'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { streamChatMessage } from '@/lib/api';
import { Send, X, MessageCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';

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

export default function FloatingChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [streaming, setStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const sessionIdRef = useRef<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    setMessages(loadMessages());
  }, []);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      return;
    }
    saveMessages(messages);
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  async function handleSend() {
    const trimmed = inputValue.trim();
    if (!trimmed || streaming) return;

    setInputValue('');
    if (!isOpen) setIsOpen(true);

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setStreaming(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      for await (const chunk of streamChatMessage(sessionIdRef.current, trimmed)) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasMessages = messages.length > 1 || isOpen;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      {/* 채팅 창 - 채팅바 위에 올라옴 */}
      {isOpen && (
        <div className="mb-3 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-chat-open">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-zinc-300">AI 어시스턴트</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* 메시지 목록 */}
          <div className="max-h-[400px] overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* 플로팅 채팅 입력 바 */}
      <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/30 px-4 py-3 transition-all">
        <div className="flex items-end gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`shrink-0 p-2 rounded-xl transition-colors ${
              isOpen
                ? 'bg-blue-500/10 text-blue-400'
                : hasMessages
                  ? 'text-blue-400 hover:bg-zinc-800'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            <MessageCircle size={20} />
          </button>
          <textarea
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 resize-none outline-none max-h-24 py-1.5"
            placeholder="궁금한 점을 물어보세요..."
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (messages.length > 1) setIsOpen(true); }}
            disabled={streaming}
          />
          <button
            onClick={handleSend}
            disabled={streaming || !inputValue.trim()}
            className="shrink-0 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
