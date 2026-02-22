'use client';

import { useAuth } from '@/lib/auth-context';
import {
    Clock, ArrowRight, BookOpen, User, Calendar
} from 'lucide-react';
import Link from 'next/link';

const QUICK_ACTIONS = [
    { href: '/browse', icon: User, label: 'Find a Mentor', description: 'Search our vetted mentors' },
    { href: '#', icon: Calendar, label: 'My Sessions', description: 'View upcoming bookings' },
    { href: '#', icon: BookOpen, label: 'Learning Goals', description: 'Set your focus areas' },
];

export default function MenteeDashboardPage() {
    const { user } = useAuth();

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Welcome back, {user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-slate-400 text-sm mt-1">Here&apos;s your learning overview</p>
            </div>

            {/* Next Milestone Banner */}
            <div className={`rounded-2xl border p-5 flex items-start gap-4 bg-blue-500/10 border-blue-500/30`}>
                <div className={`p-2.5 rounded-xl bg-blue-500/10`}>
                    <Clock className={`w-6 h-6 text-blue-400`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className={`font-semibold text-base text-blue-400`}>Find your first mentor</h2>
                    <p className="text-sm text-slate-400 mt-0.5">You haven&apos;t booked any sessions yet. Browse our list of expert mentors to get started.</p>
                    <Link
                        href="/browse"
                        className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-400 hover:underline"
                    >
                        Browse mentors <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Quick actions grid */}
            <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {QUICK_ACTIONS.map(({ href, icon: Icon, label, description }) => (
                        <Link
                            key={label}
                            href={href}
                            className="group bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="font-semibold text-white text-sm">{label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-700 mb-4" />
                <h3 className="text-lg font-medium text-slate-300">No activity yet</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-sm">Your upcoming sessions and past learning history will appear here.</p>
            </div>
        </div>
    );
}
