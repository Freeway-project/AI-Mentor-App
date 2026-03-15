'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { login } from '@/store/slices/auth.slice';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { AppDispatch } from '@/store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { login: ctxLogin, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      await ctxLogin(email, password);

      if (result.user.roles.includes('admin')) {
        router.push('/admin');
      } else if (result.user.roles.includes('mentor')) {
        try {
          const profile = await apiClient.getMyMentorProfile();
          window.location.href = profile.onboardingStep !== 'completed' ? '/onboarding' : '/mentor/dashboard';
        } catch {
          window.location.href = '/onboarding';
        }
      } else {
        router.push(redirect || '/mentee/dashboard');
      }
    } catch (err: any) {
      if (err?.code === 'EMAIL_NOT_VERIFIED' || err?.message?.includes('verify your email')) {
        toast.error('Please verify your email first. A new code has been sent to your inbox.');
        if (err?.data?.token) {
          localStorage.setItem('auth_token', err.data.token);
        }
        const isMentor = err?.data?.nextStep === 'mentor-verify-otp';
        window.location.href = isMentor ? '/mentor/verify-otp' : '/mentee/verify-otp';
        return;
      }
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const { isNew } = await loginWithGoogle(credentialResponse.credential);
      if (isNew) {
        toast.info('No account found. Please sign up and choose your role.');
        router.push('/register');
        return;
      }
      const me = await apiClient.getMe();
      if (me.roles.includes('admin')) {
        router.push('/admin');
      } else if (me.roles.includes('mentor')) {
        try {
          const profile = await apiClient.getMyMentorProfile();
          window.location.href = profile.onboardingStep !== 'completed' ? '/onboarding' : '/mentor/dashboard';
        } catch {
          window.location.href = '/onboarding';
        }
      } else {
        router.push(redirect || '/mentee/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const content = (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--gradient-page)' }}
    >
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col relative overflow-hidden border-r border-white/[0.06]">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 110%, rgba(124,58,237,0.28) 0%, transparent 70%)',
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 p-8 lg:p-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">OWL Mentor</span>
          </Link>
        </div>

        {/* Center copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 lg:px-12 pb-16">
          <div className="space-y-6 max-w-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Trusted by 2,000+ learners
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
              Grow faster with<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
                expert mentors
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Get personalised 1-on-1 guidance from industry professionals who've been where you want to go.
            </p>
          </div>

          {/* Testimonial */}
          <div className="mt-10 max-w-sm p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
            <p className="text-slate-300 text-sm leading-relaxed italic">
              "Within 3 months of working with my mentor I landed a senior engineering role at a FAANG company."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <div>
                <p className="text-white text-sm font-medium">Alex K.</p>
                <p className="text-slate-500 text-xs">Software Engineer, Google</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden p-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="text-white font-semibold">OWL Mentor</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px] space-y-7">

            {/* Heading */}
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
              <p className="text-slate-400 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            {/* Google login */}
            {googleClientId && (
              <div className="flex justify-center [&>div]:w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google sign-in failed')}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  text="continue_with"
                />
              </div>
            )}

            {googleClientId && (
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-slate-500 text-xs font-medium shrink-0">or sign in with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-slate-600 focus:outline-none focus:border-brand/60 focus:bg-white/[0.08] transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-brand-lighter hover:text-brand-light transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-slate-600 focus:outline-none focus:border-brand/60 focus:bg-white/[0.08] transition-all text-sm"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand-lighter hover:text-brand-light font-medium transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}
