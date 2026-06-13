import { cn } from '@/lib/utils';

type BrandLoaderProps = {
  className?: string;
  label?: string;
};

/** Simple learning motif (open book + spark) — `public/loader-learning.svg`. */
export function BrandLoader({
  className,
  label = 'Loading next page...',
}: BrandLoaderProps) {
  return (
    <div className={cn('flex w-full max-w-lg flex-col items-center gap-5 px-2 text-center', className)}>
      <div className="relative flex aspect-square w-full max-h-[min(50vh,20rem)] max-w-[min(20rem,calc(100vw-2.5rem))] items-center justify-center">
        <div className="absolute inset-[-12%] rounded-full bg-amber-200/20 blur-3xl animate-pulse" />
        <div className="absolute inset-[-6%] rounded-full border border-amber-300/50" />
        <div className="absolute inset-[-6%] rounded-full border-[3px] border-amber-200/70 border-t-amber-600 animate-spin [animation-duration:2.4s]" />
        <img
          src="/loader-learning.svg"
          alt=""
          className="relative z-[1] h-full w-full object-contain p-1"
        />
      </div>

      <div className="space-y-1">
        <p className="text-lg font-semibold tracking-wide text-slate-900">{label}</p>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-amber-800/80">
          Expert mentor platform
        </p>
      </div>
    </div>
  );
}
