import { MenteeShell } from '@/components/layout/MenteeShell';

export default function MenteeDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <MenteeShell>{children}</MenteeShell>;
}
