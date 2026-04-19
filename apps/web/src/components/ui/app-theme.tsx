import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'purple' | 'amber' | 'emerald' | 'red' | 'slate';

const toneClasses: Record<Tone, { icon: string; badge: string; panel: string; link: string; text: string }> = {
  brand: {
    icon: 'border-brand/20 bg-brand/10 text-brand',
    badge: 'border-brand/20 bg-brand/10 text-brand',
    panel: 'border-brand/20 bg-brand/5',
    link: 'text-brand hover:text-brand-light',
    text: 'text-brand',
  },
  purple: {
    icon: 'border-purple-500/20 bg-purple-500/10 text-purple-600',
    badge: 'border-purple-500/20 bg-purple-500/10 text-purple-600',
    panel: 'border-purple-500/20 bg-purple-500/5',
    link: 'text-purple-600 hover:text-purple-700',
    text: 'text-purple-600',
  },
  amber: {
    icon: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    badge: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    panel: 'border-amber-500/20 bg-amber-500/5',
    link: 'text-amber-600 hover:text-amber-700',
    text: 'text-amber-600',
  },
  emerald: {
    icon: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    panel: 'border-emerald-500/20 bg-emerald-500/5',
    link: 'text-emerald-600 hover:text-emerald-700',
    text: 'text-emerald-600',
  },
  red: {
    icon: 'border-red-500/20 bg-red-500/10 text-red-600',
    badge: 'border-red-500/20 bg-red-500/10 text-red-600',
    panel: 'border-red-500/20 bg-red-500/5',
    link: 'text-red-600 hover:text-red-700',
    text: 'text-red-600',
  },
  slate: {
    icon: 'border-slate-200 bg-slate-100 text-slate-600',
    badge: 'border-slate-200 bg-slate-100 text-slate-600',
    panel: 'border-slate-200 bg-slate-50',
    link: 'text-slate-600 hover:text-slate-900',
    text: 'text-slate-600',
  },
};

export const appTheme = {
  pageShell: 'min-h-screen flex flex-col relative overflow-hidden text-slate-900',
  pageBackdrop: 'absolute inset-0 pointer-events-none',
  pageGrid:
    'absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle,_rgba(71,85,105,0.9)_1px,_transparent_1px)] [background-size:36px_36px]',
  pageGlow: 'absolute top-8 right-8 h-[30rem] w-[30rem] rounded-full bg-brand/8 blur-[120px]',
  pageGlowAlt: 'absolute bottom-0 left-[-8rem] h-[22rem] w-[22rem] rounded-full bg-brand-light/6 blur-[120px]',
  pageTopLine: 'absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent',
  content: 'relative z-10 w-full',
  container: 'container mx-auto w-full px-4 md:px-6',
  pageTitle: 'text-3xl font-bold tracking-tight text-slate-900 md:text-4xl',
  pageSubtitle: 'mt-2 max-w-2xl text-sm text-slate-500 md:text-base',
  sectionLabel: 'text-xs font-semibold uppercase tracking-[0.24em] text-slate-400',
  panel:
    'rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.06)]',
  panelMuted: 'rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md',
  statCard:
    'rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]',
  actionTile:
    'group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-brand/40 hover:shadow-[0_4px_20px_rgba(160, 120, 48,0.08)]',
  input:
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/30',
  emptyState:
    'rounded-2xl border border-slate-200 bg-white/80 px-6 py-10 text-center text-slate-500 backdrop-blur-md',
  spinner: 'h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent',
} as const;

export function AppPageShell({
  children,
  className,
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(appTheme.pageShell, className)}
      style={{ background: 'var(--gradient-page)' }}
    >
      <div className={appTheme.pageBackdrop}>
        <div className={cn(appTheme.pageGrid, dark && 'opacity-[0.08]')} />
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
  descriptionClassName,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  titleClassName?: string;
  descriptionClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', align === 'center' && 'mx-auto text-center', className)}>
      <h1 className={cn(appTheme.pageTitle, titleClassName)}>{title}</h1>
      {description ? (
        <p className={cn(appTheme.pageSubtitle, align === 'center' && 'mx-auto', descriptionClassName)}>
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
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
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
