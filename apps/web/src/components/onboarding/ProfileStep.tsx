'use client';

import { useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, FileText, Video, X } from 'lucide-react';

interface ProfileStepProps {
  profile: any;
  userAvatar?: string;
  onComplete: () => void;
}

export function ProfileStep({ profile, userAvatar, onComplete }: ProfileStepProps) {
  // ── text fields ──────────────────────────────────────────────────────────
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [specialties, setSpecialties] = useState(profile?.specialties?.join(', ') || '');
  const [expertise, setExpertise] = useState(profile?.expertise?.join(', ') || '');
  const [languages, setLanguages] = useState(profile?.languages?.join(', ') || 'English');
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate?.toString() || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── avatar ───────────────────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState<string>(userAvatar || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const { avatarUrl: url } = await apiClient.uploadAvatar(file);
      setAvatarUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
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
    try {
      const { certifications } = await apiClient.uploadCertification(certFile, certName.trim());
      setCerts(certifications);
      setCertName('');
      setCertFile(null);
      if (certInputRef.current) certInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload certification');
    } finally {
      setCertLoading(false);
    }
  };

  const handleCertDelete = async (fileKey: string) => {
    setCertLoading(true);
    try {
      const result = await apiClient.deleteCertification(fileKey);
      setCerts(result.certifications);
    } catch (err: any) {
      setError(err.message || 'Failed to delete certification');
    } finally {
      setCertLoading(false);
    }
  };

  // ── intro video ──────────────────────────────────────────────────────────
  const [videoUrl, setVideoUrl] = useState<string>(profile?.introVideoUrl || '');
  const [videoLoading, setVideoLoading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoLoading(true);
    try {
      const { introVideoUrl: url } = await apiClient.uploadIntroVideo(file);
      setVideoUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
    } finally {
      setVideoLoading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleVideoDelete = async () => {
    setVideoLoading(true);
    try {
      await apiClient.deleteIntroVideo();
      setVideoUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to remove video');
    } finally {
      setVideoLoading(false);
    }
  };

  // ── save profile text fields ─────────────────────────────────────────────
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

  const inputCls = 'w-full px-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 text-white placeholder:text-slate-500';
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1';

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Profile photo ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-white">Profile Photo</h3>
          <p className="text-xs text-slate-500 mt-0.5">JPEG, PNG or WebP · max 5 MB</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <Upload className="w-6 h-6" />
              </div>
            )}
          </div>
          <div>
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
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {avatarLoading ? 'Uploading...' : avatarUrl ? 'Change photo' : 'Upload photo'}
            </Button>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-800" />

      {/* ── Text fields ───────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Profile Details</h3>
        </div>

        <div>
          <label className={labelCls}>Headline</label>
          <input type="text" value={headline} onChange={e => setHeadline(e.target.value)}
            className={inputCls} placeholder="e.g. Senior React Developer & Mentor" maxLength={200} />
        </div>

        <div>
          <label className={labelCls}>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)}
            className={inputCls} rows={4}
            placeholder="Share your background, experience, and what you can help with..."
            maxLength={1000} />
        </div>

        <div>
          <label className={labelCls}>Specialties (comma-separated)</label>
          <input type="text" value={specialties} onChange={e => setSpecialties(e.target.value)}
            className={inputCls} placeholder="e.g. React, TypeScript, System Design" />
        </div>

        <div>
          <label className={labelCls}>Expertise (comma-separated)</label>
          <input type="text" value={expertise} onChange={e => setExpertise(e.target.value)}
            className={inputCls} placeholder="e.g. Frontend, Full-stack, Cloud Architecture" />
        </div>

        <div>
          <label className={labelCls}>Languages (comma-separated)</label>
          <input type="text" value={languages} onChange={e => setLanguages(e.target.value)}
            className={inputCls} placeholder="e.g. English, Spanish" />
        </div>

        <div>
          <label className={labelCls}>Hourly Rate (USD)</label>
          <input type="number" min="0" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)}
            className={inputCls} placeholder="e.g. 50" />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </form>

      <div className="border-t border-slate-800" />

      {/* ── Certifications ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">Certifications</h3>
          <p className="text-xs text-slate-500 mt-0.5">PDF or image · max 10 MB each · optional</p>
        </div>

        {/* Existing certs */}
        {certs.length > 0 && (
          <ul className="space-y-2">
            {certs.map((cert: any) => (
              <li key={cert.fileKey}
                className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{cert.name}</p>
                    <a href={cert.fileUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline">View file</a>
                  </div>
                </div>
                <button
                  onClick={() => handleCertDelete(cert.fileKey)}
                  disabled={certLoading}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  aria-label="Delete certification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add new cert */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
          <p className="text-sm text-slate-400">Add a certification</p>
          <input
            type="text"
            value={certName}
            onChange={e => setCertName(e.target.value)}
            placeholder="Certification name (e.g. AWS Solutions Architect)"
            className={inputCls}
          />
          <div className="flex items-center gap-3">
            <input
              ref={certInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="hidden"
              onChange={e => setCertFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => certInputRef.current?.click()}
              className="flex-1 py-2 border border-dashed border-slate-600 rounded-lg text-sm text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors text-center"
            >
              {certFile ? certFile.name : 'Choose file (PDF or image)'}
            </button>
            <Button
              type="button"
              size="sm"
              disabled={certLoading || !certFile || !certName.trim()}
              onClick={handleCertUpload}
            >
              {certLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-800" />

      {/* ── Intro Video ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">Intro Video</h3>
          <p className="text-xs text-slate-500 mt-0.5">MP4, WebM or MOV · max 200 MB · optional</p>
        </div>

        {videoUrl ? (
          <div className="space-y-3">
            <video
              src={videoUrl}
              controls
              className="w-full max-h-64 rounded-xl bg-slate-800 border border-slate-700"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={videoLoading}
              onClick={handleVideoDelete}
              className="border-slate-700 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {videoLoading ? 'Removing...' : 'Remove video'}
            </Button>
          </div>
        ) : (
          <div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              className="hidden"
              onChange={handleVideoChange}
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={videoLoading}
              className="w-full py-8 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center gap-2 text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-colors disabled:opacity-50"
            >
              <Video className="w-8 h-8" />
              <span className="text-sm">{videoLoading ? 'Uploading video...' : 'Click to upload intro video'}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
