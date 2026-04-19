'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Navbar } from '@/components/layout/Navbar';
import { BasicsStep } from '@/components/onboarding/BasicsStep';
import { ExpertiseStep } from '@/components/onboarding/ExpertiseStep';
import { VerificationStep } from '@/components/onboarding/VerificationStep';
import { OffersStep } from '@/components/onboarding/OffersStep';
import { AvailabilityStep } from '@/components/onboarding/AvailabilityStep';
import { ReviewStep } from '@/components/onboarding/ReviewStep';
import { TermsAcceptanceModal } from '@/components/onboarding/TermsAcceptanceModal';

const STEPS = ['basics', 'expertise', 'verification', 'offers', 'availability', 'review'] as const;
const STEP_LABELS = ['Basics', 'Expertise', 'Verification', 'Offers', 'Schedule', 'Review'];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const [profile, me] = await Promise.all([
          apiClient.getMyMentorProfile().catch(() => null),
          apiClient.getMe().catch(() => null),
        ]);

        if (me?.avatar) setUserAvatar(me.avatar);

        if (profile) {
          setMentorProfile(profile);
          const stepIndex = STEPS.indexOf(profile.onboardingStep as typeof STEPS[number]);
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

        // Show terms modal if the user has not accepted yet
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-brand/5 blur-[120px]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
      </div>

      <Navbar />

      <TermsAcceptanceModal open={showTermsModal} onAccept={handleTermsAccepted} />

      <div className="flex-1 relative z-10 w-full py-10 pb-16">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">Set up your mentor profile</h1>
            <p className="text-slate-400 mt-2 text-sm">Complete each step to submit your profile for review</p>
          </div>

          {/* Progress stepper */}
          <div className="flex items-center mb-8">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <button
                  onClick={() => goToStep(i)}
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all shadow-md ${
                    i === currentStep
                      ? 'bg-brand text-white shadow-brand/30 ring-2 ring-brand/40'
                      : i < currentStep
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : 'bg-slate-800/80 text-slate-500 border border-slate-700/60'
                  }`}
                >
                  {i < currentStep ? '✓' : i + 1}
                </button>
                <span className={`ml-2 text-xs hidden sm:inline font-medium ${
                  i === currentStep ? 'text-brand-light' : i < currentStep ? 'text-green-400' : 'text-slate-600'
                }`}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${i < currentStep ? 'bg-green-500/40' : 'bg-slate-700/60'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content card */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 md:p-8 shadow-2xl">
            {currentStep === 0 && (
              <BasicsStep
                profile={mentorProfile}
                userAvatar={userAvatar}
                onComplete={async () => { await refreshProfile(); goToStep(1); }}
              />
            )}
            {currentStep === 1 && (
              <ExpertiseStep
                profile={mentorProfile}
                onComplete={async () => { await refreshProfile(); goToStep(2); }}
              />
            )}
            {currentStep === 2 && (
              <VerificationStep
                profile={mentorProfile}
                onComplete={async () => { await refreshProfile(); goToStep(3); }}
              />
            )}
            {currentStep === 3 && (
              <OffersStep
                mentorId={mentorProfile?.id}
                onComplete={async () => { await refreshProfile(); goToStep(4); }}
              />
            )}
            {currentStep === 4 && (
              <AvailabilityStep
                profile={mentorProfile}
                onComplete={async () => { await refreshProfile(); goToStep(5); }}
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
    </div>
  );
}
