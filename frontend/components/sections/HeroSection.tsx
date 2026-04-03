import { GitBranch, Mail, MapPin } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* 프로필 이미지 */}
          <div className="shrink-0">
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-5xl font-bold text-white shadow-lg shadow-blue-500/20">
              S
            </div>
          </div>

          {/* 프로필 정보 */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-blue-400 font-medium text-sm tracking-wide uppercase mb-2">
              Backend Developer
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              안녕하세요,<br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                개발자 김시온
              </span>입니다.
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mb-6">
              새로운 기술을 배우고 적용하는 것을 좋아하며,
              문제를 해결하는 과정에서 성장하는 개발자입니다.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                <MapPin size={15} className="text-zinc-500" />
                Seoul, Korea
              </span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <GitBranch size={15} />
                GitHub
              </a>
              <a
                href="mailto:hello@example.com"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <Mail size={15} />
                Contact
              </a>
            </div>
          </div>
        </div>

        {/* 스킬 태그 */}
        <div className="mt-14 flex flex-wrap justify-center md:justify-start gap-2">
          {['Java', 'Spring Boot', 'Python', 'React', 'Next.js', 'Docker', 'AWS', 'MySQL', 'Redis'].map(
            (skill) => (
              <span
                key={skill}
                className="text-sm px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
              >
                {skill}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
