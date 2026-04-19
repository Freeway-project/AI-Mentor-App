'use client';

import { useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, Video, CheckCircle2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface VerificationStepProps {
  profile: any;
  onComplete: () => void;
}

export function VerificationStep({ profile, onComplete }: VerificationStepProps) {
  // certifications
  const [certs, setCerts] = useState<any[]>(profile?.certifications || []);
  const [certName, setCertName] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const certInputRef = useRef<HTMLInputElement>(null);

  // intro video
  const [videoUrl, setVideoUrl] = useState<string>(profile?.introVideoUrl || '');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  // continue
  const [loading, setLoading] = useState(false);

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

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Empty update advances onboarding step from 'verification' to 'offers'
      await apiClient.updateMyMentorProfile({});
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to continue');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 bg-slate-800/60 text-white placeholder:text-slate-500 text-sm';
  const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Verification</h2>
        <p className="text-sm text-slate-400 mt-1">Optionally upload certifications and an intro video to build trust with mentees.</p>
      </div>

      {/* Certifications */}
      <section className="space-y-4">
        <div>
          <p className={labelCls}>Certifications <span className="normal-case font-normal text-slate-600">(optional)</span></p>
          <p className="text-xs text-slate-600">PDF or image · max 10 MB each</p>
        </div>

        {certs.length > 0 && (
          <ul className="space-y-2">
            {certs.map((cert: any) => (
              <li key={cert.fileKey} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{cert.name}</p>
                    <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-light hover:underline">View file</a>
                  </div>
                </div>
                <button
                  onClick={() => handleCertDelete(cert.fileKey)}
                  disabled={certLoading}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 space-y-3">
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
              className="flex-1 py-2 border border-dashed border-slate-600/60 rounded-xl text-sm text-slate-500 hover:border-brand/40 hover:text-slate-300 transition-colors text-center"
            >
              {certFile ? certFile.name : 'Choose file (PDF or image)'}
            </button>
            <Button
              type="button"
              size="sm"
              disabled={certLoading || !certFile || !certName.trim()}
              onClick={handleCertUpload}
              className="bg-brand hover:bg-brand text-white"
            >
              {certLoading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-700/50" />

      {/* Intro Video */}
      <section className="space-y-4">
        <div>
          <p className={labelCls}>Intro Video <span className="normal-case font-normal text-slate-600">(optional)</span></p>
          <p className="text-xs text-slate-600">MP4, WebM or MOV · max 200 MB</p>
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
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={videoLoading}
              className="w-full py-8 border-2 border-dashed border-slate-700/50 rounded-xl flex flex-col items-center gap-2 text-slate-500 hover:border-brand/30 hover:text-slate-400 transition-colors disabled:opacity-50"
            >
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

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleContinue}
          disabled={loading || certLoading || videoLoading}
          className="bg-brand hover:bg-brand text-white"
        >
          {loading ? 'Saving…' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
