'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, Maximize2, MessageCircle, Minimize2, RotateCcw, Sparkles } from 'lucide-react';
import { ChatState, SUGGESTED_QUESTIONS } from '@/lib/useChat';
import IdentityHeader from '@/components/sections/IdentityHeader';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';

interface Props {
  chat: ChatState;
  onSkip: () => void; // 챗봇 없이 일반 포트폴리오로 전환
}

function scrollToPortfolio() {
  document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' });
}

function SuggestedQuestions({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_QUESTIONS.map((q) => (
        <button
          key={q}
          onClick={() => onPick(q)}
          className="text-sm px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-blue-500/60 hover:text-white transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

export default function ChatHome({ chat, onSkip }: Props) {
  const { messages, streaming, send, reset } = chat;
  // open: 채팅 화면을 보고 있는지. 대화가 있어도 소개 화면으로 나올 수 있다 (대화는 유지)
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  function handleSend(text: string) {
    setOpen(true);
    send(text);
  }

  // 화면이 바뀌면 페이지 맨 위에서 시작
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [open]);

  // 답변이 스트리밍되는 동안 메시지 목록 안에서만 스크롤 (페이지 전체는 건드리지 않음)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  if (!open) {
    return (
      <section className="px-6">
        <div className="max-w-4xl mx-auto min-h-[calc(100vh-3.5rem)] flex flex-col justify-center py-12">
          <IdentityHeader />

          {/* 챗봇 안내 — 자기소개 바로 아래에서 "AI에게 물어보라"고 설명 */}
          <div className="mt-12">
            <p className="inline-flex items-center gap-2 text-blue-400 font-medium text-sm mb-2">
              <Sparkles size={15} />
              제 AI에게 직접 물어보세요
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              <span className="block">제 프로필과 프로젝트 문서를 검색해서 대신 답해 주는 RAG 챗봇이에요.</span>
              <span className="block">
                프로젝트 소개부터 기술적 고민까지 편하게 물어보세요. 답변 아래에는 근거가 된 문서도 함께 표시돼요.
              </span>
            </p>
          </div>

          <ChatInput big onSend={handleSend} placeholder="예: 어떤 프로젝트를 해보셨나요?" />

          <div className="mt-4">
            <SuggestedQuestions onPick={handleSend} />
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setOpen(true)}
              className="mt-5 self-start inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <MessageCircle size={14} />
              이전 대화 이어가기
            </button>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 text-sm">
            <button
              onClick={scrollToPortfolio}
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowDown size={14} />
              About me · 프로젝트 보기
            </button>
            <button
              onClick={onSkip}
              className="text-zinc-500 hover:text-white underline underline-offset-4 transition-colors"
            >
              챗봇 없이 포트폴리오 보기
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3 text-sm">
          <button
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 -ml-2.5 rounded-lg text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            소개로
          </button>
          <div className="flex items-center gap-1 text-zinc-500">
            <button
              onClick={reset}
              disabled={streaming || messages.length === 0}
              title="대화 내용을 모두 지웁니다"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white disabled:opacity-40 transition-colors"
            >
              <RotateCcw size={13} />
              대화 초기화
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? '채팅창 줄이기' : '채팅창 늘리기'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors"
            >
              {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              {expanded ? '줄이기' : '크게 보기'}
            </button>
            <button
              onClick={scrollToPortfolio}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <ArrowDown size={13} />
              About me
            </button>
          </div>
        </div>

        {/* 높이: 기본 70vh, 크게 보기 시 calc(100vh - 8rem). 오른쪽 아래 모서리를 끌어 직접 조절도 가능 */}
        <div
          className={`flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden resize-y min-h-[360px] max-h-[90vh] animate-chat-open ${
            expanded ? 'h-[calc(100vh-8rem)]' : 'h-[70vh]'
          }`}
        >
          <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-5">
                <p className="text-sm text-zinc-500">궁금한 점을 물어보세요.</p>
                <SuggestedQuestions onPick={handleSend} />
              </div>
            ) : (
              messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
            )}
          </div>
          <div className="shrink-0 border-t border-zinc-800 p-3">
            <ChatInput onSend={handleSend} disabled={streaming} placeholder="질문을 입력하세요..." />
          </div>
        </div>
      </div>
    </section>
  );
}
