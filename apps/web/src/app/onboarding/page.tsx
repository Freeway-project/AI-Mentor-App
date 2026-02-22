'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Navbar } from '@/components/layout/Navbar';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { OffersStep } from '@/components/onboarding/OffersStep';
import { PoliciesStep } from '@/components/onboarding/PoliciesStep';
import { AvailabilityStep } from '@/components/onboarding/AvailabilityStep';
import { ReviewStep } from '@/components/onboarding/ReviewStep';

const STEPS = ['profile', 'offers', 'policies', 'availability', 'review'] as const;
const STEP_LABELS = ['Profile', 'Offers', 'Policies', 'Availability', 'Review'];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    if (!user.emailVerified) {
      router.push('/mentor/verify-otp');
      return;
    }

    const loadProfile = async () => {
      try {
        // Try to get existing mentor profile
        const profile = await apiClient.getMyMentorProfile();
        setMentorProfile(profile);

        // Set step based on onboarding progress
        const stepIndex = STEPS.indexOf(profile.onboardingStep);
        if (stepIndex >= 0 && stepIndex < STEPS.length) {
          setCurrentStep(stepIndex);
        }

        if (profile.onboardingStep === 'published') {
          router.push('/browse');
        }
      } catch {
        // No mentor profile yet, create one
        try {
          const profile = await apiClient.becomeMentor();
          setMentorProfile(profile);
        } catch (err: any) {
          // Already has profile or other error
          if (err.message?.includes('already')) {
            const profile = await apiClient.getMyMentorProfile();
            setMentorProfile(profile);
          }
        }
      }
      setLoading(false);
    };

    loadProfile();
  }, [user, authLoading, router]);

  const refreshProfile = async () => {
    const profile = await apiClient.getMyMentorProfile();
    setMentorProfile(profile);
    return profile;
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="text-2xl font-bold mb-6">Set up your mentor profile</h1>

          {/* Progress stepper */}
          <div className="flex items-center mb-8">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <button
                  onClick={() => goToStep(i)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${i === currentStep
                      ? 'bg-blue-600 text-white'
                      : i < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                >
                  {i < currentStep ? '\u2713' : i + 1}
                </button>
                <span className={`ml-2 text-sm hidden sm:inline ${i === currentStep ? 'font-medium text-blue-600' : 'text-slate-500'
                  }`}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${i < currentStep ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-white rounded-lg border p-6">
            {currentStep === 0 && (
              <ProfileStep
                profile={mentorProfile}
                onComplete={async () => {
                  await refreshProfile();
                  goToStep(1);
                }}
              />
            )}
            {currentStep === 1 && (
              <OffersStep
                mentorId={mentorProfile?.id}
                onComplete={async () => {
                  await refreshProfile();
                  goToStep(2);
                }}
              />
            )}
            {currentStep === 2 && (
              <PoliciesStep
                mentorId={mentorProfile?.id}
                onComplete={async () => {
                  await refreshProfile();
                  goToStep(3);
                }}
              />
            )}
            {currentStep === 3 && (
              <AvailabilityStep
                profile={mentorProfile}
                onComplete={async () => {
                  await refreshProfile();
                  goToStep(4);
                }}
              />
            )}
            {currentStep === 4 && (
              <ReviewStep
                profile={mentorProfile}
                onPublish={async () => {
                  await apiClient.publishProfile();
                  router.push('/browse');
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
