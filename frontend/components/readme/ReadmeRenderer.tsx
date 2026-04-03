'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MermaidDiagram from './MermaidDiagram';
import type { ComponentProps } from 'react';

type CodeProps = ComponentProps<'code'> & { inline?: boolean };

function CodeBlock({ inline, className, children, ...props }: CodeProps) {
  const match = /language-(\w+)/.exec(className ?? '');
  const language = match?.[1] ?? '';
  const code = String(children).replace(/\n$/, '');

  if (inline || !language) {
    return (
      <code
        className="text-emerald-300 bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  if (language === 'mermaid') {
    return <MermaidDiagram code={code} />;
  }

  return (
    <div className="rounded-xl border border-zinc-600 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-700/60 border-b border-zinc-600">
        <span className="text-xs text-zinc-400 font-mono">{language}</span>
      </div>
      <div style={{ padding: '1.1rem 1.4rem', background: '#1c1c27', overflowX: 'auto' }}>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            border: 'none',
            fontSize: '0.8rem',
            lineHeight: '1.7',
          }}
          lineNumberStyle={{
            color: '#52525b',
            minWidth: '2em',
            paddingRight: '1.2em',
            userSelect: 'none',
          }}
          showLineNumbers={code.split('\n').length > 5}
          wrapLines={true}
          lineProps={{ style: { background: 'transparent', display: 'block' } }}
          wrapLongLines={false}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

interface Props {
  content: string;
}

export default function ReadmeRenderer({ content }: Props) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:text-white prose-headings:font-semibold prose-headings:border-b prose-headings:border-zinc-800 prose-headings:pb-2
      prose-h1:text-2xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm
      prose-p:text-zinc-300 prose-p:leading-relaxed
      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-300
      prose-strong:text-zinc-100 prose-strong:font-semibold
      prose-em:text-zinc-300
      prose-pre:!p-0 prose-pre:!bg-transparent prose-pre:!border-none prose-pre:!rounded-none prose-pre:overflow-visible
      prose-blockquote:border-l-2 prose-blockquote:border-blue-500 prose-blockquote:bg-zinc-800/40 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:rounded-r-lg prose-blockquote:text-zinc-400 prose-blockquote:not-italic
      prose-ul:text-zinc-300 prose-ol:text-zinc-300
      prose-li:text-zinc-300 prose-li:marker:text-zinc-500
      prose-hr:border-zinc-700 prose-hr:my-6
      prose-img:rounded-lg prose-img:max-w-full
      prose-table:w-full prose-table:text-sm
      prose-th:bg-zinc-800 prose-th:text-zinc-200 prose-th:font-semibold prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-zinc-700
      prose-td:text-zinc-300 prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-zinc-700
      prose-thead:border-b-2 prose-thead:border-zinc-600
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{ code: CodeBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
