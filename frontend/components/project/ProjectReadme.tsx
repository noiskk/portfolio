'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Mermaid 다이어그램을 렌더링하는 컴포넌트
function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    import('mermaid').then((m) => {
      if (cancelled || !ref.current) return;
      const mermaid = m.default;
      mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      mermaid.render(id, code).then(({ svg }) => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      }).catch(() => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = `<pre class="text-red-400 text-xs">${code}</pre>`;
        }
      });
    });
    return () => { cancelled = true; };
  }, [code]);

  return <div ref={ref} className="my-4 flex justify-center overflow-x-auto" />;
}

interface Props {
  content: string;
}

export default function ProjectReadme({ content }: Props) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:text-white prose-headings:font-semibold
      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
      prose-p:text-zinc-300 prose-p:leading-relaxed
      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
      prose-strong:text-white
      prose-code:text-emerald-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
      prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0
      prose-blockquote:border-zinc-600 prose-blockquote:text-zinc-400
      prose-li:text-zinc-300
      prose-hr:border-zinc-700
      prose-table:text-zinc-300
      prose-th:text-zinc-200 prose-th:border-zinc-700
      prose-td:border-zinc-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // 이미지 깨질 때 fallback 처리
          img({ src, alt }) {
            return (
              <img
                src={src}
                alt={alt ?? ''}
                className="max-w-full rounded-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? '');
            const lang = match?.[1] ?? '';
            const raw = String(children);
            // 블록 코드는 react-markdown이 children 끝에 \n을 붙임
            const isBlock = raw.endsWith('\n');
            const code = raw.replace(/\n$/, '');

            // inline code
            if (!isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            // mermaid 다이어그램
            if (lang === 'mermaid') {
              return <MermaidBlock code={code} />;
            }

            // 언어 없는 블록 코드 → 깔끔한 plain pre 스타일
            if (!lang) {
              return (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 my-4 overflow-x-auto">
                  <pre className="text-zinc-300 text-sm font-mono whitespace-pre m-0">{code}</pre>
                </div>
              );
            }

            // 언어 있는 코드 블록 → syntax highlight
            return (
              <SyntaxHighlighter
                style={oneDark}
                language={lang}
                PreTag="div"
                customStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #3f3f46',
                  fontSize: '0.8rem',
                  margin: 0,
                }}
              >
                {code}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
