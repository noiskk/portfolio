'use client';

import { useEffect, useState } from 'react';
import { fetchProjects, Project } from '@/lib/api';
import ProjectCard from '@/components/project/ProjectCard';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

// 정적 export(GitHub Pages) 환경에서는 빌드 타임에 백엔드가 없으므로
// 클라이언트에서 fetch → 항상 백엔드의 최신 데이터를 보여줌
export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        setProjects(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
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
        ) : status === 'error' || projects.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 text-sm">프로젝트 데이터를 불러올 수 없습니다.</p>
            <p className="text-zinc-600 text-xs mt-1">백엔드 서버가 오프라인 상태일 수 있습니다.</p>
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
