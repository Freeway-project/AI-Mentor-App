'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function MenteeVerifyOtpPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // In a real flow, you might pass the temporary token via query param or store it in localStorage 
        // during the interim step until OTP is verified.
        const tempToken = localStorage.getItem('auth_token');
        if (!tempToken) {
            router.push('/mentee/signup');
        } else {
            setToken(tempToken);
        }
    }, [router]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value !== '' && index < 5) {
            inputs.current[index + 1]?.focus();
        }
        setError('');
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            if (i < 6) newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        // Focus the next empty input or the last one
        const nextEmptyIndex = newOtp.findIndex(val => val === '');
        if (nextEmptyIndex !== -1) {
            inputs.current[nextEmptyIndex]?.focus();
        } else {
            inputs.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: 'email',
                    code,
                }),
            });

            const json = await res.json();
            if (!json.success) throw new Error(json.error?.message || 'Verification failed');

            // If successful, log them in properly and redirect
            login(token!);
            router.push('/browse');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError('');
        setResendSuccess(false);

        try {
            const res = await fetch(`${API_URL}/api/auth/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ type: 'email' }),
            });

            const json = await res.json();
            if (!json.success) throw new Error(json.error?.message || 'Failed to resend code');

            setResendSuccess(true);
            setTimeout(() => setResendSuccess(false), 5000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="flex flex-col items-center text-center space-y-4 mb-8">
                        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <Mail className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
                            <p className="text-slate-500 mt-2">
                                We've sent a 6-digit verification code to your email address.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputs.current[index] = el; }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-14 text-center text-2xl font-semibold border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            ))}
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 text-center font-medium bg-red-50 py-2 rounded-lg border border-red-100">
                                {error}
                            </p>
                        )}

                        {resendSuccess && (
                            <p className="text-sm text-green-600 text-center font-medium bg-green-50 py-2 rounded-lg border border-green-100">
                                A new code has been sent!
                            </p>
                        )}

                        <Button
                            className="w-full h-12 text-base"
                            onClick={handleVerify}
                            disabled={loading || otp.join('').length !== 6}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify Email
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-slate-500 mb-2">Didn't receive the code?</p>
                            <Button
                                variant="outline"
                                className="w-full text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-none"
                                onClick={handleResend}
                                disabled={resending || loading}
                            >
                                {resending ? 'Sending...' : 'Resend Code'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
