import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from './providers';
import { Toaster } from 'sonner';
import { RouteTransition } from '@/components/ui/route-transition';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'OWL Mentor',
  description: 'Find and connect with expert mentors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-deep text-white antialiased">
        <AppProviders>
          <RouteTransition>{children}</RouteTransition>
        </AppProviders>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
