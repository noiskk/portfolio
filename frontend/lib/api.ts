const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export async function* streamChatMessage(sessionId: string, message: string): AsyncGenerator<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  });
  if (!res.ok) throw new Error('Chat request failed');

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processEvent = function* (event: string) {
    // 하나의 SSE 이벤트 안에 있는 data: 라인들을 \n으로 합쳐서 반환
    const dataLines = event
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5));
    if (dataLines.length > 0) {
      yield dataLines.join('\n');
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 이벤트는 \n\n 으로 구분
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const event of events) {
      yield* processEvent(event);
    }
  }

  if (buffer) {
    yield* processEvent(buffer);
  }
}

export interface Project {
  id: number;
  title: string;
  description: string;
  period: string;
  githubUrl: string | null;
  demoUrl: string | null;
  techStack: string[];
  role: string[];
  highlights: string[];
  troubleshooting: string[];
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE_URL}/api/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchProject(id: number): Promise<Project> {
  const res = await fetch(`${BASE_URL}/api/projects/${id}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

export async function fetchProjectReadme(id: number): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/api/projects/${id}/readme`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch readme');
  return res.text();
}
