import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from './providers';
import { Toaster } from 'sonner';

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
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
