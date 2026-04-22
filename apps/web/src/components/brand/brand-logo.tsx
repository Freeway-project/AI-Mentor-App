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

/** SVG from `public/logo.svg`, PNG fallback from `public/logo.png`. */
export function BrandLogoAsset({
  className,
  alt = 'Owl Mentors logo',
}: BrandLogoImageProps) {
  return (
    <picture className={cn('block', className)}>
      <source srcSet="/logo.svg" type="image/svg+xml" />
      <img src="/logo.png" alt={alt} className="h-full w-full object-contain" />
    </picture>
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
      <BrandLogoAsset className={cn(stacked ? 'h-28 w-28' : 'h-12 w-12', markClassName)} />
      {showWordmark ? (
        <span
          className={cn(
            'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text font-semibold leading-none text-transparent',
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
