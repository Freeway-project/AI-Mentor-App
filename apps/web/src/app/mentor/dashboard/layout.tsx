'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MentorSidebar } from '@/components/layout/MentorSidebar';
import { apiClient } from '@/lib/api-client';
import { appTheme } from '@/components/ui/app-theme';
import { Menu } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import Link from 'next/link';

export default function MentorDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [approvalStatus, setApprovalStatus] = useState<string>('pending');
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!user) { router.replace('/register'); return; }
        if (!user.emailVerified) { router.replace('/mentor/verify-otp'); return; }
        if (!user.roles.includes('mentor')) { router.replace('/'); return; }

        apiClient.getMyMentorProfile()
            .then((p) => {
                if (p.onboardingStep !== 'completed' && p.onboardingStep !== 'published') {
                    router.replace('/onboarding');
                    return;
                }
                setApprovalStatus(p.approvalStatus || 'pending');
                setProfileLoaded(true);
            })
            .catch(() => {
                router.replace('/onboarding');
            });
    }, [user, loading, router]);

    if (loading || !profileLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className={appTheme.spinner} />
            </div>
        );
    }

    if (!user?.emailVerified || !user?.roles.includes('mentor')) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <MentorSidebar
                approvalStatus={approvalStatus}
                isOpen={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
            />
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                {/* Mobile top bar */}
                <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-slate-200 bg-white shrink-0">
                    <button
                        onClick={() => setMobileNavOpen(true)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <Link href="/">
                        <BrandLogo markClassName="h-7 w-7" wordmarkClassName="text-[0.75rem] tracking-[0.2em]" />
                    </Link>
                </header>
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
