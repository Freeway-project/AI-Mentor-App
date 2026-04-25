'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient, MentorExtractedFields } from '@/lib/api-client';
import { Navbar } from '@/components/layout/Navbar';
import { BasicsStep } from '@/components/onboarding/BasicsStep';
import { ExpertiseStep } from '@/components/onboarding/ExpertiseStep';
import { VerificationStep } from '@/components/onboarding/VerificationStep';
import { OffersStep } from '@/components/onboarding/OffersStep';
import { AvailabilityStep } from '@/components/onboarding/AvailabilityStep';
import { ReviewStep } from '@/components/onboarding/ReviewStep';
import { TermsAcceptanceModal } from '@/components/onboarding/TermsAcceptanceModal';
import { AppPageShell } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';

const STEPS = ['basics', 'expertise', 'verification', 'offers', 'availability', 'review'] as const;
const STEP_LABELS = ['Basics', 'Expertise', 'Verification', 'Offers', 'Schedule', 'Review'];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [liveAvatar, setLiveAvatar] = useState<string>('');
  const [parsedFields, setParsedFields] = useState<MentorExtractedFields | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await apiClient.getMyMentorProfile().catch(() => null);

        if (profile) {
          setMentorProfile(profile);
          const stepIndex = STEPS.indexOf(profile.onboardingStep as (typeof STEPS)[number]);
          if (stepIndex >= 0) setCurrentStep(stepIndex);
          if (profile.onboardingStep === 'published') {
            router.push('/mentor/dashboard');
            return;
          }
        } else {
          try {
            const newProfile = await apiClient.becomeMentor();
            setMentorProfile(newProfile);
          } catch (err: any) {
            if (err.message?.includes('already')) {
              const existing = await apiClient.getMyMentorProfile();
              setMentorProfile(existing);
            }
          }
        }

        const termsKey = `owl-terms-accepted-${user.id}`;
        if (!localStorage.getItem(termsKey)) {
          setShowTermsModal(true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading, router]);

  const handleTermsAccepted = () => {
    if (user?.id) {
      localStorage.setItem(`owl-terms-accepted-${user.id}`, 'true');
    }
    setShowTermsModal(false);
  };

  const refreshProfile = async () => {
    const profile = await apiClient.getMyMentorProfile();
    setMentorProfile(profile);
    return profile;
  };

  const goToStep = (step: number) => setCurrentStep(step);

  if (authLoading || loading) {
    return (
      <AppPageShell>
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell>
      <Navbar />

      <TermsAcceptanceModal open={showTermsModal} onAccept={handleTermsAccepted} />

      <div className="relative z-10 flex w-full flex-1 py-10 pb-16">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Set up your mentor profile</h1>
            <p className="mt-2 text-sm text-slate-600">Complete each step to submit your profile for review</p>
          </div>

          <div className="mb-8 flex items-center">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold shadow-md transition-all',
                    i === currentStep &&
                      'bg-brand text-white shadow-brand/25 ring-2 ring-brand/40 ring-offset-2 ring-offset-[#faf8f4]',
                    i < currentStep && 'border border-emerald-300 bg-emerald-50 text-emerald-700',
                    i > currentStep && 'border border-slate-200 bg-white text-slate-400'
                  )}
                >
                  {i < currentStep ? '✓' : i + 1}
                </button>
                <span
                  className={cn(
                    'ml-2 hidden text-xs font-medium sm:inline',
                    i === currentStep && 'text-brand',
                    i < currentStep && 'text-emerald-600',
                    i > currentStep && 'text-slate-400'
                  )}
                >
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={cn('mx-3 h-px flex-1', i < currentStep ? 'bg-emerald-200' : 'bg-slate-200')}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:p-8">
            {currentStep === 0 && (
              <BasicsStep
                profile={mentorProfile}
                userAvatar={liveAvatar || user?.avatar || ''}
                onAvatarChange={setLiveAvatar}
                onParsedFields={setParsedFields}
                onComplete={async () => {
                  await refreshProfile();
                  goToStep(1);
                }}
              />
            )}
            {currentStep === 1 && (
              <ExpertiseStep
                profile={mentorProfile}
                prefillData={parsedFields}
                onComplete={async () => {
                  await refreshProfile();
                  goToStep(2);
                }}
              />
            )}
            {currentStep === 2 && (
              <VerificationStep
                profile={mentorProfile}
                onComplete={async () => {
                  await refreshProfile();
                  goToStep(3);
                }}
              />
            )}
            {currentStep === 3 && (
              <OffersStep
                mentorId={mentorProfile?.id}
                hourlyRate={mentorProfile?.hourlyRate}
                onComplete={async () => {
                  await refreshProfile();
                  goToStep(4);
                }}
              />
            )}
            {currentStep === 4 && (
              <AvailabilityStep
                profile={mentorProfile}
                onComplete={async () => {
                  await refreshProfile();
                  goToStep(5);
                }}
              />
            )}
            {currentStep === 5 && (
              <ReviewStep
                profile={mentorProfile}
                onPublish={async () => {
                  await apiClient.publishProfile();
                  router.push('/mentor/dashboard');
                }}
              />
            )}
          </div>
        </div>
      </div>
    </AppPageShell>
  );
}
