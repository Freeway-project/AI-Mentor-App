import { PlayCircle } from 'lucide-react';
import { AppPanel } from '@/components/ui/app-theme';

export function MentorProfileVideo({ videoUrl, mentorName }: { videoUrl: string; mentorName: string }) {
  return (
    <AppPanel id="intro-video" className="overflow-hidden p-0">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-2 text-brand-lighter">
          <PlayCircle className="h-4 w-4" />
          <p className="text-sm font-semibold uppercase tracking-[0.24em]">Intro Video</p>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Meet {mentorName} before you book
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Use the intro video to quickly understand communication style, focus areas, and whether this mentor feels like the right fit.
        </p>
      </div>

      <div className="aspect-video bg-slate-950">
        <video
          src={videoUrl}
          controls
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
    </AppPanel>
  );
}
