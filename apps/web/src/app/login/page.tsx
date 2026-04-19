'use client';

import { Suspense, useState } from 'react';
import nextDynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { setUser, setToken } from '@/store/slices/auth.slice';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { AppDispatch } from '@/store';
import { BrandLogoImage } from '@/components/brand/brand-logo';

const GoogleAuthButton = nextDynamic(
  () => import('@/components/auth/google-auth-button').then((module) => module.GoogleAuthButton),
  {
    ssr: false,
    loading: () => <div className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04]" />,
  }
);

function LoginForm() {
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
      const { user, token } = await ctxLogin(email, password);
      // Sync Redux state without a second API call
      dispatch(setUser(user as any));
      dispatch(setToken(token));

      if (user.roles.includes('admin')) {
        router.push('/admin');
      } else if (user.roles.includes('mentor')) {
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
      if (err?.code === 'EMAIL_NOT_VERIFIED') {
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
      style={{ background: 'var(--gradient-auth)' }}
    >
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col relative overflow-hidden bg-white/50 backdrop-blur-sm border-r border-slate-200">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 110%, rgba(160,120,48,0.10) 0%, transparent 70%)',
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 p-8 lg:p-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <BrandLogoImage className="h-16 w-16" />
          </Link>
        </div>

        {/* Center copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 lg:px-12 pb-16">
          <div className="space-y-6 max-w-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Trusted by 2,000+ learners
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
              Grow faster with<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-400">
                expert mentors
              </span>
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Get personalised 1-on-1 guidance from industry professionals who&apos;ve been where you want to go.
            </p>
          </div>

          {/* Testimonial */}
          <div className="mt-10 max-w-sm p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:border-brand/30 hover:shadow-md">
            <p className="text-slate-700 text-sm leading-relaxed italic">
              &ldquo;Within 3 months of working with my mentor I landed a senior engineering role at a FAANG company.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                A
              </div>
              <div>
                <p className="text-slate-900 text-sm font-semibold">Alex K.</p>
                <p className="text-slate-500 text-xs font-medium">Software Engineer, Google</p>
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
            <BrandLogoImage className="h-12 w-12" />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px] space-y-7">

            {/* Heading */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-slate-600 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            {/* Google login */}
            {googleClientId && (
              <GoogleAuthButton
                clientId={googleClientId}
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google sign-in failed')}
              />
            )}

            {googleClientId && (
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider shrink-0">or sign in with email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all text-sm shadow-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs font-medium text-brand hover:text-brand-light transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all text-sm shadow-sm"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand hover:bg-brand-light text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
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

            <p className="text-center text-sm text-slate-600 mt-6 md:mt-8">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand hover:text-brand-light font-bold transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return content;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
