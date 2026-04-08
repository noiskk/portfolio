'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ProjectReadme from './ProjectReadme';

interface Props {
  content: string;
}

export default function ReadmeAccordion({ content }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-zinc-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900 hover:bg-zinc-800 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">README 전체 보기</span>
        <ChevronDown
          size={18}
          className={`text-zinc-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 py-6 border-t border-zinc-700 bg-zinc-950">
          <ProjectReadme content={content} />
        </div>
      )}
    </div>
  );
}
