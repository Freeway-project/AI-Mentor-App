'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
    CheckCircle2, Clock, XCircle, ArrowRight,
    User, Calendar, BookOpen, Shield, Video,
} from 'lucide-react';
import Link from 'next/link';
import {
    AppPageHeader,
    AppPanel,
    AppSectionLabel,
    appTheme,
    getToneClasses,
} from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';
import { getSessionAccess } from '@/lib/session-access';

const STATUS_CONFIG: Record<string, { icon: any; tone: 'amber' | 'purple' | 'red'; title: string; description: string }> = {
    pending: {
        icon: Clock,
        tone: 'amber',
        title: 'Profile Under Review',
        description: "Your profile has been submitted and is pending admin approval. We'll notify you once reviewed.",
    },
    approved: {
        icon: CheckCircle2,
        tone: 'purple',
        title: 'Profile Approved!',
        description: 'Your profile is live. Mentees can now find and book sessions with you.',
    },
    rejected: {
        icon: XCircle,
        tone: 'red',
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
    const tone = getToneClasses(cfg.tone);
    const isPendingReview = profile?.onboardingStep === 'published' && profile?.approvalStatus === 'pending';

    if (!loading && isPendingReview) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
                        <Clock className="h-8 w-8 text-amber-300" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Profile Under Review</h1>
                    <p className="text-slate-400 text-sm">Your profile has been submitted and is awaiting admin approval. We&apos;ll notify you once it&apos;s reviewed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <AppPageHeader
                title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Mentor'}`}
                description="Here’s your mentor portal overview, aligned to the same shared dashboard system as the rest of the app."
                titleClassName="text-2xl md:text-3xl"
            />

            {!loading && (
                <AppPanel className={cn('flex items-start gap-4 border p-5', tone.panel)}>
                    <div className={cn('rounded-xl border p-2.5', tone.icon)}>
                        <StatusIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className={cn('text-base font-semibold', tone.text)}>{cfg.title}</h2>
                        <p className="text-sm text-slate-400 mt-0.5">{cfg.description}</p>
                        {status === 'rejected' && profile?.approvalNote && (
                            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
                                <span className="font-medium">Admin note: </span>{profile.approvalNote}
                            </div>
                        )}
                        {status === 'rejected' && (
                            <Link
                                href="/mentor/dashboard/profile"
                                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-300 hover:text-white"
                            >
                                Update profile <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>
                </AppPanel>
            )}

            <div>
                <AppSectionLabel className="mb-4">Quick Actions</AppSectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map(({ href, icon: Icon, label, description }) => (
                        <Link
                            key={label}
                            href={href}
                            className={appTheme.actionTile}
                        >
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light transition-transform group-hover:scale-110">
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
                const sessionAccess = getSessionAccess(next);
                return (
                    <AppPanel className="p-6">
                        <AppSectionLabel className="mb-4">Next Session</AppSectionLabel>
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
                            {sessionAccess && (
                                <Link
                                    href={sessionAccess.href}
                                    target={sessionAccess.isExternal ? '_blank' : undefined}
                                    rel={sessionAccess.isExternal ? 'noopener noreferrer' : undefined}
                                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-light"
                                >
                                    <Video className="w-4 h-4" /> {sessionAccess.label}
                                </Link>
                            )}
                        </div>
                        {upcomingBookings.length > 1 && (
                            <Link href="/mentor/bookings" className="mt-4 inline-flex items-center gap-1 text-xs text-brand-lighter hover:text-white">
                                View all {upcomingBookings.length} upcoming <ArrowRight className="w-3 h-3" />
                            </Link>
                        )}
                    </AppPanel>
                );
            })()}

            {profile && (
                <AppPanel className="p-6">
                    <h2 className="font-semibold text-white mb-4">Profile Completeness</h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Bio & Headline', done: !!(profile.bio && profile.headline) },
                            { label: 'Session Offers', done: false },
                            { label: 'Availability', done: !!(profile.availability) },
                            { label: 'Policies', done: false },
                        ].map(({ label, done }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? 'bg-brand' : 'bg-slate-700'}`}>
                                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className={`text-sm ${done ? 'text-white font-medium' : 'text-slate-500'}`}>{label}</span>
                                {!done && (
                                    <Link href="/mentor/dashboard/profile" className="ml-auto text-xs text-brand-lighter hover:text-white">
                                        Complete →
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </AppPanel>
            )}
        </div>
    );
}
