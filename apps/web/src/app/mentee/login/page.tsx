'use client';

import { useState } from 'react';
import nextDynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';

const GoogleAuthButton = nextDynamic(
  () => import('@/components/auth/google-auth-button').then((module) => module.GoogleAuthButton),
  {
    ssr: false,
    loading: () => <div className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50" />,
  }
);

export default function MenteeLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const routeAfterAuth = async () => {
    const me = await apiClient.getMe();

    if (me.roles.includes('admin')) {
      router.push('/admin');
      return;
    }

    if (me.roles.includes('mentor')) {
      try {
        const profile = await apiClient.getMyMentorProfile();
        window.location.href = profile.onboardingStep !== 'completed' ? '/onboarding' : '/mentor/dashboard';
      } catch {
        window.location.href = '/onboarding';
      }
      return;
    }

    router.push(redirect || '/mentee/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      await routeAfterAuth();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const { isNew } = await loginWithGoogle(credentialResponse.credential, 'mentee');
      if (isNew) {
        router.push('/mentee/dashboard');
        return;
      }
      await routeAfterAuth();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Rocket className="h-7 w-7 text-violet-600" />
          <span className="text-2xl font-bold tracking-tight">OWL Mentor</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Sign in to book sessions</h1>
            <p className="text-slate-500 text-sm mt-1">Access your sessions and connect with your mentor</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={set('password')}
                placeholder="Your password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 text-slate-900 bg-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-violet-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {googleClientId ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400 uppercase tracking-wide">
                  <span className="bg-white px-3">or continue with</span>
                </div>
              </div>

              <GoogleAuthButton
                clientId={googleClientId}
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed')}
              />
            </>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Google sign-in is unavailable until <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> is configured.
            </div>
          )}

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-violet-600 font-medium hover:underline">
              Sign up free
            </Link>
          </p>

          <p className="text-center text-sm text-slate-500">
            Are you a coach?{' '}
            <Link href="/login" className="text-violet-600 font-medium hover:underline">
              Coach login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
