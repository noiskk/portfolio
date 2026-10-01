'use client';

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  big?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, big, autoFocus, placeholder }: Props) {
  const [value, setValue] = useState('');

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // 한글 조합 중 Enter는 전송하지 않음
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div
      className={`flex items-end gap-3 bg-zinc-900 border border-zinc-700 focus-within:border-blue-500/70 focus-within:shadow-lg focus-within:shadow-blue-500/10 transition-all ${
        big ? 'rounded-2xl px-5 py-4' : 'rounded-xl px-4 py-3'
      }`}
    >
      <textarea
        className={`flex-1 bg-transparent text-white placeholder-zinc-500 resize-none outline-none max-h-32 ${
          big ? 'text-base py-1' : 'text-sm py-0.5'
        }`}
        placeholder={placeholder ?? '궁금한 점을 입력하세요...'}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="전송"
        className="shrink-0 p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
      >
        <Send size={big ? 18 : 16} />
      </button>
    </div>
  );
}
