import HeroSection from '@/components/sections/HeroSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import FloatingChat from '@/components/chat/FloatingChat';

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="border-t border-zinc-900">
        <ProjectsSection />
      </div>

      {/* 하단 플로팅 채팅 */}
      <FloatingChat />

      {/* 채팅바가 가리지 않도록 하단 여백 */}
      <div className="h-28" />
    </>
  );
}
