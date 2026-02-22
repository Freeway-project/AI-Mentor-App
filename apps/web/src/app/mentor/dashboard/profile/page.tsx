'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { OffersStep } from '@/components/onboarding/OffersStep';
import { PoliciesStep } from '@/components/onboarding/PoliciesStep';
import { AvailabilityStep } from '@/components/onboarding/AvailabilityStep';
import { toast } from 'sonner';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const TABS = ['Profile', 'Offers', 'Policies', 'Availability'] as const;
type Tab = typeof TABS[number];

export default function MentorProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<Tab>('Profile');
    const [loading, setLoading] = useState(true);

    const loadProfile = async () => {
        try {
            const p = await apiClient.getMyMentorProfile();
            setProfile(p);
        } catch {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProfile(); }, []);

    const status = profile?.approvalStatus;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Any changes you save will require admin re-approval before going live.
                </p>
            </div>

            {/* Approval status banner */}
            {status === 'pending' && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-700">
                        <span className="font-semibold">Under Review — </span>
                        Your profile is awaiting admin approval. Changes you make will restart the review process.
                    </p>
                </div>
            )}
            {status === 'approved' && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700">
                        <span className="font-semibold">Live — </span>
                        Your profile is approved and visible to mentees. Saving changes will re-submit for approval.
                    </p>
                </div>
            )}
            {status === 'rejected' && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="text-sm text-red-700">
                        <p className="font-semibold">Changes Needed</p>
                        {profile?.approvalNote && <p className="mt-0.5">{profile.approvalNote}</p>}
                    </div>
                </div>
            )}

            {/* Tab bar */}
            <div className="flex border-b border-slate-200 gap-1">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab
                                ? 'border-blue-600 text-blue-600'
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
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    {activeTab === 'Profile' && (
                        <ProfileStep
                            profile={profile}
                            onComplete={async () => {
                                await loadProfile();
                                toast.success('Profile saved — submitted for review');
                            }}
                        />
                    )}
                    {activeTab === 'Offers' && (
                        <OffersStep
                            mentorId={profile?.id}
                            onComplete={async () => {
                                await loadProfile();
                                toast.success('Offers saved — submitted for review');
                            }}
                        />
                    )}
                    {activeTab === 'Policies' && (
                        <PoliciesStep
                            mentorId={profile?.id}
                            onComplete={async () => {
                                await loadProfile();
                                toast.success('Policies saved — submitted for review');
                            }}
                        />
                    )}
                    {activeTab === 'Availability' && (
                        <AvailabilityStep
                            profile={profile}
                            onComplete={async () => {
                                await loadProfile();
                                toast.success('Availability saved — submitted for review');
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
