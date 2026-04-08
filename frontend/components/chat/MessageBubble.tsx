import { Message } from './FloatingChat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  message: Message;
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
      </div>
    </div>
  );
}
