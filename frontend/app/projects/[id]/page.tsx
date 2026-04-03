import { fetchProject, fetchReadme } from '@/lib/api';
import { GitBranch, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReadmeRenderer from '@/components/readme/ReadmeRenderer';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);

  let project;
  try {
    project = await fetchProject(numId);
  } catch {
    notFound();
  }

  const readme = await fetchReadme(numId);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-10"
      >
        <ArrowLeft size={16} />
        Projects
      </Link>

      <div className="space-y-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
            {project.period && (
              <p className="text-zinc-500 text-sm mt-2">{project.period}</p>
            )}
          </div>
          <div className="flex gap-3 shrink-0 pt-1">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 transition-colors"
              >
                <GitBranch size={15} />
                GitHub
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 transition-colors"
              >
                <ExternalLink size={15} />
                Demo
              </a>
            )}
          </div>
        </div>

        {/* 설명 */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Overview
          </h2>
          <p className="text-zinc-300 leading-relaxed">{project.description}</p>
        </div>

        {/* 주요 기능 */}
        {project.highlights.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Highlights
            </h2>
            <ul className="space-y-3">
              {project.highlights.map((h, i) => (
                <li key={i} className="flex gap-3 text-zinc-300 text-sm leading-relaxed">
                  <span className="text-blue-500 mt-0.5 shrink-0">▸</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 기술 스택 */}
        {project.techStack.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-sm bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full border border-zinc-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* README */}
        {readme && (
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              README
            </h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 overflow-hidden">
              <ReadmeRenderer content={readme} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
