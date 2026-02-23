'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { login } from '@/store/slices/auth.slice';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { AppDispatch } from '@/store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { login: ctxLogin, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update both auth-context (Navbar) and Redux store (admin/service layer)
      const result = await dispatch(login({ email, password })).unwrap();
      await ctxLogin(email, password);

      // Redirect based on role
      if (result.user.roles.includes('admin')) {
        router.push('/admin');
      } else if (result.user.roles.includes('mentor')) {
        window.location.href = '/mentor/dashboard';
      } else {
        router.push('/mentee/dashboard');
      }
    } catch (err: any) {
      // Handle unverified email — backend sends a token + nextStep in the error body
      if (err?.code === 'EMAIL_NOT_VERIFIED' || err?.message?.includes('verify your email')) {
        toast.error('Please verify your email first. A new code has been sent to your inbox.');
        // Store the token so the OTP page can use it
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
      await loginWithGoogle(credentialResponse.credential);
      router.push('/mentee/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
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
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="mt-2 text-slate-400 text-sm">Sign in to continue your journey</p>
          </div>



          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white bg-slate-950/50 placeholder:text-slate-500 transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {googleClientId && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/60" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-900 px-3 text-slate-500 rounded-full text-xs">Or continue with</span>
              </div>
            </div>
          )}

          {googleClientId && (
            <div className="flex justify-center [&>div]:w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google sign-in failed')}
                theme="filled_black"
                shape="rectangular"
              />
            </div>
          )}

          <p className="text-center text-sm text-slate-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 hover:underline font-medium transition-colors">
              Sign up
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
