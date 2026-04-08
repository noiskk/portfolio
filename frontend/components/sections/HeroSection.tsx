import { Mail, MapPin } from 'lucide-react';

// lucide-react v1.x에서 Github 아이콘 제거됨 → 직접 SVG 사용
function GithubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

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
                개발자 포트폴리오
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
                <GithubIcon size={15} />
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
