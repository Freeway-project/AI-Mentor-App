import { Navbar } from '@/components/layout/Navbar';

export default function MenteeDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <Navbar />
            <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.1),_transparent_38%)]">
                {children}
            </main>
        </div>
    );
}
