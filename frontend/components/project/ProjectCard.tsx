import { Project } from '@/lib/api';
import { GitBranch, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  return (
    <div className="group bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-4 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white text-lg group-hover:text-blue-400 transition-colors">
            {project.title}
          </h3>
          {project.period && (
            <p className="text-xs text-zinc-500 mt-1">{project.period}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
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

      <Link
        href={`/projects/${project.id}`}
        className="mt-auto flex items-center gap-1 text-sm text-blue-500 hover:text-blue-400 transition-colors"
      >
        자세히 보기 <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
