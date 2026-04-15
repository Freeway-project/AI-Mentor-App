import { Navbar } from '@/components/layout/Navbar';
import { MenteeSidebar } from '@/components/layout/MenteeSidebar';

export function MenteeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="flex">
        <MenteeSidebar />
        <main className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.1),_transparent_38%)]">
          {children}
        </main>
      </div>
    </div>
  );
}
