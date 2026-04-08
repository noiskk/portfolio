import { fetchProjects, Project } from '@/lib/api';
import ProjectCard from '@/components/project/ProjectCard';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function ProjectsSection() {
  let projects: Project[] = [];
  try {
    projects = await fetchProjects();
  } catch {
    // 백엔드 미실행 시 빈 상태
  }

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

        {projects.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 text-sm">프로젝트 데이터를 불러올 수 없습니다.</p>
            <p className="text-zinc-600 text-xs mt-1">백엔드 서버를 확인해주세요.</p>
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
