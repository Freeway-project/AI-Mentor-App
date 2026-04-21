'use client';

import { useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Upload, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { withCacheBust } from '@/lib/cache-bust-url';
import { appTheme } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';

interface BasicsStepProps {
  profile: any;
  userAvatar?: string;
  onComplete: () => void;
  onAvatarChange?: (url: string) => void;
}

export function BasicsStep({ profile, userAvatar, onComplete, onAvatarChange }: BasicsStepProps) {
  const { refreshUser } = useAuth();
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string>(userAvatar || profile?.avatarUrl || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const toastId = toast.loading('Uploading photo…');
    try {
      const { avatarUrl: url } = await apiClient.uploadAvatar(file);
      const busted = withCacheBust(url);
      setAvatarUrl(busted);
      onAvatarChange?.(busted);
      await refreshUser();
      toast.success('Profile photo updated', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo', { id: toastId });
    } finally {
      setAvatarLoading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.updateMyMentorProfile({ headline, bio });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = cn(appTheme.input, 'text-sm py-2.5');
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">The basics</h2>
        <p className="mt-1 text-sm text-slate-600">Add a photo and introduce yourself to potential mentees.</p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => setError('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <p className={labelCls}>
            Profile Photo <span className="normal-case font-normal text-slate-500">(optional)</span>
          </p>
          <p className="text-xs text-slate-500">JPEG, PNG or WebP · max 5 MB</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 shadow-md">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Camera className="h-7 w-7" />
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={avatarLoading}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100"
            >
              <Upload className="h-5 w-5 text-white" />
            </button>
          </div>
          <div className="space-y-1.5">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={avatarLoading}
              onClick={() => avatarInputRef.current?.click()}
              className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            >
              {avatarLoading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            {avatarUrl ? <p className="text-xs text-emerald-600">✓ Photo uploaded</p> : null}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={inputCls}
            placeholder="e.g. Senior React Developer & Mentor"
            maxLength={200}
          />
        </div>

        <div>
          <label className={labelCls}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={inputCls}
            rows={5}
            placeholder="Share your background, experience, and what you can help with…"
            maxLength={1000}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-brand text-white hover:bg-brand-light">
          {loading ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </form>
    </div>
  );
}
