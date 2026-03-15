'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'mentee' | 'mentor'>('mentee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await register(email, password, name, role);

      if (response?.nextStep === 'verify-otp') {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else if (role === 'mentor') {
        router.push('/onboarding');
      } else {
        router.push('/mentee/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential, role);
      if (result.isNew && role === 'mentor') {
        router.push('/onboarding');
      } else if (role === 'mentor') {
        window.location.href = '/mentor/dashboard';
      } else {
        router.push('/mentee/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const isMentor = role === 'mentor';

  const content = (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--gradient-page)' }}
    >
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col relative overflow-hidden border-r border-white/[0.06]">
        {/* Glow */}
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
          <Link href="/" className="inline-flex items-center gap-2">
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
              Free to join · No credit card
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
              Start your journey<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
                towards mastery
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Whether you&apos;re here to learn or share expertise — you&apos;re in the right place.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-sm">
            {[
              { value: '500+', label: 'Expert Mentors' },
              { value: '2k+', label: 'Active Learners' },
              { value: '95%', label: 'Satisfaction' },
            ].map(({ value, label }) => (
              <div key={label} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
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

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[420px] space-y-6">

            {/* Heading */}
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
              <p className="text-slate-400 text-sm mt-1">Join thousands of learners and mentors</p>
            </div>

            {/* Role toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setRole('mentee')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  role === 'mentee'
                    ? 'bg-brand text-white shadow-md shadow-brand/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🎓</span> I want to learn
              </button>
              <button
                type="button"
                onClick={() => setRole('mentor')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  role === 'mentor'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🏆</span> I want to mentor
              </button>
            </div>

            {/* Google signup */}
            {googleClientId && (
              <div className="flex justify-center [&>div]:w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-up failed')}
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
                <span className="text-slate-500 text-xs font-medium shrink-0">or register with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-slate-600 focus:outline-none focus:border-brand/60 focus:bg-white/[0.08] transition-all text-sm"
                  placeholder="Your full name"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-slate-600 focus:outline-none focus:border-brand/60 focus:bg-white/[0.08] transition-all text-sm"
                    placeholder="Min 8 chars"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Confirm
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-slate-600 focus:outline-none focus:border-brand/60 focus:bg-white/[0.08] transition-all text-sm"
                    placeholder="Repeat it"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 font-semibold rounded-xl transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                  isMentor
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creating account...
                  </span>
                ) : `Join as ${isMentor ? 'Mentor' : 'Learner'} →`}
              </button>
            </form>

            <p className="text-center text-xs text-slate-600">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-slate-400 hover:text-slate-200 transition-colors">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-slate-400 hover:text-slate-200 transition-colors">Privacy Policy</Link>
            </p>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-lighter hover:text-brand-light font-medium transition-colors">
                Sign in
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
