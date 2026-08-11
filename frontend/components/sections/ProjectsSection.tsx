'use client';

import { useEffect, useState } from 'react';
import { fetchProjects, Project } from '@/lib/api';
import { FALLBACK_PROJECTS } from '@/lib/fallback-projects';
import ProjectCard from '@/components/project/ProjectCard';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

// 정적 export(GitHub Pages) 환경에서는 빌드 타임에 백엔드가 없으므로 클라이언트에서 fetch.
// 백엔드가 중지된 동안에도 프로젝트는 보여야 하므로 실패 시 스냅샷으로 대체한다.
export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(() => setProjects(FALLBACK_PROJECTS))
      .finally(() => setStatus('ready'));
  }, []);

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-blue-400 font-medium text-sm tracking-wide uppercase mb-2">
              Projects
            </p>
            <h2 className="text-3xl font-bold text-white">
              진행한 프로젝트
            </h2>
          </div>
          <Link
            href="/projects"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            전체 보기 <ArrowRight size={14} />
          </Link>
        </div>

        {status === 'loading' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.slice(0, 4).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <Link
          href="/projects"
          className="sm:hidden mt-8 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          전체 보기 <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
