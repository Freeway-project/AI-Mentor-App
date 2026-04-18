import type { ReactNode } from 'react';
import { BadgeCheck, Globe, Languages, MessageSquare, PlayCircle, Star, Users } from 'lucide-react';
import { AppPanel } from '@/components/ui/app-theme';
import { Badge } from '@/components/ui/badge';
import type { MentorOffer, PublicMentorProfile } from './types';

function formatTimezone(timezone?: string) {
  return timezone ? timezone.replace(/_/g, ' ').replace('/', ' / ') : null;
}

function getStartingPrice(offers: MentorOffer[], hourlyRate?: number) {
  if (offers.length > 0) {
    return Math.min(...offers.map(offer => offer.price));
  }
  return hourlyRate ?? null;
}

export function MentorProfileBanner({
  mentor,
  offers,
}: {
  mentor: PublicMentorProfile;
  offers: MentorOffer[];
}) {
  const startingPrice = getStartingPrice(offers, mentor.hourlyRate);
  const quickFacts = [
    mentor.rating
      ? {
          icon: <Star className="h-4 w-4 text-amber-500" />,
          label: `${mentor.rating.toFixed(1)} rating`,
          value: mentor.totalReviews > 0 ? `${mentor.totalReviews} reviews` : 'Top-rated mentor',
        }
      : null,
    mentor.totalMeetings > 0
      ? {
          icon: <Users className="h-4 w-4 text-brand" />,
          label: `${mentor.totalMeetings}+ sessions`,
          value: 'Real mentoring experience',
        }
      : null,
    mentor.languages?.length
      ? {
          icon: <Languages className="h-4 w-4 text-brand" />,
          label: mentor.languages.slice(0, 2).join(', '),
          value: mentor.languages.length > 2 ? `+${mentor.languages.length - 2} more languages` : 'Languages',
        }
      : null,
    mentor.availability?.timezone
      ? {
          icon: <Globe className="h-4 w-4 text-brand" />,
          label: formatTimezone(mentor.availability.timezone) || mentor.availability.timezone,
          value: 'Timezone',
        }
      : null,
  ].filter(Boolean) as Array<{ icon: ReactNode; label: string; value: string }>;

  return (
    <AppPanel className="relative overflow-hidden p-6 md:p-8 lg:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(124,58,237,0.06),_transparent_32%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[auto,1fr,18rem] lg:items-start">
        <div className="flex flex-col items-start gap-4">
          <div className="h-28 w-28 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.10)] md:h-32 md:w-32">
            {mentor.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mentor.avatarUrl} alt={mentor.name} className="h-full w-full object-cover" loading="eager" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand-light/10 text-4xl font-bold text-brand">
                {mentor.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {mentor.verified ? (
              <Badge className="gap-1.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified mentor
              </Badge>
            ) : null}
            {mentor.introVideoUrl ? (
              <a
                href="#intro-video"
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/20"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Watch intro
              </a>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand">
                Mentor Profile
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {mentor.name}
              </h1>
              {mentor.headline ? (
                <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
                  {mentor.headline}
                </p>
              ) : null}
            </div>

            {mentor.bio ? (
              <p className="max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
                {mentor.bio.length > 240 ? `${mentor.bio.slice(0, 240).trim()}...` : mentor.bio}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickFacts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  {fact.icon}
                  <p className="text-sm font-semibold text-slate-900">{fact.label}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">{fact.value}</p>
              </div>
            ))}
          </div>

          {mentor.specialties?.length ? (
            <div className="flex flex-wrap gap-2">
              {mentor.specialties.slice(0, 8).map((specialty) => (
                <Badge key={specialty} variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                  {specialty}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Booking Snapshot
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm text-slate-500">Starting from</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {startingPrice != null ? `$${startingPrice}` : 'Custom'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 text-brand" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Best for 1:1 mentorship</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose a session type, watch the intro if available, then book directly from the calendar rail.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="#booking-panel"
                className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-light"
              >
                Book a Session
              </a>
              {mentor.introVideoUrl ? (
                <a
                  href="#intro-video"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-transparent px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  Jump to Intro Video
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AppPanel>
  );
}
