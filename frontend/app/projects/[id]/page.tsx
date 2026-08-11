import ProjectDetail from '@/components/project/ProjectDetail';

// 정적 export 제약: 동적 세그먼트는 빌드 타임에 경로가 확정돼야 함.
// DataInitializer가 TRUNCATE로 재시딩해 ID는 항상 1부터 순차 부여됨 → 1~6 고정.
// 프로젝트를 추가하면 이 목록도 함께 늘려야 한다.
export function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6].map((id) => ({ id: String(id) }));
}

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProjectDetail id={Number(id)} />;
}
