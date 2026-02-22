'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
    CheckCircle2, Clock, XCircle, ArrowRight,
    User, Calendar, BookOpen, Shield,
} from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; title: string; description: string }> = {
    pending: {
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        title: 'Profile Under Review',
        description: 'Your profile has been submitted and is pending admin approval. We\'ll notify you once reviewed.',
    },
    approved: {
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        title: 'Profile Approved!',
        description: 'Your profile is live. Mentees can now find and book sessions with you.',
    },
    rejected: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        title: 'Profile Needs Changes',
        description: 'Your profile was not approved. Please review the feedback below and update your profile.',
    },
};

const QUICK_ACTIONS = [
    { href: '/mentor/dashboard/profile', icon: User, label: 'Edit Profile', description: 'Update bio, skills, headline' },
    { href: '/mentor/dashboard/profile', icon: BookOpen, label: 'Manage Offers', description: 'Set sessions & pricing' },
    { href: '/mentor/dashboard/availability', icon: Calendar, label: 'Set Availability', description: 'Configure your schedule' },
    { href: '/mentor/dashboard/settings', icon: Shield, label: 'Settings', description: 'Account & preferences' },
];

export default function MentorDashboardPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.getMyMentorProfile()
            .then(setProfile)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const status = profile?.approvalStatus || 'pending';
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const StatusIcon = cfg.icon;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back, {user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-slate-500 text-sm mt-1">Here's your mentor portal overview</p>
            </div>

            {/* Status Banner */}
            {!loading && (
                <div className={`rounded-2xl border p-5 flex items-start gap-4 ${cfg.bg} ${cfg.border}`}>
                    <div className={`p-2.5 rounded-xl ${cfg.bg}`}>
                        <StatusIcon className={`w-6 h-6 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className={`font-semibold text-base ${cfg.color}`}>{cfg.title}</h2>
                        <p className="text-sm text-slate-600 mt-0.5">{cfg.description}</p>
                        {status === 'rejected' && profile?.approvalNote && (
                            <div className="mt-3 bg-white/70 rounded-lg px-4 py-2.5 text-sm text-red-700 border border-red-200">
                                <span className="font-medium">Admin note: </span>{profile.approvalNote}
                            </div>
                        )}
                        {(status === 'rejected') && (
                            <Link
                                href="/mentor/dashboard/profile"
                                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-red-700 hover:underline"
                            >
                                Update profile <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Quick actions grid */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map(({ href, icon: Icon, label, description }) => (
                        <Link
                            key={label}
                            href={href}
                            className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="font-semibold text-slate-900 text-sm">{label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Profile completion */}
            {profile && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">Profile Completeness</h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Bio & Headline', done: !!(profile.bio && profile.headline) },
                            { label: 'Session Offers', done: false }, // loaded separately
                            { label: 'Availability', done: !!(profile.availability) },
                            { label: 'Policies', done: false },
                        ].map(({ label, done }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className={`text-sm ${done ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{label}</span>
                                {!done && (
                                    <Link href="/mentor/dashboard/profile" className="ml-auto text-xs text-blue-600 hover:underline">
                                        Complete →
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
