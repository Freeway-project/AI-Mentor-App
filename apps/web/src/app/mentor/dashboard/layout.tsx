'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MentorSidebar } from '@/components/layout/MentorSidebar';
import { apiClient } from '@/lib/api-client';

export default function MentorDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [approvalStatus, setApprovalStatus] = useState<string>('pending');
    const [profileLoaded, setProfileLoaded] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!user) { router.replace('/mentor/signup'); return; }
        if (!user.emailVerified) { router.replace('/mentor/verify-otp'); return; }
        if (!user.roles.includes('mentor')) { router.replace('/'); return; }

        apiClient.getMyMentorProfile()
            .then((p) => {
                // If onboarding not finished, force them to complete it
                if (p.onboardingStep !== 'completed') {
                    router.replace('/onboarding');
                    return;
                }
                setApprovalStatus(p.approvalStatus || 'pending');
                setProfileLoaded(true);
            })
            .catch(() => {
                // Fallback for errors or empty profile — push to onboarding
                router.replace('/onboarding');
            });
    }, [user, loading, router]);

    if (loading || !profileLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user?.emailVerified || !user?.roles.includes('mentor')) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-950">
            <MentorSidebar approvalStatus={approvalStatus} />
            <main className="flex-1 overflow-y-auto bg-slate-950">
                {children}
            </main>
        </div>
    );
}
