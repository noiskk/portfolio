import { fetchProject, fetchProjectReadme } from '@/lib/api';
import { GitBranch, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReadmeAccordion from '@/components/project/ReadmeAccordion';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  let project;
  let readme: string | null = null;
  try {
    project = await fetchProject(Number(id));
    readme = await fetchProjectReadme(Number(id));
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 뒤로가기 */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-10"
      >
        <ArrowLeft size={15} />
        Projects
      </Link>

      <div className="space-y-10">
        {/* 헤더 */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              {project.period && (
                <p className="text-xs text-blue-400 font-medium mb-2">{project.period}</p>
              )}
              <h1 className="text-3xl font-bold text-white leading-tight">{project.title}</h1>
            </div>
            <div className="flex gap-2 shrink-0 pt-1">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 transition-colors"
                >
                  <GitBranch size={13} />
                  GitHub
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 transition-colors"
                >
                  <ExternalLink size={13} />
                  Demo
                </a>
              )}
            </div>
          </div>
          <p className="text-zinc-400 leading-relaxed">{project.description}</p>
        </div>

        {/* 담당 역할 */}
        {project.role && project.role.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <SectionLabel>담당 역할</SectionLabel>
            <ul className="mt-3 space-y-2">
              {project.role.map((r, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                  <span className="text-violet-400 mt-0.5 shrink-0">◆</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 기술 스택 */}
        {project.techStack.length > 0 && (
          <div>
            <SectionLabel>Tech Stack</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-3">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-xs bg-zinc-800/80 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700/60"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 주요 성과 */}
        {project.highlights.length > 0 && (
          <div>
            <SectionLabel>Highlights</SectionLabel>
            <ul className="mt-3 space-y-2.5">
              {project.highlights.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                  <span className="text-blue-500 mt-0.5 shrink-0">▸</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 트러블슈팅 */}
        {project.troubleshooting && project.troubleshooting.length > 0 && (
          <div>
            <SectionLabel>Troubleshooting</SectionLabel>
            <ul className="mt-3 space-y-3">
              {project.troubleshooting.map((item, i) => {
                const [problem, solution] = item.includes(' → ') ? item.split(' → ') : [item, null];
                return (
                  <li key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                    <p className="text-sm text-zinc-200 font-medium leading-relaxed">{problem}</p>
                    {solution && (
                      <p className="text-sm text-emerald-400 mt-1.5 leading-relaxed">
                        → {solution}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* README 토글 */}
        {readme && <ReadmeAccordion content={readme} />}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
      {children}
    </h2>
  );
}
