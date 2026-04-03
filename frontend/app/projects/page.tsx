import { fetchProjects, Project } from '@/lib/api';
import ProjectCard from '@/components/project/ProjectCard';

export default async function ProjectsPage() {
  let projects: Project[] = [];
  try {
    projects = await fetchProjects();
  } catch {
    // 백엔드 미실행 시 빈 상태 표시
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-blue-400 font-medium text-sm tracking-wide uppercase mb-2">
          Projects
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">전체 프로젝트</h1>
        <p className="text-zinc-400 text-sm">진행한 프로젝트 목록입니다.</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-sm">프로젝트 데이터를 불러올 수 없습니다.</p>
          <p className="text-zinc-600 text-xs mt-1">백엔드 서버를 확인해주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
