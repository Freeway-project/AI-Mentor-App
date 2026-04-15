import { MenteeShell } from '@/components/layout/MenteeShell';

export default function MenteeCareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MenteeShell>{children}</MenteeShell>;
}
