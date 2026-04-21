'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  restrictToSuggestions?: boolean;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions,
  placeholder,
  restrictToSuggestions = false,
  className,
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = input.length > 0
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(input.toLowerCase()) &&
          !value.includes(s)
      ).slice(0, 6)
    : [];

  useEffect(() => {
    setHighlighted(0);
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    if (restrictToSuggestions && !suggestions.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) {
        addTag(filtered[highlighted]);
      } else if (!restrictToSuggestions && input.trim()) {
        addTag(input);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className="flex min-h-[42px] flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand/50 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="text-brand/60 hover:text-brand"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.map((s, i) => (
            <li
              key={s}
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              onMouseEnter={() => setHighlighted(i)}
              className={cn(
                'cursor-pointer px-3 py-1.5 text-sm text-slate-700',
                i === highlighted && 'bg-brand/10 text-brand font-medium'
              )}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
