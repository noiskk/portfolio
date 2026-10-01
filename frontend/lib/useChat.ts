'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { streamChatMessage, RateLimitError } from './api';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[]; // 답변 근거가 된 참고 문서 파일명 목록
}

// 첫 화면 질문 칩 — 문서에 답이 있는 질문 위주로 구성
export const SUGGESTED_QUESTIONS = [
  '어떤 프로젝트를 해보셨나요?',
  '이 챗봇은 어떻게 만들었나요?',
  '가장 어려웠던 기술 문제는 무엇인가요?',
  '어떤 기술 스택을 쓰시나요?',
];

const SESSION_KEY = 'chat_session_id';
const MESSAGES_KEY = 'chat_messages_v2';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return generateUUID();
  }
}

function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (stored) return JSON.parse(stored) as Message[];
  } catch {}
  return [];
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch {}
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const sessionIdRef = useRef('');
  const loadedRef = useRef(false);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    setMessages(loadMessages());
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (loadedRef.current) saveMessages(messages);
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: '' },
      ]);
      setStreaming(true);

      try {
        for await (const event of streamChatMessage(sessionIdRef.current, trimmed)) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            const updated =
              event.type === 'sources'
                ? { ...last, sources: event.data }
                : { ...last, content: last.content + event.data };
            return [...prev.slice(0, -1), updated];
          });
        }
      } catch (err) {
        const content =
          err instanceof RateLimitError
            ? '질문이 잠시 몰렸어요. 1분 후에 다시 시도해 주세요.'
            : '지금은 챗봇 서버에 연결할 수 없어요. 서버가 꺼져 있을 수 있습니다.\n\n' +
              '아래 포트폴리오에서 프로젝트를 바로 보실 수 있고, ' +
              '[GitHub 저장소](https://github.com/noiskk/portfolio)에서 전체 코드를 확인하실 수 있습니다.';
        setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content }]);
      } finally {
        setStreaming(false);
      }
    },
    [streaming],
  );

  const reset = useCallback(() => {
    if (streaming) return;
    setMessages([]);
  }, [streaming]);

  return { messages, streaming, send, reset, started: messages.length > 0 };
}

export type ChatState = ReturnType<typeof useChat>;
