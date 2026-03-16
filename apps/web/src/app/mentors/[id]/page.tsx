import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AppPageShell, AppPanel, appTheme } from '@/components/ui/app-theme';
import { MentorProfileBanner } from '@/components/mentor-profile/profile-banner';
import { MentorProfileVideo } from '@/components/mentor-profile/profile-video';
import { MentorProfileSections } from '@/components/mentor-profile/profile-sections';
import { MentorProfileStructuredData } from '@/components/mentor-profile/profile-structured-data';
import { getMentorProfilePageData, buildMentorMetadata } from '@/lib/public-mentor';

export const dynamic = 'force-dynamic';

const MentorProfileBookingPanel = nextDynamic(
  () =>
    import('@/components/mentor-profile/profile-booking-panel').then(
      (module) => module.MentorProfileBookingPanel
    ),
  {
    loading: () => {
      return (
        <AppPanel className="sticky top-24 p-5">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-28 rounded bg-slate-800" />
            <div className="h-8 w-48 rounded bg-slate-800" />
            <div className="h-16 rounded-2xl bg-slate-900/60" />
            <div className="h-16 rounded-2xl bg-slate-900/60" />
            <div className="h-16 rounded-2xl bg-slate-900/60" />
            <div className="h-40 rounded-2xl bg-slate-900/60" />
          </div>
        </AppPanel>
      );
    },
  }
);

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const { mentor } = await getMentorProfilePageData(id);
    return buildMentorMetadata(mentor);
  } catch {
    return {
      title: 'Mentor Profile | OWL Mentor',
      description: 'Explore mentor details and book a session on OWL Mentor.',
    };
  }
}

export default async function MentorProfilePage({ params }: PageProps) {
  const { id } = await params;

  try {
    const { mentor, offers } = await getMentorProfilePageData(id);

    return (
      <AppPageShell>
        <MentorProfileStructuredData mentor={mentor} offers={offers} />
        <Navbar />

        <main className={appTheme.content}>
          <div className="container mx-auto space-y-6 px-4 py-8 md:px-6 md:py-12">
            <MentorProfileBanner mentor={mentor} offers={offers} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),23rem] xl:grid-cols-[minmax(0,1fr),25rem]">
              <div className="space-y-6">
                {mentor.introVideoUrl ? (
                  <MentorProfileVideo mentorName={mentor.name} videoUrl={mentor.introVideoUrl} />
                ) : null}
                <MentorProfileSections mentor={mentor} />
              </div>

              <MentorProfileBookingPanel
                mentorId={mentor.id}
                mentorName={mentor.name}
                offers={offers}
                hourlyRate={mentor.hourlyRate}
                introVideoUrl={mentor.introVideoUrl}
              />
            </div>
          </div>
        </main>

        <Footer />
      </AppPageShell>
    );
  } catch {
    notFound();
  }
}
