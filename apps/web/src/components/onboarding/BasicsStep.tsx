'use client';

import { useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Upload, Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface BasicsStepProps {
  profile: any;
  userAvatar?: string;
  onComplete: () => void;
}

export function BasicsStep({ profile, userAvatar, onComplete }: BasicsStepProps) {
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // avatar
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
      setAvatarUrl(url);
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

  const inputCls = 'w-full px-3 py-2.5 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-slate-800/60 text-white placeholder:text-slate-500 text-sm';
  const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">The basics</h2>
        <p className="text-sm text-slate-400 mt-1">Add a photo and introduce yourself to potential mentees.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Profile Photo */}
      <div className="space-y-3">
        <div>
          <p className={labelCls}>Profile Photo <span className="normal-case font-normal text-slate-600">(optional)</span></p>
          <p className="text-xs text-slate-600">JPEG, PNG or WebP · max 5 MB</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-slate-800/80 border-2 border-slate-700/60 overflow-hidden shadow-lg">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Camera className="w-7 h-7" />
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={avatarLoading}
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="space-y-1.5">
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
            <Button type="button" variant="outline" size="sm" disabled={avatarLoading} onClick={() => avatarInputRef.current?.click()} className="bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200">
              {avatarLoading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            {avatarUrl && <p className="text-xs text-green-400">✓ Photo uploaded</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700/50" />

      {/* Headline & Bio */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Headline</label>
          <input
            type="text"
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            className={inputCls}
            placeholder="e.g. Senior React Developer & Mentor"
            maxLength={200}
          />
        </div>

        <div>
          <label className={labelCls}>Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            className={inputCls}
            rows={5}
            placeholder="Share your background, experience, and what you can help with…"
            maxLength={1000}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
          {loading ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </form>
    </div>
  );
}
