'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

function VerifyOtpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const email = searchParams.get('email') || user?.email || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) {
            router.push('/login');
        }
    }, [email, router]);

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-advance to next input
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (index > 0 && otp[index] === '') {
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        // Focus last filled input or next empty
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        const code = otp.join('');

        if (code.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        try {
            const isMentor = user?.roles?.includes('mentor') || false;
            const endpoint = isMentor ? '/mentor-auth/verify-otp' : '/auth/verify-otp';

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ type: 'email', code })
            });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error?.message || 'Verification failed');
            }

            // Refresh user context via getMe
            router.push(data.data.nextStep === 'onboarding' ? '/onboarding' : '/mentee/dashboard');

        } catch (err: any) {
            setError(err.message || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setMessage('');
        setResending(true);
        try {
            const isMentor = user?.roles?.includes('mentor') || false;
            const endpoint = isMentor ? '/mentor-auth/resend-otp' : '/auth/resend-otp';

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ type: 'email' })
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error?.message || 'Failed to resend code');
            }
            setMessage('A new code has been sent to your email.');
        } catch (err: any) {
            setError(err.message || 'Failed to resend code. Please try again later.');
        } finally {
            setResending(false);
        }
    };

    if (!email) return null;

    return (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
                <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-800">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white">Verify your email</h1>
                        <p className="mt-2 text-slate-400 text-sm">
                            We&apos;ve sent a 6-digit verification code to
                            <br />
                            <span className="font-medium text-white">{email}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="flex justify-center gap-2 sm:gap-4">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-950 text-white"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium"
                            disabled={loading || otp.join('').length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-slate-400">
                            Didn&apos;t receive the code?{' '}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending}
                                className="text-blue-400 hover:text-blue-300 hover:underline font-medium disabled:opacity-50"
                            >
                                {resending ? 'Sending...' : 'Click to resend'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyOtpContent />
        </Suspense>
    );
}
