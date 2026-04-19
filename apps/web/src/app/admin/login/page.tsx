'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useDispatch } from 'react-redux';
import { setUser, setToken } from '@/store/slices/auth.slice';
import type { AppDispatch } from '@/store';
import { toast } from 'sonner';
import { BrandLogoImage } from '@/components/brand/brand-logo';

export default function AdminLoginPage() {
    const router = useRouter();
    const { login: ctxLogin, user, loading } = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const [form, setForm] = useState({ email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);

    // If already logged in as admin, go to dashboard
    useEffect(() => {
        if (!loading && user?.roles.includes('admin')) {
            router.replace('/admin');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Update both Redux store and auth-context so a refresh isn't needed
            const result = await dispatch(reduxLogin({ email: form.email, password: form.password })).unwrap();

            if (!result.user?.roles?.includes('admin')) {
                toast.error('Access denied: admin account required');
                apiClient.clearToken();
                return;
            }

            // Sync with Provider
            await ctxLogin(form.email, form.password);

            toast.success('Welcome, admin!');
            router.push('/admin');
        } catch (err: any) {
            toast.error(err.message || 'Invalid credentials');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo */}
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <BrandLogoImage className="h-36 w-36" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                        <p className="text-slate-400 text-sm mt-1">OWL Mentor administration</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            placeholder="admin@owlmentor.com"
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            required
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            placeholder="••••••••"
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {submitting ? 'Signing in...' : 'Sign in to Admin'}
                    </button>
                </form>

                <p className="text-center text-xs text-slate-600">
                    This portal is restricted to authorised administrators only.
                </p>
            </div>
        </div>
    );
}
