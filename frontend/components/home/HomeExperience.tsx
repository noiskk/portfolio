'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { checkBackend } from '@/lib/api';
import { useChat } from '@/lib/useChat';
import ChatHome from '@/components/chat/ChatHome';
import IdentityHeader from '@/components/sections/IdentityHeader';
import ProfileSection from '@/components/sections/ProfileSection';
import ProjectsSection from '@/components/sections/ProjectsSection';

type Mode = 'chat' | 'portfolio';
type Backend = 'checking' | 'online' | 'offline';

const MODE_KEY = 'home_mode';

// 기본은 챗봇 중심 첫 화면. 다음 두 경우에는 일반 포트폴리오 페이지로 시작한다.
//  1) 백엔드가 꺼져 있을 때 (접속 시 자동 확인)
//  2) 방문자가 "챗봇 없이 포트폴리오 보기"를 눌렀을 때
export default function HomeExperience() {
  const chat = useChat();
  const [mode, setMode] = useState<Mode>('chat');
  const [backend, setBackend] = useState<Backend>('checking');

  useEffect(() => {
    // 정적 export라 서버 렌더는 항상 'chat' — 저장된 선택은 마운트 후에 복원해야 hydration이 어긋나지 않는다
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(MODE_KEY) === 'portfolio') setMode('portfolio');
    } catch {}

    checkBackend().then((ok) => {
      setBackend(ok ? 'online' : 'offline');
      if (!ok) setMode('portfolio');
    });
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    try {
      sessionStorage.setItem(MODE_KEY, next);
    } catch {}
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      {mode === 'chat' ? (
        <ChatHome chat={chat} onSkip={() => changeMode('portfolio')} />
      ) : (
        <>
          <section className="px-6 pt-20 pb-2">
            <div className="max-w-4xl mx-auto">
              <IdentityHeader />
            </div>
          </section>
          <PortfolioBanner backend={backend} onAsk={() => changeMode('chat')} />
        </>
      )}

      {/* 학력·교육·자격증·기술 스택 요약 → 프로젝트로 이어진다 */}
      <div id="portfolio">
        <ProfileSection />
        <div className="border-t border-zinc-900">
          <ProjectsSection />
        </div>
      </div>
    </>
  );
}

function PortfolioBanner({ backend, onAsk }: { backend: Backend; onAsk: () => void }) {
  if (backend === 'offline') {
    return (
      <div className="px-6 pt-6">
        <div className="max-w-4xl mx-auto rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-sm text-zinc-400 leading-relaxed">
          <span className="text-zinc-200 font-medium">AI 챗봇은 지금 쉬고 있어요.</span>{' '}
          상시 운영 비용 때문에 필요할 때만 서버를 켜 둡니다. 프로젝트와 프로필은 아래에서 그대로 보실 수
          있고, 전체 코드는{' '}
          <a
            href="https://github.com/noiskk/portfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
          >
            GitHub
          </a>
          에서 확인하실 수 있어요.
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 rounded-xl border border-blue-500/30 bg-blue-500/5 px-5 py-4">
        <p className="text-sm text-zinc-300">이 포트폴리오는 AI 챗봇에게 직접 물어볼 수도 있어요.</p>
        <button
          onClick={onAsk}
          className="shrink-0 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          <MessageCircle size={15} />
          AI에게 물어보기
        </button>
      </div>
    </div>
  );
}
