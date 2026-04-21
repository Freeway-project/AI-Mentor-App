'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, CheckCircle2, Upload, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { withCacheBust } from '@/lib/cache-bust-url';
import { appTheme } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';

interface VerificationStepProps {
  profile: any;
  onComplete: () => void;
}

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

export function VerificationStep({ profile, onComplete }: VerificationStepProps) {
  const [certs, setCerts] = useState<any[]>(profile?.certifications || []);
  const [certName, setCertName] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const certInputRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState<string>(profile?.introVideoUrl || '');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  // Webcam recording
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recorderMimeRef = useRef<string>('video/webm');

  const stopStream = useCallback((s: MediaStream | null) => {
    s?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    return () => {
      stopStream(stream);
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [stream, localPreviewUrl, stopStream]);

  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  const uploadVideoFile = async (file: File) => {
    setVideoLoading(true);
    setVideoProgress('Uploading… this may take a moment for large files');
    const toastId = toast.loading('Uploading intro video…');
    try {
      const { introVideoUrl: url } = await apiClient.uploadIntroVideo(file);
      setVideoUrl(withCacheBust(url));
      setRecordedBlob(null);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
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
    stopStream(stream);
    setStream(null);
    setRecordedBlob(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    await uploadVideoFile(file);
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

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
    } catch {
      toast.error('Could not access camera or microphone. Check browser permissions.');
    }
  };

  const stopCameraPreview = () => {
    stopStream(stream);
    setStream(null);
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch {
        /* noop */
      }
    }
    setMediaRecorder(null);
    setRecording(false);
  };

  const startRecording = () => {
    if (!stream) return;
    const mime = pickRecorderMime();
    recorderMimeRef.current = mime || 'video/webm';
    const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (ev) => {
      if (ev.data.size) chunksRef.current.push(ev.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || recorderMimeRef.current });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      stopStream(mr.stream);
      setStream(null);
      if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
      setMediaRecorder(null);
      setRecording(false);
    };
    mr.start();
    setMediaRecorder(mr);
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const uploadRecorded = async () => {
    if (!recordedBlob) return;
    const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const type = recordedBlob.type || 'video/webm';
    const file = new File([recordedBlob], `intro-recording-${Date.now()}.${ext}`, { type });
    await uploadVideoFile(file);
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await apiClient.updateMyMentorProfile({});
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to continue');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = cn(appTheme.input, 'text-sm py-2.5');
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider';
  const cardCls = 'rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3';

  const showServerVideo = !!videoUrl;
  const showLocalOnly = !videoUrl && !!localPreviewUrl && !!recordedBlob;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Verification</h2>
        <p className="mt-1 text-sm text-slate-600">
          Optionally upload certifications and an intro video to build trust with mentees.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <p className={labelCls}>
            Certifications <span className="normal-case font-normal text-slate-500">(optional)</span>
          </p>
          <p className="text-xs text-slate-500">PDF or image · max 10 MB each</p>
        </div>

        {certs.length > 0 && (
          <ul className="space-y-2">
            {certs.map((cert: any) => (
              <li
                key={cert.fileKey}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{cert.name}</p>
                    <a
                      href={cert.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand hover:underline"
                    >
                      View file
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCertDelete(cert.fileKey)}
                  disabled={certLoading}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={cardCls}>
          <p className="text-sm text-slate-600">Add a certification</p>
          <input
            type="text"
            value={certName}
            onChange={(e) => setCertName(e.target.value)}
            placeholder="Certification name (e.g. AWS Solutions Architect)"
            className={inputCls}
          />
          <div className="flex items-center gap-3">
            <input
              ref={certInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="hidden"
              onChange={(e) => setCertFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => certInputRef.current?.click()}
              className="flex-1 rounded-xl border border-dashed border-slate-300 py-2 text-center text-sm text-slate-600 transition-colors hover:border-brand/40 hover:text-slate-900"
            >
              {certFile ? certFile.name : 'Choose file (PDF or image)'}
            </button>
            <Button
              type="button"
              size="sm"
              disabled={certLoading || !certFile || !certName.trim()}
              onClick={handleCertUpload}
              className="bg-brand text-white hover:bg-brand-light"
            >
              {certLoading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200" />

      <section className="space-y-4">
        <div>
          <p className={labelCls}>
            Intro Video <span className="normal-case font-normal text-slate-500">(optional)</span>
          </p>
          <p className="text-xs text-slate-500">Upload a file (MP4, WebM or MOV · max 200 MB) or record with your camera.</p>
        </div>

        {showServerVideo ? (
          <div className="space-y-3">
            <div className="relative">
              <video
                src={videoUrl}
                controls
                className="w-full max-h-56 rounded-xl border border-slate-200 bg-slate-100"
              />
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-3 w-3" /> Uploaded
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                className="hidden"
                onChange={handleVideoChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={videoLoading}
                onClick={() => videoInputRef.current?.click()}
                className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
              >
                Replace video
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={videoLoading}
                onClick={handleVideoDelete}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                {videoLoading ? 'Removing…' : 'Remove'}
              </Button>
            </div>
          </div>
        ) : showLocalOnly ? (
          <div className="space-y-3">
            <video
              src={localPreviewUrl || undefined}
              controls
              className="w-full max-h-56 rounded-xl border border-slate-200 bg-slate-100"
            />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                size="sm"
                disabled={videoLoading}
                onClick={uploadRecorded}
                className="bg-brand text-white hover:bg-brand-light"
              >
                Upload this recording
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={videoLoading} onClick={discardRecording}>
                Discard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
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
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-500 transition-colors hover:border-brand/40 hover:text-slate-700 disabled:opacity-50"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm font-medium">{videoLoading ? 'Uploading…' : 'Click to upload intro video'}</span>
              {!videoLoading && <span className="text-xs text-slate-500">MP4, WebM or MOV · max 200 MB</span>}
            </button>
            {videoLoading && videoProgress ? (
              <p className="animate-pulse text-center text-xs text-slate-500">{videoProgress}</p>
            ) : null}

            <div className="relative flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Or record</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {!stream ? (
              <Button
                type="button"
                variant="outline"
                disabled={videoLoading}
                onClick={startCamera}
                className="w-full border-slate-200 bg-white"
              >
                <Mic className="mr-2 h-4 w-4" />
                Record with camera & microphone
              </Button>
            ) : (
              <div className={cn(cardCls, 'space-y-3')}>
                <video
                  ref={liveVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-56 rounded-xl border border-slate-200 bg-black object-cover"
                />
                <div className="flex flex-wrap gap-2">
                  {!recording ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={startRecording}
                        className="bg-brand text-white hover:bg-brand-light"
                      >
                        Start recording
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={stopCameraPreview}>
                        Cancel camera
                      </Button>
                    </>
                  ) : (
                    <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                      Stop recording
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleContinue}
          disabled={loading || certLoading || videoLoading}
          className="bg-brand text-white hover:bg-brand-light"
        >
          {loading ? 'Saving…' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
