'use client';

import { useEffect, useState } from 'react';
import { fetchProject, fetchProjectReadme, Project } from '@/lib/api';
import { FALLBACK_PROJECTS } from '@/lib/fallback-projects';
import {
  HighlightItem,
  PROJECT_DETAILS,
  ProjectDetailContent,
  TECH_CHOICES,
  TroubleItem,
} from '@/lib/project-details';
import { ArrowLeft, ArrowRight, ExternalLink, GitBranch, Users } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import ReadmeAccordion from '@/components/project/ReadmeAccordion';

interface Props {
  id: number;
}

// 정적 export(GitHub Pages) 환경에서는 빌드 타임에 백엔드가 없으므로 클라이언트에서 fetch.
// 백엔드가 중지된 동안에도 프로젝트는 보여야 하므로 실패 시 스냅샷으로 대체한다.
// 상세 본문(요약·수치·핵심 구현·트러블슈팅)은 정적 콘텐츠(lib/project-details.ts)를 쓰기 때문에
// 백엔드와 무관하게 항상 표시되고, README 원문만 백엔드에서 온다.
export default function ProjectDetail({ id }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    Promise.all([fetchProject(id), fetchProjectReadme(id)])
      .then(([projectData, readmeData]) => {
        setProject(projectData);
        setReadme(readmeData);
        setStatus('ready');
      })
      .catch(() => {
        const snapshot = FALLBACK_PROJECTS.find((p) => p.id === id);
        setProject(snapshot ?? null);
        setStatus(snapshot ? 'ready' : 'error');
      });
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="h-5 w-24 rounded bg-zinc-900/60 animate-pulse mb-10" />
        <div className="h-56 rounded-2xl bg-zinc-900/60 animate-pulse mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-900/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error' || !project) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <BackLink />
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-sm">존재하지 않는 프로젝트입니다.</p>
          <Link href="/projects" className="text-blue-400 text-xs mt-2 inline-block hover:underline">
            전체 프로젝트 보기
          </Link>
        </div>
      </div>
    );
  }

  const content = PROJECT_DETAILS[project.id] ?? deriveContent(project);
  const techChoices = TECH_CHOICES[project.id] ?? [];
  const index = FALLBACK_PROJECTS.findIndex((p) => p.id === project.id);
  const prev = index > 0 ? FALLBACK_PROJECTS[index - 1] : null;
  const next = index >= 0 && index < FALLBACK_PROJECTS.length - 1 ? FALLBACK_PROJECTS[index + 1] : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <BackLink />

      {/* 상단 요약 */}
      <header className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/30 p-7 sm:p-9">
        {project.period && (
          <p className="text-sm text-blue-400 font-medium mb-3">{project.period}</p>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">{project.title}</h1>
        <p className="text-zinc-300 text-base sm:text-lg leading-relaxed">{content.tagline}</p>

        {(content.teamLabel || project.githubUrl || project.demoUrl) && (
          <div className="flex flex-wrap items-center gap-3 mt-6">
            {content.teamLabel && (
              <span className="inline-flex items-center gap-2 text-sm text-zinc-300 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/60">
                <Users size={14} className="text-zinc-500" />
                {content.teamLabel}
              </span>
            )}
            {project.githubUrl && (
              <ExternalButton href={project.githubUrl} icon={<GitBranch size={14} />}>
                GitHub
              </ExternalButton>
            )}
            {project.demoUrl && (
              <ExternalButton href={project.demoUrl} icon={<ExternalLink size={14} />}>
                Demo
              </ExternalButton>
            )}
          </div>
        )}
      </header>

      <div className="mt-12 space-y-14">
        {/* 담당 역할 */}
        {project.role && project.role.length > 0 && (
          <section>
            <SectionTitle>담당 역할</SectionTitle>
            <ul className="rounded-2xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
              {project.role.map((r, i) => (
                <li key={i} className="px-5 py-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 기술 스택 */}
        {project.techStack.length > 0 && (
          <section>
            <SectionTitle>기술 스택</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-sm bg-zinc-800/70 text-zinc-300 px-3.5 py-1.5 rounded-full border border-zinc-700/60"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 기술 선택 이유 — 무엇을 왜 골랐는지(비교한 대안이 있으면 함께) */}
        {techChoices.length > 0 && (
          <section>
            <SectionTitle>기술 선택 이유</SectionTitle>
            <div className="space-y-3">
              {techChoices.map((c) => (
                <article
                  key={c.tech}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[13rem_1fr] gap-x-6 gap-y-2"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white leading-snug">{c.tech}</h3>
                    {c.vs && (
                      <p className="mt-1.5 text-xs text-zinc-500 leading-snug">
                        <span className="text-zinc-600">vs</span> {c.vs}
                      </p>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">{c.reason}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 핵심 구현 */}
        {content.highlights.length > 0 && (
          <section>
            <SectionTitle>핵심 구현</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.highlights.map((h, i) => (
                <article
                  key={i}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:[&:last-child:nth-child(odd)]:col-span-2"
                >
                  <span className="text-xs font-semibold text-blue-400 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {h.title && <h3 className="text-base font-semibold text-white mt-2 leading-snug">{h.title}</h3>}
                  <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{h.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 트러블슈팅 */}
        {content.troubleshooting.length > 0 && (
          <section>
            <SectionTitle>트러블슈팅</SectionTitle>
            <div className="space-y-4">
              {content.troubleshooting.map((t, i) => (
                <article key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <dl className="space-y-4">
                    <TroubleRow label="문제" tone="rose">
                      <span className="font-medium text-white">{t.problem}</span>
                    </TroubleRow>
                    {t.cause && (
                      <TroubleRow label="원인" tone="amber">
                        {t.cause}
                      </TroubleRow>
                    )}
                    <TroubleRow label="해결" tone="emerald">
                      {t.solution}
                    </TroubleRow>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* README 원문 (백엔드가 켜져 있을 때만) */}
        {readme && (
          <section>
            <ReadmeAccordion content={readme} />
          </section>
        )}
      </div>

      {/* 이전 / 다음 프로젝트 */}
      <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 pt-8 border-t border-zinc-900">
        {prev ? <PagerLink project={prev} direction="prev" /> : <span />}
        {next ? <PagerLink project={next} direction="next" /> : <span />}
      </nav>
    </div>
  );
}

// 정적 콘텐츠가 없는 프로젝트(새로 추가했는데 project-details.ts를 아직 안 채운 경우)도
// 기존 문자열 데이터로 최소한의 상세 페이지가 그려지게 한다.
function deriveContent(project: Project): ProjectDetailContent {
  const highlights: HighlightItem[] = project.highlights.map((text) => {
    const [title, ...rest] = text.split(' — ');
    return rest.length > 0 ? { title, body: rest.join(' — ') } : { title: '', body: text };
  });
  const troubleshooting: TroubleItem[] = (project.troubleshooting ?? []).map((text) => {
    const [front, solution] = text.split(' → ');
    const [problem, ...cause] = front.split(' — ');
    return { problem, cause: cause.join(' — '), solution: solution ?? '' };
  });
  return { tagline: project.description, highlights, troubleshooting };
}

function BackLink() {
  return (
    <Link
      href="/projects"
      className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
    >
      <ArrowLeft size={15} />
      Projects
    </Link>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold text-blue-400 mb-5">{children}</h2>;
}

function ExternalButton({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-full px-3.5 py-1.5 transition-colors"
    >
      {icon}
      {children}
    </a>
  );
}

const TONES = {
  rose: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
  amber: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
} as const;

function TroubleRow({
  label,
  tone,
  children,
}: {
  label: string;
  tone: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <dt className="shrink-0 sm:w-14">
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border ${TONES[tone]}`}>
          {label}
        </span>
      </dt>
      <dd className="text-sm sm:text-base text-zinc-300 leading-relaxed">{children}</dd>
    </div>
  );
}

function PagerLink({ project, direction }: { project: Project; direction: 'prev' | 'next' }) {
  const isNext = direction === 'next';
  return (
    <Link
      href={`/projects/${project.id}`}
      className={`group rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 hover:border-zinc-600 transition-colors ${
        isNext ? 'sm:text-right' : ''
      }`}
    >
      <p
        className={`inline-flex items-center gap-1.5 text-xs text-zinc-500 mb-1 ${
          isNext ? 'sm:flex-row-reverse' : ''
        }`}
      >
        {isNext ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
        {isNext ? '다음 프로젝트' : '이전 프로젝트'}
      </p>
      <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors leading-snug">
        {project.title}
      </p>
    </Link>
  );
}
