import { Project } from '@/lib/api';
import { GitBranch, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  return (
    <div className="relative group bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-4 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 cursor-pointer">
      {/* 전체 카드 클릭 영역 — z-10으로 콘텐츠 위를 덮음 */}
      <Link href={`/projects/${project.id}`} className="absolute inset-0 z-10 rounded-2xl" aria-label={project.title} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white text-lg group-hover:text-blue-400 transition-colors">
            {project.title}
          </h3>
          {project.period && (
            <p className="text-xs text-zinc-500 mt-1">{project.period}</p>
          )}
        </div>
        {/* GitHub/Demo 버튼은 z-20으로 Link보다 위 */}
        <div className="relative z-20 flex gap-2 shrink-0">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
              className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800">
              <GitBranch size={16} />
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
              className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800">
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{project.description}</p>

      {project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.map((tech) => (
            <span key={tech}
              className="text-xs bg-zinc-800/80 text-zinc-400 px-2.5 py-1 rounded-full border border-zinc-800">
              {tech}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-1 text-sm text-blue-500">
        자세히 보기 <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}
