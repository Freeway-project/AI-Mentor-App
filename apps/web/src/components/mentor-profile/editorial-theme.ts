import type { CSSProperties } from 'react';

export const ED = {
  cream: '#FAF4E8',
  creamDeep: '#F0E6D0',
  ink: '#1C1208',
  inkSoft: '#4A3820',
  inkMuted: '#7A6548',
  rule: '#D4C4A0',
  accent: '#A07830',
  accentDeep: '#6B4E18',
  accentTint: '#EDE0C0',
  card: '#FDF9F0',
  marker: '#8B4513',
};

export const ed = {
  serif(size: number, color: string = ED.ink, extra: CSSProperties = {}): CSSProperties {
    return {
      fontFamily: '"Instrument Serif", serif',
      fontWeight: 400,
      fontSize: size,
      color,
      ...extra,
    };
  },
  mono(size: number, color: string = ED.inkMuted, extra: CSSProperties = {}): CSSProperties {
    return {
      fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
      fontSize: size,
      color,
      letterSpacing: Math.round(size * 0.14),
      textTransform: 'uppercase' as const,
      ...extra,
    };
  },
  sectionHead(extra: CSSProperties = {}): CSSProperties {
    return {
      borderBottom: `1px solid ${ED.ink}`,
      paddingBottom: 10,
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      ...extra,
    };
  },
  rule: {
    borderBottom: `1px solid ${ED.rule}`,
  } as CSSProperties,
};
