'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';

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
      await loginWithGoogle(credentialResponse.credential);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const content = (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[120px]" />
      </div>

      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10 w-full relative z-10">
        <div className="w-full max-w-md space-y-6 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 p-8 rounded-2xl shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="mt-2 text-slate-400 text-sm">Start your mentoring journey</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white bg-slate-950/50 placeholder:text-slate-500 transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white bg-slate-950/50 placeholder:text-slate-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white bg-slate-950/50 placeholder:text-slate-500 transition-colors"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white bg-slate-950/50 placeholder:text-slate-500 transition-colors"
                placeholder="Repeat your password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Learner / Mentee */}
                <button
                  type="button"
                  onClick={() => setRole('mentee')}
                  className={`p-4 border rounded-xl text-left transition-all ${role === 'mentee'
                    ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'border-slate-800 bg-slate-950/50 hover:border-violet-500/50 hover:bg-slate-900/80'
                    }`}
                >
                  <div className={`text-xl mb-1`}>🎓</div>
                  <div className={`text-sm font-semibold ${role === 'mentee' ? 'text-violet-400' : 'text-white'}`}>
                    Learner
                  </div>
                  <div className={`text-xs mt-0.5 ${role === 'mentee' ? 'text-violet-500/80' : 'text-slate-500'}`}>
                    Find &amp; book a mentor
                  </div>
                </button>

                {/* Mentor / Coach */}
                <button
                  type="button"
                  onClick={() => setRole('mentor')}
                  className={`p-4 border rounded-xl text-left transition-all ${role === 'mentor'
                    ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : 'border-slate-800 bg-slate-950/50 hover:border-amber-500/50 hover:bg-slate-900/80'
                    }`}
                >
                  <div className={`text-xl mb-1`}>🏆</div>
                  <div className={`text-sm font-semibold ${role === 'mentor' ? 'text-amber-400' : 'text-white'}`}>
                    Mentor
                  </div>
                  <div className={`text-xs mt-0.5 ${role === 'mentor' ? 'text-amber-500/80' : 'text-slate-500'}`}>
                    Share your expertise
                  </div>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full ${role === 'mentor' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold' : 'bg-violet-600 hover:bg-violet-500 text-white font-medium'}`}
              disabled={loading}
            >
              {loading ? 'Creating account...' : `Join as ${role === 'mentor' ? 'Mentor' : 'Learner'}`}
            </Button>
          </form>

          {googleClientId && (
            <>
              <div className="relative mt-6 pt-2">
                <div className="absolute inset-0 flex items-center pt-2">
                  <div className="w-full border-t border-slate-800/60" />
                </div>
                <div className="relative flex justify-center text-sm pt-2">
                  <span className="bg-slate-900 px-3 text-slate-500 rounded-full text-xs">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center [&>div]:w-full mt-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-up failed')}
                  theme="filled_black"
                  shape="rectangular"
                />
              </div>
            </>
          )}

          <p className="text-center text-sm text-slate-400 mt-6 md:mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 hover:underline font-medium transition-colors">
              Sign in
            </Link>
          </p>
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
