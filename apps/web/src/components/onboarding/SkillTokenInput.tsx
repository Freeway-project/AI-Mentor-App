'use client';

import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { appTheme } from '@/components/ui/app-theme';

interface SkillTokenInputProps {
  label: ReactNode;
  hint?: React.ReactNode;
  tokens: string[];
  onChange: (tokens: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}

export function SkillTokenInput({
  label,
  hint,
  tokens,
  onChange,
  suggestions,
  placeholder = 'Type and select suggestions or press Enter…',
}: SkillTokenInputProps) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase();
    const set = new Set(tokens.map((t) => t.toLowerCase()));
    return suggestions
      .filter((s) => !set.has(s.toLowerCase()))
      .filter((s) => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 10);
  }, [draft, suggestions, tokens]);

  const addToken = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const lower = t.toLowerCase();
    if (tokens.some((x) => x.toLowerCase() === lower)) return;
    onChange([...tokens, t]);
    setDraft('');
    setOpen(false);
  };

  const removeAt = (i: number) => {
    onChange(tokens.filter((_, j) => j !== i));
  };

  const inputCls = cn(appTheme.input, 'text-sm py-2 px-3');

  return (
    <div ref={containerRef} className="space-y-1.5">
      {typeof label === 'string' ? (
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
      ) : (
        label
      )}
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-[46px] rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-brand/30'
        )}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget)) setOpen(false);
        }}
      >
        {tokens.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-sm text-slate-800"
          >
            {t}
            <button
              type="button"
              className="rounded p-0.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${t}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          className={cn(inputCls, 'flex-1 min-w-[120px] border-0 shadow-none ring-0 focus:ring-0 px-1 py-1')}
          value={draft}
          placeholder={tokens.length === 0 ? placeholder : ''}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addToken(draft.replace(/,$/, ''));
            } else if (e.key === 'Backspace' && !draft && tokens.length) {
              removeAt(tokens.length - 1);
            }
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul
          className="z-20 max-h-40 overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg"
          role="listbox"
        >
          {filtered.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-slate-800 hover:bg-slate-50"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => addToken(s)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      {hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
    </div>
  );
}
