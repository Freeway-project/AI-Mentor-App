'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rocket, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiPost(endpoint: string, body: any, token: string) {
    const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
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
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-900 bg-white"
                />
            ))}
        </div>
    );
}

export default function MenteeVerifyOtpPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [done, setDone] = useState(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    useEffect(() => {
        if (!token) router.replace('/mentee/signup');
    }, [token, router]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const handleCode = async (code: string) => {
        if (!token) return;
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await apiPost('verify-otp', { type: 'email', code }, token);
            setSuccess('Email verified! Taking you in...');
            setDone(true);
            setTimeout(() => router.push('/browse'), 1500);
        } catch (err: any) {
            setError(err.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!token || resendCooldown > 0) return;
        setError('');
        try {
            await apiPost('resend-otp', { type: 'email' }, token);
            setResendCooldown(60);
            setSuccess('New code sent to your email');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to resend');
        }
    };

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
                    <p className="text-slate-600">Taking you to your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Rocket className="h-7 w-7 text-blue-600" />
                    <span className="text-2xl font-bold tracking-tight text-slate-900">OWLMentors</span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                            <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
                        <p className="mt-2 text-slate-500 text-sm">
                            We&apos;ve sent a 6-digit verification code to your email address
                        </p>
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
                        <OtpInput onComplete={handleCode} />

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
                                        onClick={handleResend}
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        Resend
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-400">
                        Wrong email?{' '}
                        <Link href="/mentee/signup" className="text-blue-600 hover:underline">
                            Go back
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
