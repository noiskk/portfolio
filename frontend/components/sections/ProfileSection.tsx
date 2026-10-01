import { Award, BadgeCheck, BookOpen, GraduationCap, Languages, Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import GithubIcon from '@/components/ui/GithubIcon';

// 내용의 원본은 backend/src/main/resources/documents/profile.md, skills.md
// (챗봇이 참고하는 문서와 같은 사실을 보여줘야 하므로 수정 시 함께 갱신할 것)

interface Entry {
  title: string;
  sub?: string;
}

const EDUCATION: Entry[] = [
  { title: '가천대학교 소프트웨어학과', sub: '2019.03 ~ 2026.02 · 학점 3.75 / 4.5' },
];

const TRAINING: Entry[] = [
  { title: '우리FIS아카데미 클라우드 서비스 개발 과정 수료', sub: '2025.12 ~ 2026.06 · 금융권 특화 클라우드·백엔드·DevOps' },
];

const AWARDS: Entry[] = [
  { title: '우리FIS아카데미 최종프로젝트 최우수상', sub: 'SOFIT · 2026.06' },
  { title: '교내 졸업작품 최우수상', sub: 'BookCard · 2025' },
];

const CERTIFICATES: Entry[] = [
  { title: '정보처리기사', sub: '한국산업인력공단' },
  { title: 'SQLD', sub: '한국데이터산업진흥원' },
];

const LANGUAGES: Entry[] = [{ title: 'TOEIC Speaking IH', sub: 'Intermediate High' }];

// 핵심만. 전체 목록은 skills.md(챗봇 문서)에 있고, 챗봇에게 물어보면 더 자세히 답한다.
const SKILLS: { label: string; items: string[] }[] = [
  { label: 'Backend', items: ['Java', 'Spring Boot', 'JPA'] },
  { label: 'Data', items: ['MySQL', 'Redis'] },
  { label: 'Infra', items: ['AWS', 'Docker', 'CI/CD'] },
  { label: 'AI', items: ['RAG (Spring AI)'] },
];

export default function ProfileSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-10">
          <h2 className="text-3xl font-bold text-blue-400">About me</h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <a
              href="https://github.com/noiskk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <GithubIcon size={15} />
              github.com/noiskk
            </a>
            <a
              href="mailto:zionzion00@naver.com"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Mail size={15} />
              zionzion00@naver.com
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard icon={<GraduationCap size={16} />} label="학력" entries={EDUCATION} />
          <InfoCard icon={<BookOpen size={16} />} label="교육" entries={TRAINING} />
          <InfoCard icon={<Award size={16} />} label="수상" entries={AWARDS} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard icon={<BadgeCheck size={16} />} label="자격증" entries={CERTIFICATES} />
            <InfoCard icon={<Languages size={16} />} label="어학" entries={LANGUAGES} />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <CardLabel>기술 스택</CardLabel>
          {/* 오른쪽 여백이 남지 않도록 2열: 왼쪽 Backend·Data, 오른쪽 Infra·AI */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
            {[SKILLS.slice(0, 2), SKILLS.slice(2)].map((column, i) => (
              <dl key={i} className="space-y-3">
                {column.map((group) => (
                  <div key={group.label} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                    <dt className="sm:w-16 shrink-0 text-xs text-zinc-500">{group.label}</dt>
                    <dd className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="text-sm px-3 py-1 rounded-full border border-zinc-700/70 bg-zinc-800/60 text-zinc-300"
                        >
                          {item}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CardLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h3 className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
      {icon}
      {children}
    </h3>
  );
}

function InfoCard({ icon, label, entries }: { icon: ReactNode; label: string; entries: Entry[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <CardLabel icon={icon}>{label}</CardLabel>
      <ul className="mt-4 space-y-3">
        {entries.map((e) => (
          <li key={e.title}>
            <p className="text-sm font-medium text-zinc-100 leading-snug">{e.title}</p>
            {e.sub && <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{e.sub}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
