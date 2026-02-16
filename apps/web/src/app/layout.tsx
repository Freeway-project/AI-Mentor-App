import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Mentor Platform',
  description: 'Find and connect with expert mentors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
