const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// SSE 스트림 이벤트: 백엔드가 출처(sources) 이벤트를 먼저 보내고 답변 텍스트를 이어보냄
export type ChatStreamEvent =
  | { type: 'content'; data: string }
  | { type: 'sources'; data: string[] };

// 분당 요청 제한(429) 전용 에러 — UI에서 안내 메시지를 구분해 보여주기 위함
export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

export async function* streamChatMessage(
  sessionId: string,
  message: string,
): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  });
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) throw new Error('Chat request failed');

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processEvent = function* (event: string): Generator<ChatStreamEvent> {
    const lines = event.split('\n');

    // event: 라인으로 이벤트 타입 구분 (없으면 기본 message = 답변 텍스트)
    const eventType =
      lines.find((line) => line.startsWith('event:'))?.slice(6).trim() ?? 'message';

    // 하나의 SSE 이벤트 안에 있는 data: 라인들을 \n으로 합침 (멀티라인 답변 보존)
    const dataLines = lines
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5));
    if (dataLines.length === 0) return;
    const data = dataLines.join('\n');

    if (eventType === 'sources') {
      try {
        yield { type: 'sources', data: JSON.parse(data) as string[] };
      } catch {
        // 출처 파싱 실패는 답변 표시에 치명적이지 않으므로 무시
      }
    } else {
      yield { type: 'content', data };
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
