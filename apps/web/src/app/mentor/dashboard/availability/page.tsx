'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { AvailabilityStep } from '@/components/onboarding/AvailabilityStep';
import { toast } from 'sonner';

export default function MentorAvailabilityPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.getMyMentorProfile()
            .then(setProfile)
            .catch(() => toast.error('Failed to load profile'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full py-32">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Availability</h1>
                <p className="text-slate-400 text-sm mt-1">Set your weekly schedule for mentoring sessions.</p>
            </div>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <AvailabilityStep
                    profile={profile}
                    onComplete={async () => {
                        const p = await apiClient.getMyMentorProfile();
                        setProfile(p);
                        toast.success('Availability saved');
                    }}
                />
            </div>
        </div>
    );
}
