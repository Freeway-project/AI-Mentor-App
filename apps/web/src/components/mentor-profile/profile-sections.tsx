import type { ReactNode } from 'react';
import { BookOpen, Clock3, Globe, Languages, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AppPanel } from '@/components/ui/app-theme';
import type { PublicMentorProfile } from './types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function SectionCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <AppPanel className="p-6">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-lighter">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </AppPanel>
  );
}

export function MentorProfileSections({ mentor }: { mentor: PublicMentorProfile }) {
  return (
    <div className="space-y-5">
      {mentor.bio ? (
        <SectionCard eyebrow="About" title="How this mentor can help">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300 md:text-base">
            {mentor.bio}
          </p>
        </SectionCard>
      ) : null}

      {mentor.expertise?.length ? (
        <SectionCard eyebrow="Focus Areas" title="What you can work on together">
          <div className="flex flex-wrap gap-2">
            {mentor.expertise.map((item) => (
              <Badge key={item} variant="outline" className="border-white/10 bg-slate-800/70 text-slate-200">
                {item}
              </Badge>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {mentor.languages?.length ? (
          <SectionCard eyebrow="Communication" title="Languages">
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <Languages className="mt-0.5 h-4 w-4 text-brand-lighter" />
                <div>
                  <p className="text-sm font-medium text-white">Sessions can happen in</p>
                  <p className="mt-1 text-sm text-slate-400">{mentor.languages.join(', ')}</p>
                </div>
              </div>

              {mentor.availability?.timezone ? (
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <Globe className="mt-0.5 h-4 w-4 text-brand-lighter" />
                  <div>
                    <p className="text-sm font-medium text-white">Primary timezone</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {mentor.availability.timezone.replace(/_/g, ' ').replace('/', ' / ')}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>
        ) : null}

        {mentor.specialties?.length ? (
          <SectionCard eyebrow="Best Fit" title="Popular mentoring topics">
            <div className="grid gap-3 sm:grid-cols-2">
              {mentor.specialties.slice(0, 6).map((specialty) => (
                <div key={specialty} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 text-brand-lighter" />
                    <div>
                      <p className="text-sm font-medium text-white">{specialty}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Strong fit for goal-focused 1:1 sessions in this area.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>

      {mentor.availability?.schedule?.length ? (
        <SectionCard eyebrow="Availability" title="Typical weekly schedule">
          <div className="grid gap-3 md:grid-cols-2">
            {mentor.availability.schedule.map((slot, index) => (
              <div key={`${slot.dayOfWeek}-${slot.startTime}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-brand-lighter" />
                  <div>
                    <p className="text-sm font-medium text-white">{DAYS[slot.dayOfWeek]}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Booking" title="What to expect">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: <BookOpen className="h-4 w-4 text-brand-lighter" />,
              title: 'Choose a session',
              copy: 'Pick the offer that matches your goal, scope, and budget.',
            },
            {
              icon: <Clock3 className="h-4 w-4 text-brand-lighter" />,
              title: 'Select a slot',
              copy: 'See live availability and reserve the best time without back-and-forth.',
            },
            {
              icon: <Sparkles className="h-4 w-4 text-brand-lighter" />,
              title: 'Get focused support',
              copy: 'Arrive with a goal and leave with next steps you can apply immediately.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-start gap-3">
                {item.icon}
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
