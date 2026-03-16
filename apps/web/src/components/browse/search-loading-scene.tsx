'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, BrainCircuit, Search, Sparkles, Users } from 'lucide-react';
import { AppPanel, AppStatusBadge } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';

const SEARCH_STEPS = [
  {
    icon: Search,
    title: 'Reading your goal',
    body: 'Natural phrasing is being converted into a cleaner learning intent.',
    accent: 'from-sky-400/25 via-cyan-300/10 to-transparent',
  },
  {
    icon: BrainCircuit,
    title: 'Matching mentor signals',
    body: 'Profiles, specialties, and teaching fit are being compared right now.',
    accent: 'from-violet-400/25 via-fuchsia-300/10 to-transparent',
  },
  {
    icon: Users,
    title: 'Preparing best-fit results',
    body: 'The shortlist is being tuned toward mentors who can teach this well.',
    accent: 'from-amber-300/25 via-orange-300/10 to-transparent',
  },
] as const;

function buildBoardLines(query?: string) {
  const fallback = 'Finding the right mentor';
  const value = (query?.trim().replace(/\s+/g, ' ') || fallback).slice(0, 52);
  const words = value.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 22 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }

    if (lines.length === 2) break;
  }

  if (lines.length < 2 && current) lines.push(current);
  return lines.slice(0, 2);
}

export function SearchLoadingScene({
  className,
  query,
}: {
  className?: string;
  query?: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const boardLines = useMemo(() => buildBoardLines(query), [query]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveStep(current => (current + 1) % SEARCH_STEPS.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <AppPanel
      className={cn(
        'relative overflow-hidden border-white/10 bg-slate-950/80 p-0 shadow-[0_24px_90px_rgba(2,6,23,0.55)]',
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.18),transparent_24%),radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_24%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]" />
      <div className="absolute left-[-8rem] top-[-5rem] h-72 w-72 rounded-full bg-amber-300/15 blur-[120px]" />
      <div className="absolute right-[-5rem] top-[-6rem] h-80 w-80 rounded-full bg-sky-300/12 blur-[140px]" />
      <div className="absolute bottom-[-7rem] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-400/10 blur-[120px]" />

      <div className="relative grid gap-6 p-5 md:p-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/55 p-3 md:p-4 shadow-inner shadow-slate-950/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_40%)]" />
          <motion.div
            className="absolute right-10 top-8 h-20 w-20 rounded-full bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500 shadow-[0_0_60px_rgba(251,191,36,0.45)]"
            animate={{ scale: [1, 1.06, 1], opacity: [0.95, 1, 0.92] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-1 top-[-2rem] h-48 w-48 rounded-full border border-amber-200/15"
            animate={{ rotate: [0, 8, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-4 top-0 h-40 w-40 rounded-full border border-amber-100/10"
            animate={{ rotate: [0, -10, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />

          <svg
            viewBox="0 0 640 400"
            className="relative z-10 mx-auto aspect-[16/10] h-auto w-full max-h-[320px]"
            role="img"
            aria-label="Animated classroom scene while mentor search is running"
          >
            <defs>
              <linearGradient id="board-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#123048" />
                <stop offset="100%" stopColor="#071521" />
              </linearGradient>
              <linearGradient id="floor-fill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>

            <ellipse cx="350" cy="326" rx="228" ry="22" fill="rgba(15,23,42,0.62)" />
            <rect x="142" y="88" width="270" height="150" rx="22" fill="url(#board-fill)" stroke="rgba(255,255,255,0.10)" />
            <rect x="164" y="110" width="226" height="106" rx="14" fill="rgba(8,47,73,0.78)" stroke="rgba(125,211,252,0.16)" />

            {boardLines.map((line, index) => (
              <motion.text
                key={line}
                x="192"
                y={142 + index * 34}
                fill="rgba(224,242,254,0.92)"
                fontSize="22"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                initial={{ opacity: 0.35 }}
                animate={{ opacity: [0.35, 1, 0.72] }}
                transition={{ duration: 2.4, delay: index * 0.18, repeat: Infinity, ease: 'easeInOut' }}
              >
                {line}
              </motion.text>
            ))}

            <motion.rect
              x="192"
              y="188"
              width="146"
              height="8"
              rx="4"
              fill="rgba(125,211,252,0.45)"
              animate={{ width: [146, 178, 146] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.rect
              x="192"
              y="204"
              width="108"
              height="7"
              rx="3.5"
              fill="rgba(244,244,245,0.30)"
              animate={{ width: [108, 132, 108] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <rect x="263" y="238" width="26" height="66" rx="12" fill="#5b4634" />
            <rect x="314" y="238" width="26" height="66" rx="12" fill="#5b4634" />
            <rect x="227" y="300" width="150" height="16" rx="8" fill="#5b4634" />

            <rect x="0" y="318" width="640" height="82" fill="url(#floor-fill)" />

            <motion.g
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ellipse cx="450" cy="292" rx="44" ry="12" fill="rgba(15,23,42,0.55)" />
              <circle cx="448" cy="156" r="24" fill="#fed7aa" />
              <path d="M424 188c12-16 42-18 54 0v77h-54z" fill="#2563eb" />
              <path d="M433 162c6-14 26-18 36-6 3 4 5 8 5 14-14-8-29-8-41-1z" fill="#1e293b" />
              <motion.path
                d="M438 214L397 242"
                stroke="#fde68a"
                strokeWidth="7"
                strokeLinecap="round"
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '438px 214px' }}
              />
              <circle cx="395" cy="242" r="7" fill="#fbbf24" />
            </motion.g>

            {[0, 1, 2].map(index => {
              const x = 136 + index * 100;
              const delay = index * 0.24;
              return (
                <motion.g
                  key={x}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.3, delay, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <rect x={x - 34} y="282" width="68" height="16" rx="8" fill="#7c5a45" />
                  <rect x={x - 30} y="296" width="60" height="12" rx="6" fill="#5b4634" />
                  <circle cx={x} cy="246" r="18" fill={index === 1 ? '#f5d0fe' : '#fed7aa'} />
                  <path
                    d={`M${x - 24} 272c12-18 36-18 48 0v20h-48z`}
                    fill={index === 1 ? '#7c3aed' : index === 2 ? '#0f766e' : '#ea580c'}
                  />
                </motion.g>
              );
            })}

            {[0, 1, 2, 3].map(index => (
              <motion.circle
                key={index}
                cx={122 + index * 104}
                cy={74 + (index % 2) * 26}
                r={index % 2 === 0 ? 4 : 3}
                fill={index % 2 === 0 ? 'rgba(251,191,36,0.85)' : 'rgba(125,211,252,0.85)'}
                animate={{ y: [0, -10, 0], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 2.8 + index * 0.25, delay: index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </svg>
        </div>

        <div className="space-y-4">
          <AppStatusBadge tone="amber" className="border-amber-300/20 bg-amber-300/10 text-amber-200">
            AI mentor matching in progress
          </AppStatusBadge>

          <div className="space-y-2.5">
            <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-white md:text-[1.95rem]">
              A brighter search moment while the app finds the right teacher.
            </h2>
            <p className="max-w-lg text-sm leading-6 text-slate-300">
              The search now feels active instead of blank: a classroom scene, a teaching moment,
              and a warm light treatment while the best-fit mentors are being prepared.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
              Current Search
            </p>
            <p className="mt-2 text-sm text-slate-200">
              {query?.trim() ? `"${query.trim()}"` : 'Looking across mentor profiles and teaching strengths'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {SEARCH_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;

              return (
                <motion.div
                  key={step.title}
                  className={cn(
                    'relative overflow-hidden rounded-3xl border px-4 py-3.5 transition-all duration-300',
                    isActive
                      ? 'border-white/15 bg-white/[0.08] shadow-[0_18px_45px_rgba(15,23,42,0.38)]'
                      : 'border-white/8 bg-slate-950/45'
                  )}
                  animate={{ scale: isActive ? 1.015 : 1, opacity: isActive ? 1 : 0.72 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                  <div className={cn('absolute inset-0 bg-gradient-to-r opacity-100', step.accent)} />
                  <div className="relative flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                        isActive
                          ? 'border-white/20 bg-white/10 text-white'
                          : 'border-white/10 bg-slate-900/70 text-slate-400'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                      {isActive ? (
                        <p className="mt-1 text-sm leading-6 text-slate-300">{step.body}</p>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
            <BookOpen className="h-4 w-4 text-brand-lighter" />
            <span>Building a stronger mentor shortlist</span>
            <motion.div
              className="flex items-center gap-1"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <Sparkles className="h-3 w-3 text-sky-300" />
            </motion.div>
          </div>
        </div>
      </div>
    </AppPanel>
  );
}
