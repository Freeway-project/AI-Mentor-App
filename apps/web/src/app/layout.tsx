import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from './providers';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'OWLMentors',
  description: 'Find and connect with expert mentors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
        {/* <Analytics /> */}
        {/* <SpeedInsights /> */}
      </body>
    </html>
  );
}
