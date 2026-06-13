import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  title?: string;
};

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  stacked?: boolean;
  showWordmark?: boolean;
};

type BrandLogoImageProps = {
  className?: string;
  alt?: string;
};

/** SVG logo from `public/logo.svg`. */
export function BrandLogoAsset({
  className,
  alt = 'Owl Mentors logo',
}: BrandLogoImageProps) {
  return (
    <div className={cn('relative', className)}>
      <Image src="/logo.svg" alt={alt} fill className="object-contain mix-blend-multiply" />
    </div>
  );
}

export function BrandMark({ className, title = 'Owl Mentors owl logo' }: BrandMarkProps) {
  return <BrandLogoAsset className={className} alt={title} />;
}

export function BrandLogo({
  className,
  markClassName,
  wordmarkClassName,
  stacked = false,
  showWordmark = true,
}: BrandLogoProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0',
        stacked ? 'flex-col items-center gap-4 text-center' : 'items-center gap-3',
        className
      )}
    >
      <BrandLogoAsset className={cn(stacked ? 'h-32 w-32' : 'h-16 w-16', markClassName)} />
      {showWordmark ? (
        <span
          className={cn(
            'font-semibold leading-none text-slate-900',
            stacked ? 'text-lg tracking-[0.32em]' : 'text-sm tracking-[0.24em]',
            wordmarkClassName
          )}
        >
          Owl Mentors
        </span>
      ) : null}
    </div>
  );
}

export function BrandLogoImage({ className, alt = 'Owl Mentors logo' }: BrandLogoImageProps) {
  return <BrandLogoAsset className={className} alt={alt} />;
}
