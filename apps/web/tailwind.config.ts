import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Brand accent ────────────────────────────────────────────────────
      // Change ONE value here to re-theme the entire app's primary colour.
      // Use Tailwind's opacity modifier syntax: bg-brand/10, ring-brand/50, etc.
      colors: {
        brand: {
          DEFAULT: '#A07830', // antique gold — primary CTA, links
          light:   '#B8923C', // warm gold    — hover state
          lighter: '#C9A85A', // pale gold    — muted links
        },
        // ─── Surface / panel backgrounds ─────────────────────────────────
        // Use slash-notation for opacity: bg-surface/50, bg-surface-deep/80
        surface: {
          DEFAULT: '#0f172a', // slate-900   — cards, modals, sidebars
          deep:    '#020617', // slate-950   — page base, dashboard bg
        },
      },
      // ─── Shared page backgrounds ─────────────────────────────────────────
      // Auth pages (login, register, forgot-password, verify-otp) and the
      // landing hero all share this gradient. Change it here → updates everywhere.
      backgroundImage: {
        'page-gradient': 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
