import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'purple' | 'amber' | 'emerald' | 'red' | 'slate';

const toneClasses: Record<Tone, { icon: string; badge: string; panel: string; link: string; text: string }> = {
  brand: {
    icon: 'border-brand/20 bg-brand/10 text-brand-lighter',
    badge: 'border-brand/20 bg-brand/10 text-brand-lighter',
    panel: 'border-brand/20 bg-brand/10',
    link: 'text-brand-lighter hover:text-white',
    text: 'text-brand-lighter',
  },
  purple: {
    icon: 'border-purple-500/20 bg-purple-500/10 text-purple-300',
    badge: 'border-purple-500/20 bg-purple-500/10 text-purple-300',
    panel: 'border-purple-500/20 bg-purple-500/10',
    link: 'text-purple-300 hover:text-white',
    text: 'text-purple-300',
  },
  amber: {
    icon: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    badge: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    panel: 'border-amber-500/20 bg-amber-500/10',
    link: 'text-amber-300 hover:text-white',
    text: 'text-amber-300',
  },
  emerald: {
    icon: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    panel: 'border-emerald-500/20 bg-emerald-500/10',
    link: 'text-emerald-300 hover:text-white',
    text: 'text-emerald-300',
  },
  red: {
    icon: 'border-red-500/20 bg-red-500/10 text-red-300',
    badge: 'border-red-500/20 bg-red-500/10 text-red-300',
    panel: 'border-red-500/20 bg-red-500/10',
    link: 'text-red-300 hover:text-white',
    text: 'text-red-300',
  },
  slate: {
    icon: 'border-slate-700/70 bg-slate-800/80 text-slate-300',
    badge: 'border-slate-700/70 bg-slate-800/80 text-slate-300',
    panel: 'border-slate-700/70 bg-slate-900/70',
    link: 'text-slate-300 hover:text-white',
    text: 'text-slate-300',
  },
};

export const appTheme = {
  pageShell: 'min-h-screen flex flex-col relative overflow-hidden text-white',
  pageBackdrop: 'absolute inset-0 pointer-events-none',
  pageGrid:
    'absolute inset-0 opacity-[0.1] [background-image:radial-gradient(circle,_rgba(71,85,105,0.9)_1px,_transparent_1px)] [background-size:36px_36px]',
  pageGlow: 'absolute top-8 right-8 h-[30rem] w-[30rem] rounded-full bg-brand/10 blur-[120px]',
  pageGlowAlt: 'absolute bottom-0 left-[-8rem] h-[22rem] w-[22rem] rounded-full bg-brand-light/10 blur-[120px]',
  pageTopLine: 'absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent',
  content: 'relative z-10 w-full',
  container: 'container mx-auto w-full px-4 md:px-6',
  pageTitle: 'text-3xl font-bold tracking-tight text-white md:text-4xl',
  pageSubtitle: 'mt-2 max-w-2xl text-sm text-slate-400 md:text-base',
  sectionLabel: 'text-xs font-semibold uppercase tracking-[0.24em] text-slate-500',
  panel:
    'rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-md shadow-[0_18px_60px_rgba(2,6,23,0.35)]',
  panelMuted: 'rounded-2xl border border-white/10 bg-slate-900/35 backdrop-blur-md',
  statCard:
    'rounded-2xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-sm shadow-[0_12px_36px_rgba(2,6,23,0.25)]',
  actionTile:
    'group rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition-all duration-200 hover:border-brand/40 hover:bg-slate-900/80',
  input:
    'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-brand/40',
  emptyState:
    'rounded-2xl border border-white/10 bg-slate-900/55 px-6 py-10 text-center text-slate-400 backdrop-blur-md',
  spinner: 'h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent',
} as const;

export function AppPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(appTheme.pageShell, className)} style={{ background: 'var(--gradient-page)' }}>
      <div className={appTheme.pageBackdrop}>
        <div className={appTheme.pageGrid} />
        <div className={appTheme.pageGlow} />
        <div className={appTheme.pageGlowAlt} />
        <div className={appTheme.pageTopLine} />
      </div>
      {children}
    </div>
  );
}

export function AppPageHeader({
  title,
  description,
  align = 'left',
  titleClassName,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  titleClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', align === 'center' && 'mx-auto text-center', className)}>
      <h1 className={cn(appTheme.pageTitle, titleClassName)}>{title}</h1>
      {description ? (
        <p className={cn(appTheme.pageSubtitle, align === 'center' && 'mx-auto')}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function AppPanel({
  children,
  className,
  muted = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { muted?: boolean }) {
  return (
    <div
      className={cn(muted ? appTheme.panelMuted : appTheme.panel, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AppSectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn(appTheme.sectionLabel, className)}>{children}</p>;
}

export function AppStatusBadge({
  children,
  tone = 'slate',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize',
        toneClasses[tone].badge,
        className
      )}
    >
      {children}
    </span>
  );
}

export function AppStatCard({
  icon,
  label,
  value,
  tone = 'brand',
  meta,
  className,
}: {
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
  tone?: Tone;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(appTheme.statCard, 'flex items-center gap-4', className)}>
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl border', toneClasses[tone].icon)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        {meta ? <p className="mt-1 text-xs text-slate-500">{meta}</p> : null}
      </div>
    </div>
  );
}

export function AppLinkTone({
  tone = 'brand',
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  return cn('transition-colors', toneClasses[tone].link, className);
}

export function getToneClasses(tone: Tone) {
  return toneClasses[tone];
}
