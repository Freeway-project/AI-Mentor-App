'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { LogOut, Trash2, ShieldCheck } from 'lucide-react';
import { GoogleCalendarConnect } from '@/components/mentor/GoogleCalendarConnect';
import { CalendarSelector } from '@/components/mentor/CalendarSelector';
import { apiClient } from '@/lib/api-client';

function CalendarOAuthToast() {
    const searchParams = useSearchParams();
    useEffect(() => {
        if (searchParams.get('calendarConnected') === '1') {
            toast.success('Google Calendar connected successfully');
        } else if (searchParams.get('calendarError')) {
            toast.error('Failed to connect Google Calendar');
        }
    }, [searchParams]);
    return null;
}

export default function MentorSettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [showDelete, setShowDelete] = useState(false);
    const [calendarConnected, setCalendarConnected] = useState(false);
    const [calLink, setCalLink] = useState('');
    const [calLinkSaving, setCalLinkSaving] = useState(false);

    useEffect(() => {
        apiClient.getMyMentorProfile().then((profile: any) => {
            setCalLink(profile?.calLink ?? '');
        }).catch(() => {});
    }, []);

    const handleCalLinkSave = async () => {
        setCalLinkSaving(true);
        try {
            await apiClient.updateMyMentorProfile({ calLink: calLink.trim() || undefined } as any);
            toast.success('Cal.com link saved');
        } catch (err: any) {
            toast.error(err.message || 'Failed to save Cal.com link');
        } finally {
            setCalLinkSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
        toast.success('Signed out successfully');
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <Suspense fallback={null}>
                <CalendarOAuthToast />
            </Suspense>
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your account preferences</p>
            </div>

            {/* Account info */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 divide-y divide-slate-800">
                <div className="px-5 py-4">
                    <h2 className="font-semibold text-white mb-3">Account</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Name</span>
                            <span className="font-medium text-white">{user?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Email</span>
                            <span className="font-medium text-white">{user?.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Email verified</span>
                            <span className="flex items-center gap-1.5 text-purple-400 font-medium">
                                <ShieldCheck className="w-4 h-4" />
                                Verified
                            </span>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </div>

            {/* Google Calendar */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 divide-y divide-slate-800">
                <div className="px-5 py-4">
                    <h2 className="font-semibold text-white mb-1">Google Calendar</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Connect your Google Calendar to automatically block busy times and add Meet links to bookings.
                    </p>
                    <GoogleCalendarConnect onStatusChange={setCalendarConnected} />
                </div>
                {calendarConnected && (
                    <div className="px-5 py-4">
                        <h3 className="text-sm font-medium text-slate-300 mb-3">Calendar Settings</h3>
                        <CalendarSelector />
                    </div>
                )}
            </div>

            {/* Cal.com booking link */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800">
                <div className="px-5 py-4">
                    <h2 className="font-semibold text-white mb-1">Cal.com Booking Link</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Connect your Cal.com calendar so mentees can book directly from your profile. Enter your booking link slug (e.g. <span className="text-slate-400 font-mono text-xs">username/event-slug</span>).
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={calLink}
                            onChange={(e) => setCalLink(e.target.value)}
                            placeholder="username/mentoring-session"
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                        />
                        <button
                            onClick={handleCalLinkSave}
                            disabled={calLinkSaving}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {calLinkSaving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger zone */}
            <div className="bg-slate-900 rounded-2xl border border-red-500/30">
                <div className="px-5 py-4">
                    <h2 className="font-semibold text-red-400 mb-1">Danger Zone</h2>
                    <p className="text-sm text-slate-500 mb-3">Permanent actions that cannot be undone.</p>
                    {!showDelete ? (
                        <button
                            onClick={() => setShowDelete(true)}
                            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete my account
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-red-400 font-medium">Are you sure? This cannot be undone.</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => toast.error('Please contact support to delete your account')}
                                    className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Yes, delete
                                </button>
                                <button
                                    onClick={() => setShowDelete(false)}
                                    className="px-4 py-1.5 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
