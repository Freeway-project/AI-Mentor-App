'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiPost(endpoint: string, body: any, token: string) {
  const res = await fetch(`${API_URL}/api/mentor-auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Request failed');
  return json.data;
}

function OtpInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[idx] = val.slice(-1);
    setDigits(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (next.every((d) => d !== '')) onComplete(next.join(''));
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      onComplete(text);
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-12 text-center text-xl font-bold border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      ))}
    </div>
  );
}

type Step = 'email' | 'phone' | 'done';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) router.replace('/mentor/signup');
  }, [token, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleCode = async (type: 'email' | 'phone', code: string) => {
    if (!token) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await apiPost('verify-otp', { type, code }, token);
      if (data.verified) {
        setSuccess(`${type === 'email' ? 'Email' : 'Phone'} verified!`);
        setTimeout(() => {
          setSuccess('');
          if (data.bothVerified) {
            setStep('done');
            setTimeout(() => router.push('/onboarding'), 1500);
          } else if (type === 'email') {
            setStep('phone');
          }
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (type: 'email' | 'phone') => {
    if (!token || resendCooldown > 0) return;
    setError('');
    try {
      await apiPost('resend-otp', { type }, token);
      setResendCooldown(60);
      setSuccess(`New code sent to your ${type}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend');
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Identity Verified!</h2>
          <p className="text-slate-600">Taking you to your profile setup...</p>
        </div>
      </div>
    );
  }

  const currentType = step;

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${currentType === 'email' ? 'bg-blue-100' : 'bg-purple-100'}`}>
              {currentType === 'email' ? (
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Verify your {currentType === 'email' ? 'email' : 'phone'}
            </h1>
            <p className="mt-2 text-slate-600">
              {currentType === 'email'
                ? "We've sent a 6-digit code to your email address"
                : "We've sent a 6-digit code to your phone number"}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center gap-1.5 text-sm ${step === 'email' ? 'text-blue-600 font-medium' : 'text-slate-400 line-through'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 'email' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step === 'email' ? '1' : '✓'}
              </span>
              Email
            </div>
            <span className="w-8 h-px bg-slate-300" />
            <div className={`flex items-center gap-1.5 text-sm ${step === 'phone' ? 'text-purple-600 font-medium' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 'phone' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
              Phone
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
              {success}
            </div>
          )}

          <div className="space-y-6">
            <OtpInput
              key={step}
              onComplete={(code) => handleCode(currentType, code)}
            />

            {loading && (
              <p className="text-center text-sm text-slate-500">Verifying...</p>
            )}

            <div className="text-center">
              <p className="text-sm text-slate-500">
                Didn&apos;t receive the code?{' '}
                {resendCooldown > 0 ? (
                  <span className="text-slate-400">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleResend(currentType)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Resend
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
