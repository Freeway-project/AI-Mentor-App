import { Navbar } from '@/components/layout/Navbar';
import { MenteeSidebar } from '@/components/layout/MenteeSidebar';

export function MenteeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-slate-50">
      <Navbar />
      <div className="flex min-h-0 flex-1">
        <MenteeSidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
