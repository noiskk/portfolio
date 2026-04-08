'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-zinc-800 px-4 py-4">
      <div className="flex items-end gap-2 bg-zinc-800 rounded-2xl px-4 py-3">
        <textarea
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 resize-none outline-none max-h-32"
          placeholder="메시지를 입력하세요... (Enter로 전송)"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="text-blue-500 hover:text-blue-400 disabled:text-zinc-600 transition-colors shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
