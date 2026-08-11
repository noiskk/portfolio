import { Message } from './FloatingChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  message: Message;
}

// 참고 문서 파일명 → 사용자에게 보여줄 표시명
const SOURCE_LABELS: Record<string, string> = {
  'profile.md': '프로필',
  'skills.md': '기술 스택',
  'projects.md': '프로젝트 개요',
  'sofit.md': 'SOFIT',
  'card-payment.md': '카드 결제 시스템',
  'card-3tier.md': '카드 조회 3티어',
  'bookcard.md': 'BookCard',
  'audit-log.md': '감사 로그 라이브러리',
};

function sourceLabel(filename: string): string {
  return SOURCE_LABELS[filename] ?? filename.replace(/\.md$/, '');
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white whitespace-pre-wrap'
            : 'bg-zinc-800 text-zinc-100'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
                >
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="bg-zinc-700 text-zinc-200 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="bg-zinc-700 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">{children}</pre>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className="border-collapse text-xs w-full">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-zinc-600 px-3 py-1.5 bg-zinc-700 font-semibold text-left">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-zinc-600 px-3 py-1.5">{children}</td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {/* 답변 근거가 된 참고 문서 표시 (RAG 검색 결과 출처) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-zinc-700/60 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500">참고</span>
            {message.sources.map((source) => (
              <span
                key={source}
                className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-700/60 text-zinc-300"
              >
                {sourceLabel(source)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
