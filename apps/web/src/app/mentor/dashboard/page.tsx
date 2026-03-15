'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
    CheckCircle2, Clock, XCircle, ArrowRight,
    User, Calendar, BookOpen, Shield, Video,
} from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; title: string; description: string }> = {
    pending: {
        icon: Clock,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        title: 'Profile Under Review',
        description: "Your profile has been submitted and is pending admin approval. We'll notify you once reviewed.",
    },
    approved: {
        icon: CheckCircle2,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        title: 'Profile Approved!',
        description: 'Your profile is live. Mentees can now find and book sessions with you.',
    },
    rejected: {
        icon: XCircle,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
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
    const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);

    useEffect(() => {
        apiClient.getMyMentorProfile()
            .then(setProfile)
            .catch(() => { })
            .finally(() => setLoading(false));
        apiClient.getMyBookings({ status: 'booked' })
            .then(data => {
                const sorted = [...data.meetings].sort(
                    (a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                );
                setUpcomingBookings(sorted);
            })
            .catch(() => {});
    }, []);

    const status = profile?.approvalStatus || 'pending';
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const StatusIcon = cfg.icon;
    const isPendingReview = profile?.onboardingStep === 'published' && profile?.approvalStatus === 'pending';

    if (!loading && isPendingReview) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Profile Under Review</h1>
                    <p className="text-slate-400 text-sm">Your profile has been submitted and is awaiting admin approval. We&apos;ll notify you once it&apos;s reviewed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Welcome back, {user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-slate-400 text-sm mt-1">Here&apos;s your mentor portal overview</p>
            </div>

            {/* Status Banner */}
            {!loading && (
                <div className={`rounded-2xl border p-5 flex items-start gap-4 ${cfg.bg} ${cfg.border}`}>
                    <div className={`p-2.5 rounded-xl ${cfg.bg}`}>
                        <StatusIcon className={`w-6 h-6 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className={`font-semibold text-base ${cfg.color}`}>{cfg.title}</h2>
                        <p className="text-sm text-slate-400 mt-0.5">{cfg.description}</p>
                        {status === 'rejected' && profile?.approvalNote && (
                            <div className="mt-3 bg-red-950/40 rounded-lg px-4 py-2.5 text-sm text-red-300 border border-red-500/30">
                                <span className="font-medium">Admin note: </span>{profile.approvalNote}
                            </div>
                        )}
                        {status === 'rejected' && (
                            <Link
                                href="/mentor/dashboard/profile"
                                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-red-400 hover:underline"
                            >
                                Update profile <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Quick actions grid */}
            <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map(({ href, icon: Icon, label, description }) => (
                        <Link
                            key={label}
                            href={href}
                            className="group bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-violet-500/50 hover:bg-slate-800/80 transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="font-semibold text-white text-sm">{label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Next Session widget */}
            {upcomingBookings.length > 0 && (() => {
                const next = upcomingBookings[0];
                return (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Next Session</h2>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-semibold text-white">{next.title}</p>
                                {next.menteeName && <p className="text-sm text-slate-400">with {next.menteeName}</p>}
                                <p className="text-sm text-slate-400">
                                    {new Date(next.scheduledAt).toLocaleString([], {
                                        weekday: 'short', month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })} · {next.duration} min
                                </p>
                            </div>
                            {(next.dailyRoomUrl || next.meetingLink) && (
                                <Link
                                    href={next.dailyRoomUrl ? `/video/${next.id}` : next.meetingLink}
                                    target={next.dailyRoomUrl ? undefined : '_blank'}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all w-fit"
                                >
                                    <Video className="w-4 h-4" /> Join Call
                                </Link>
                            )}
                        </div>
                        {upcomingBookings.length > 1 && (
                            <Link href="/mentor/bookings" className="mt-4 inline-flex items-center gap-1 text-xs text-violet-400 hover:underline">
                                View all {upcomingBookings.length} upcoming <ArrowRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                );
            })()}

            {/* Profile completion */}
            {profile && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                    <h2 className="font-semibold text-white mb-4">Profile Completeness</h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Bio & Headline', done: !!(profile.bio && profile.headline) },
                            { label: 'Session Offers', done: false },
                            { label: 'Availability', done: !!(profile.availability) },
                            { label: 'Policies', done: false },
                        ].map(({ label, done }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-purple-500' : 'bg-slate-700'}`}>
                                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className={`text-sm ${done ? 'text-white font-medium' : 'text-slate-500'}`}>{label}</span>
                                {!done && (
                                    <Link href="/mentor/dashboard/profile" className="ml-auto text-xs text-violet-400 hover:underline">
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
