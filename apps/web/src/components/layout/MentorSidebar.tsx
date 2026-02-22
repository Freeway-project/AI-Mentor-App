'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Rocket, LayoutDashboard, User, Calendar, Settings, LogOut, Clock, CalendarCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const NAV = [
    { href: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/mentor/dashboard/profile', label: 'My Profile', icon: User },
    { href: '/mentor/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/mentor/dashboard/availability', label: 'Availability', icon: Calendar },
    { href: '/mentor/dashboard/settings', label: 'Settings', icon: Settings },
];

interface MentorSidebarProps {
    approvalStatus?: 'pending' | 'approved' | 'rejected' | string;
}

const statusConfig = {
    pending: { label: 'Under Review', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
    approved: { label: 'Approved', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-700 border-red-200' },
};

export function MentorSidebar({ approvalStatus }: MentorSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const status = approvalStatus as keyof typeof statusConfig;
    const statusInfo = statusConfig[status];

    return (
        <aside className="w-64 shrink-0 h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                        <Rocket className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">OWLMentors</span>
                </Link>
                <p className="mt-1 text-xs text-slate-400 pl-0.5">Mentor Portal</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== '/mentor/dashboard' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md shadow-blue-900/40'
                                : 'text-slate-400 hover:text-white hover:bg-white/8'
                                }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="px-3 py-4 border-t border-white/10 space-y-3">
                {/* Approval status pill */}
                {statusInfo && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${statusInfo.classes}`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Profile: {statusInfo.label}
                    </div>
                )}

                {/* User info */}
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-xs font-bold shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
