'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Compass, LayoutDashboard, LogOut, MessageSquare, User } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const NAV = [
  { href: '/mentee/dashboard', label: 'My Sessions', icon: LayoutDashboard },
  { href: '/mentee/career', label: 'Career Plan', icon: BookOpen },
  { href: '/mentee/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/browse', label: 'Browse Mentors', icon: Compass },
];

export function MenteeSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="hidden min-h-0 w-64 shrink-0 flex-col self-stretch border-r border-white/5 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white lg:flex">
      <div className="shrink-0 border-b border-white/10 px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandLogo
            markClassName="h-9 w-9"
            wordmarkClassName="text-xs tracking-[0.24em]"
          />
        </Link>
        <p className="mt-1 pl-0.5 text-xs text-slate-400">Mentee Portal</p>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {(() => {
          // Pick the single most-specific matching route so parent items
          // (e.g. "My Sessions") don't stay highlighted on child routes
          // (e.g. "Messages").
          const activeHref = NAV
            .filter(({ href }) => pathname === href || pathname.startsWith(href + '/'))
            .sort((a, b) => b.href.length - a.href.length)[0]?.href;
          return NAV.map(({ href, label, icon: Icon }) => {
          const isActive = href === activeHref;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-900/40'
                  : 'text-slate-400 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
          });
        })()}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-white/10 px-3 py-4">
        <div className="flex items-center justify-between px-2">
          <NotificationBell />
        </div>
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <Link
          href="/browse"
          className="flex items-center gap-3 rounded-lg border border-brand/20 bg-brand/10 px-3 py-2 text-sm text-brand-lighter transition-colors hover:bg-brand/20"
        >
          <User className="h-4 w-4" />
          Find a Mentor
        </Link>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-all hover:bg-white/8 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
