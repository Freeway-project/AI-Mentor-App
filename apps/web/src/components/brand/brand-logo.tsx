import { useId } from 'react';
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

export function BrandMark({ className, title = 'OWL Mentors owl logo' }: BrandMarkProps) {
  const id = useId().replace(/:/g, '');
  const goldGradientId = `${id}-gold`;
  const glowGradientId = `${id}-glow`;

  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={goldGradientId} x1="44" y1="36" x2="212" y2="228" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#FACC15" />
          <stop offset="1" stopColor="#D4A017" />
        </linearGradient>
        <radialGradient id={glowGradientId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(128 128) rotate(90) scale(120)">
          <stop stopColor="#FDE68A" stopOpacity="0.22" />
          <stop offset="1" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="128" cy="128" r="112" fill={`url(#${glowGradientId})`} />

      <g stroke={`url(#${goldGradientId})`} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="128" cy="122" r="92" strokeWidth="10" />
        <path d="M79 67C98 52 123 47 149 49C167 51 183 57 196 67" strokeWidth="9" />
        <path d="M46 82C63 55 101 51 128 73" strokeWidth="14" />
        <path d="M210 82C193 55 155 51 128 73" strokeWidth="14" />
        <circle cx="92" cy="118" r="28" strokeWidth="10" />
        <circle cx="164" cy="118" r="28" strokeWidth="10" />
        <circle cx="92" cy="118" r="11" strokeWidth="8" />
        <circle cx="164" cy="118" r="11" strokeWidth="8" />
        <path d="M62 119C67 149 90 164 121 160" strokeWidth="10" />
        <path d="M194 119C189 149 166 164 135 160" strokeWidth="10" />
        <path d="M80 152V214" strokeWidth="11" />
        <path d="M176 152V214" strokeWidth="11" />
        <path d="M80 152C106 166 121 190 123 224" strokeWidth="11" />
        <path d="M176 152C150 166 135 190 133 224" strokeWidth="11" />
        <path d="M123 224V209C123 192 127 178 128 173C129 178 133 192 133 209V224" strokeWidth="11" />
      </g>

      <circle cx="101" cy="109" r="5.5" fill={`url(#${goldGradientId})`} />
      <circle cx="155" cy="109" r="5.5" fill={`url(#${goldGradientId})`} />
      <path d="M128 126L143 148L128 173L113 148L128 126Z" fill={`url(#${goldGradientId})`} />
    </svg>
  );
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
      <BrandMark className={cn(stacked ? 'h-24 w-24' : 'h-10 w-10', markClassName)} />
      {showWordmark ? (
        <span
          className={cn(
            'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text font-semibold uppercase leading-none text-transparent',
            stacked ? 'text-lg tracking-[0.32em]' : 'text-sm tracking-[0.24em]',
            wordmarkClassName
          )}
        >
          OWL MENTORS
        </span>
      ) : null}
    </div>
  );
}

export function BrandLogoImage({
  className,
  alt = 'OWL Mentors logo',
}: BrandLogoImageProps) {
  return (
    <img
      src="/logo.svg"
      alt={alt}
      className={cn('h-auto w-auto object-contain', className)}
    />
  );
}
