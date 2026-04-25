'use client';

import { useRef, useState } from 'react';
import { apiClient, MentorExtractedFields } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Upload, Camera, X, FileText } from 'lucide-react';
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
  onParsedFields?: (fields: MentorExtractedFields) => void;
}

export function BasicsStep({ profile, userAvatar, onComplete, onAvatarChange, onParsedFields }: BasicsStepProps) {
  const { refreshUser } = useAuth();
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string>(userAvatar || profile?.avatarUrl || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedNote, setParsedNote] = useState('');
  const [parseError, setParseError] = useState('');

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

  const handleResumeUpload = async (file: File) => {
    setParsing(true);
    setParseError('');
    setParsedNote('');
    try {
      const { mentorFields } = await apiClient.parseResumeForProfile(file);
      if (mentorFields.headline) setHeadline(mentorFields.headline);
      if (mentorFields.bio) setBio(mentorFields.bio);
      onParsedFields?.(mentorFields);
      setParsedNote('Resume parsed — fields auto-filled. Review and edit as needed.');
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse resume');
    } finally {
      setParsing(false);
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

      {/* Resume upload to auto-fill */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Quick-fill from resume</p>
          <p className="text-xs text-slate-500 mt-0.5">Upload a PDF or DOCX — we&apos;ll auto-fill your headline, bio, and expertise</p>
        </div>
        <div
          onClick={() => resumeInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50/50 transition-colors bg-white"
        >
          {parsing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Parsing resume…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <FileText className="w-6 h-6 text-slate-300" />
              <p className="text-xs text-slate-500">Click to upload PDF or DOCX</p>
              <p className="text-xs text-slate-400">Max 15 MB · optional</p>
            </div>
          )}
        </div>
        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleResumeUpload(file);
            e.target.value = '';
          }}
        />
        {parsedNote && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            <span className="shrink-0">✓</span>
            {parsedNote}
          </div>
        )}
        {parseError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {parseError}
          </div>
        )}
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
