'use client';

import { useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, FileText, Video, X, Camera, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { withCacheBust } from '@/lib/cache-bust-url';

interface ProfileStepProps {
  profile: any;
  userAvatar?: string;
  onComplete: () => void;
}

export function ProfileStep({ profile, userAvatar, onComplete }: ProfileStepProps) {
  const { refreshUser } = useAuth();
  // ── text fields ──────────────────────────────────────────────────────────
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [specialties, setSpecialties] = useState(profile?.specialties?.join(', ') || '');
  const [expertise, setExpertise] = useState(profile?.expertise?.join(', ') || '');
  const [languages, setLanguages] = useState(profile?.languages?.join(', ') || 'English');
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate?.toString() || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── avatar (optional) ────────────────────────────────────────────────────
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
      setAvatarUrl(withCacheBust(url));
      await refreshUser();
      toast.success('Profile photo updated', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo', { id: toastId });
    } finally {
      setAvatarLoading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ── certifications ───────────────────────────────────────────────────────
  const [certs, setCerts] = useState<any[]>(profile?.certifications || []);
  const [certName, setCertName] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const certInputRef = useRef<HTMLInputElement>(null);

  const handleCertUpload = async () => {
    if (!certFile || !certName.trim()) return;
    setCertLoading(true);
    const toastId = toast.loading(`Uploading "${certName.trim()}"…`);
    try {
      const { certifications } = await apiClient.uploadCertification(certFile, certName.trim());
      setCerts(certifications);
      setCertName('');
      setCertFile(null);
      if (certInputRef.current) certInputRef.current.value = '';
      toast.success('Certification uploaded', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload certification', { id: toastId });
    } finally {
      setCertLoading(false);
    }
  };

  const handleCertDelete = async (fileKey: string) => {
    setCertLoading(true);
    const toastId = toast.loading('Removing certification…');
    try {
      const result = await apiClient.deleteCertification(fileKey);
      setCerts(result.certifications);
      toast.success('Certification removed', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete certification', { id: toastId });
    } finally {
      setCertLoading(false);
    }
  };

  // ── intro video ──────────────────────────────────────────────────────────
  const [videoUrl, setVideoUrl] = useState<string>(profile?.introVideoUrl || '');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoLoading(true);
    setVideoProgress('Uploading… this may take a moment for large files');
    const toastId = toast.loading('Uploading intro video…');
    try {
      const { introVideoUrl: url } = await apiClient.uploadIntroVideo(file);
      setVideoUrl(url);
      setVideoProgress('');
      toast.success('Intro video uploaded', { id: toastId });
    } catch (err: any) {
      setVideoProgress('');
      toast.error(err.message || 'Failed to upload video', { id: toastId });
    } finally {
      setVideoLoading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleVideoDelete = async () => {
    setVideoLoading(true);
    const toastId = toast.loading('Removing video…');
    try {
      await apiClient.deleteIntroVideo();
      setVideoUrl('');
      toast.success('Intro video removed', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove video', { id: toastId });
    } finally {
      setVideoLoading(false);
    }
  };

  // ── save ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.updateMyMentorProfile({
        headline,
        bio,
        specialties: specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
        expertise: expertise.split(',').map((s: string) => s.trim()).filter(Boolean),
        languages: languages.split(',').map((s: string) => s.trim()).filter(Boolean),
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-slate-800/60 text-white placeholder:text-slate-500 text-sm';
  const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Profile Photo (optional) ───────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-white">
            Profile Photo <span className="text-xs font-normal text-slate-500 ml-1">(optional)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">JPEG, PNG or WebP · max 5 MB</p>
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
      </section>

      <div className="border-t border-slate-700/50" />

      {/* ── Profile Details ────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-base font-semibold text-white">Profile Details</h3>

        <div>
          <label className={labelCls}>Headline</label>
          <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} className={inputCls} placeholder="e.g. Senior React Developer & Mentor" maxLength={200} />
        </div>

        <div>
          <label className={labelCls}>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} className={inputCls} rows={4} placeholder="Share your background, experience, and what you can help with..." maxLength={1000} />
        </div>

        <div>
          <label className={labelCls}>Specialties <span className="normal-case font-normal text-slate-600">(comma-separated)</span></label>
          <input type="text" value={specialties} onChange={e => setSpecialties(e.target.value)} className={inputCls} placeholder="e.g. React, TypeScript, System Design" />
        </div>

        <div>
          <label className={labelCls}>Expertise <span className="normal-case font-normal text-slate-600">(comma-separated)</span></label>
          <input type="text" value={expertise} onChange={e => setExpertise(e.target.value)} className={inputCls} placeholder="e.g. Frontend, Full-stack, Cloud Architecture" />
        </div>

        <div>
          <label className={labelCls}>Languages <span className="normal-case font-normal text-slate-600">(comma-separated)</span></label>
          <input type="text" value={languages} onChange={e => setLanguages(e.target.value)} className={inputCls} placeholder="e.g. English, Spanish" />
        </div>

        <div>
          <label className={labelCls}>Hourly Rate (USD)</label>
          <input type="number" min="0" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className={inputCls} placeholder="e.g. 50" />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
          {loading ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </form>

      <div className="border-t border-slate-700/50" />

      {/* ── Certifications (optional) ──────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            Certifications <span className="text-xs font-normal text-slate-500 ml-1">(optional)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">PDF or image · max 10 MB each</p>
        </div>

        {certs.length > 0 && (
          <ul className="space-y-2">
            {certs.map((cert: any) => (
              <li key={cert.fileKey} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{cert.name}</p>
                    <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline">View file</a>
                  </div>
                </div>
                <button onClick={() => handleCertDelete(cert.fileKey)} disabled={certLoading} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 space-y-3">
          <p className="text-sm text-slate-400">Add a certification</p>
          <input type="text" value={certName} onChange={e => setCertName(e.target.value)} placeholder="Certification name (e.g. AWS Solutions Architect)" className={inputCls} />
          <div className="flex items-center gap-3">
            <input ref={certInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" className="hidden" onChange={e => setCertFile(e.target.files?.[0] || null)} />
            <button type="button" onClick={() => certInputRef.current?.click()}
              className="flex-1 py-2 border border-dashed border-slate-600/60 rounded-xl text-sm text-slate-500 hover:border-violet-500/40 hover:text-slate-300 transition-colors text-center">
              {certFile ? certFile.name : 'Choose file (PDF or image)'}
            </button>
            <Button type="button" size="sm" disabled={certLoading || !certFile || !certName.trim()} onClick={handleCertUpload} className="bg-violet-600 hover:bg-violet-700 text-white">
              {certLoading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-700/50" />

      {/* ── Intro Video (optional) ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            Intro Video <span className="text-xs font-normal text-slate-500 ml-1">(optional)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">MP4, WebM or MOV · max 200 MB</p>
        </div>

        {videoUrl ? (
          <div className="space-y-3">
            <div className="relative">
              <video src={videoUrl} controls className="w-full max-h-56 rounded-xl bg-slate-800/60 border border-slate-700/50" />
              <span className="absolute top-2 left-2 flex items-center gap-1 bg-green-900/80 text-green-400 text-xs font-medium px-2 py-1 rounded-full border border-green-700/50">
                <CheckCircle2 className="w-3 h-3" /> Uploaded
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" className="hidden" onChange={handleVideoChange} />
              <Button type="button" variant="outline" size="sm" disabled={videoLoading} onClick={() => videoInputRef.current?.click()} className="bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200">
                Replace video
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={videoLoading} onClick={handleVideoDelete} className="border-slate-700/60 text-red-400 hover:bg-red-900/20">
                <Trash2 className="w-4 h-4 mr-1.5" />
                {videoLoading ? 'Removing…' : 'Remove'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" className="hidden" onChange={handleVideoChange} />
            <button type="button" onClick={() => videoInputRef.current?.click()} disabled={videoLoading}
              className="w-full py-8 border-2 border-dashed border-slate-700/50 rounded-xl flex flex-col items-center gap-2 text-slate-500 hover:border-violet-500/30 hover:text-slate-400 transition-colors disabled:opacity-50">
              <Video className="w-8 h-8" />
              <span className="text-sm font-medium">{videoLoading ? 'Uploading…' : 'Click to upload intro video'}</span>
              {!videoLoading && <span className="text-xs text-slate-600">MP4, WebM or MOV · max 200 MB</span>}
            </button>
            {videoLoading && videoProgress && (
              <p className="text-xs text-slate-500 text-center animate-pulse">{videoProgress}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
