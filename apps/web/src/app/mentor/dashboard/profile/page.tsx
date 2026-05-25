'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { OffersStep } from '@/components/onboarding/OffersStep';
import { PoliciesStep } from '@/components/onboarding/PoliciesStep';
import { AvailabilityStep } from '@/components/onboarding/AvailabilityStep';
import { ReviewChat } from '@/components/admin/ReviewChat';
import { toast } from 'sonner';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const TABS = ['Profile', 'Offers', 'Policies', 'Availability', 'Review Chat'] as const;
type Tab = typeof TABS[number];

export default function MentorProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [userAvatar, setUserAvatar] = useState<string>('');
    const [activeTab, setActiveTab] = useState<Tab>('Profile');
    const [loading, setLoading] = useState(true);

    const loadProfile = async () => {
        try {
            const [p, me] = await Promise.all([
                apiClient.getMyMentorProfile(),
                apiClient.getMe(),
            ]);
            setProfile(p);
            setUserAvatar(me.avatar || '');
        } catch {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProfile(); }, []);

    const status = profile?.approvalStatus;

    return (
        <div className="px-4 py-6 sm:px-6 md:p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Update your profile, offers, availability, and policies. All changes save instantly.
                </p>
            </div>

            {/* Approval status banner */}
            {status === 'pending' && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-sm text-amber-300">
                        <span className="font-semibold">Under Review — </span>
                        Your profile is awaiting admin approval.
                    </p>
                </div>
            )}
            {status === 'approved' && (
                <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                    <p className="text-sm text-purple-300">
                        <span className="font-semibold">Live — </span>
                        Your profile is approved and visible to mentees.
                    </p>
                </div>
            )}
            {status === 'rejected' && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <div className="text-sm text-red-300">
                        <p className="font-semibold">Changes Needed</p>
                        {profile?.approvalNote && <p className="mt-0.5">{profile.approvalNote}</p>}
                    </div>
                </div>
            )}

            {/* Tab bar */}
            <div className="flex border-b border-slate-200 gap-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${activeTab === tab
                                ? 'border-brand text-brand'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    {activeTab === 'Profile' && (
                        <ProfileStep
                            profile={profile}
                            userAvatar={userAvatar}
                            onComplete={async () => {
                                await loadProfile();
                                toast.success('Profile saved');
                            }}
                        />
                    )}
                    {activeTab === 'Offers' && (
                        <OffersStep
                            mentorId={profile?.id}
                            hourlyRate={profile?.hourlyRate}
                            onComplete={async () => {
                                await loadProfile();
                                toast.success('Offers saved');
                            }}
                        />
                    )}
                    {activeTab === 'Policies' && (
                        <PoliciesStep
                            mentorId={profile?.id}
                            onComplete={async () => {
                                await loadProfile();
                                toast.success('Policies saved');
                            }}
                        />
                    )}
                    {activeTab === 'Availability' && (
                        <AvailabilityStep
                            profile={profile}
                            onComplete={async () => {
                                await loadProfile();
                                toast.success('Availability saved');
                            }}
                        />
                    )}
                    {activeTab === 'Review Chat' && profile?.id && (
                        <div className="h-[560px]">
                            <ReviewChat
                                mentorId={profile.id}
                                viewAs="mentor"
                                contextLabel="Discuss profile feedback with the admin reviewer"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
