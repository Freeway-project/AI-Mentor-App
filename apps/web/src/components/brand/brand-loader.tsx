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
    <div className={cn('flex flex-col items-center gap-5 text-center', className)}>
      <div className="relative">
        <div className="absolute inset-[-1.85rem] rounded-full bg-amber-300/15 blur-3xl animate-pulse" />
        <div className="absolute inset-[-1rem] rounded-full border border-amber-200/15" />
        <div className="absolute inset-[-1rem] rounded-full border-[3px] border-amber-200/15 border-t-amber-300/90 animate-spin [animation-duration:2.4s]" />
        <img
          src="/loader-learning.svg"
          alt=""
          width={208}
          height={208}
          className="relative h-52 w-52 object-contain drop-shadow-[0_0_28px_rgba(250,204,21,0.22)]"
        />
      </div>

      <div className="space-y-1">
        <p className="text-lg font-semibold tracking-wide text-white">{label}</p>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-slate-400">
          Expert mentor platform
        </p>
      </div>
    </div>
  );
}
