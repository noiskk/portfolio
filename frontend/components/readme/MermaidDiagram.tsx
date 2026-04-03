'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;

interface Props {
  code: string;
}

export default function MermaidDiagram({ code }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          background: '#18181b',
          primaryColor: '#3b82f6',
          primaryTextColor: '#f4f4f5',
          primaryBorderColor: '#3f3f46',
          lineColor: '#71717a',
          secondaryColor: '#27272a',
          tertiaryColor: '#18181b',
          edgeLabelBackground: '#27272a',
          nodeTextColor: '#f4f4f5',
        },
      });
      initialized = true;
    }

    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch((err) => {
        setError(String(err));
      });
  }, [code]);

  if (error) {
    return (
      <pre className="text-xs text-red-400 bg-zinc-800 p-4 rounded-lg overflow-x-auto">
        {code}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="flex justify-center my-2 overflow-x-auto [&>svg]:max-w-full"
    />
  );
}
