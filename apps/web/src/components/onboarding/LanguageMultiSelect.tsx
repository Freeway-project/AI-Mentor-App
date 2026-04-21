'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MENTOR_LANGUAGE_OPTIONS } from '@/data/mentor-languages';

interface LanguageMultiSelectProps {
  selected: string[];
  onChange: (languages: string[]) => void;
}

export function LanguageMultiSelect({ selected, onChange }: LanguageMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const options = useMemo(() => {
    const sel = new Set(selected.map((s) => s.toLowerCase()));
    const qn = q.trim().toLowerCase();
    return MENTOR_LANGUAGE_OPTIONS.filter((lang) => {
      if (sel.has(lang.toLowerCase())) return false;
      return !qn || lang.toLowerCase().includes(qn);
    }).slice(0, 80);
  }, [q, selected]);

  const add = (lang: string) => {
    if (selected.some((s) => s.toLowerCase() === lang.toLowerCase())) return;
    onChange([...selected, lang]);
    setQ('');
  };

  const remove = (lang: string) => {
    onChange(selected.filter((s) => s !== lang));
  };

  return (
    <div ref={rootRef} className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        Languages you can mentor in
      </label>
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {selected.map((lang) => (
          <span
            key={lang}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-50 border border-violet-200 px-2 py-0.5 text-sm text-violet-900"
          >
            {lang}
            <button
              type="button"
              className="rounded p-0.5 text-violet-600 hover:bg-violet-100"
              onClick={() => remove(lang)}
              aria-label={`Remove ${lang}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-900 shadow-sm',
            'hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand/30'
          )}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="text-slate-500">{open ? 'Search languages…' : 'Add a language…'}</span>
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
            <input
              type="search"
              className="w-full border-b border-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none rounded-t-xl"
              placeholder="Filter (e.g. Hindi, Spanish)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            <ul className="max-h-48 overflow-auto py-1">
              {options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
              ) : (
                options.map((lang) => (
                  <li key={lang}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => add(lang)}
                    >
                      {lang}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">Select all languages you are comfortable mentoring in.</p>
    </div>
  );
}
