import { Navbar } from '@/components/layout/Navbar';
import { MenteeSidebar } from '@/components/layout/MenteeSidebar';

export function MenteeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <MenteeSidebar />
        <main className="min-w-0 flex-1 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
