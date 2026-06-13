import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MentorProfileBanner } from '@/components/mentor-profile/profile-banner';
import { MentorProfileVideo } from '@/components/mentor-profile/profile-video';
import { MentorProfileSections } from '@/components/mentor-profile/profile-sections';
import { MentorProfileStructuredData } from '@/components/mentor-profile/profile-structured-data';
import { getMentorProfilePageData, buildMentorMetadata } from '@/lib/public-mentor';
import { ED } from '@/components/mentor-profile/editorial-theme';

export const dynamic = 'force-dynamic';

const MentorProfileBookingPanel = nextDynamic(
  () =>
    import('@/components/mentor-profile/profile-booking-panel').then(
      (module) => module.MentorProfileBookingPanel
    ),
  {
    loading: () => (
      <div
        style={{
          background: ED.card,
          border: `1px solid ${ED.rule}`,
          padding: 28,
          position: 'sticky',
          top: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.4 }}>
          {[28, 8, 44, 120, 60].map((h, i) => (
            <div key={i} style={{ height: h, background: ED.rule }} />
          ))}
        </div>
      </div>
    ),
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
      title: 'Mentor Profile | Owl Mentors',
      description: 'Explore mentor details and book a session on Owl Mentors.',
    };
  }
}

export default async function MentorProfilePage({ params }: PageProps) {
  const { id } = await params;

  try {
    const { mentor, offers } = await getMentorProfilePageData(id);

    return (
      <div style={{ minHeight: '100vh', background: ED.cream, color: ED.ink }}>
        <MentorProfileStructuredData mentor={mentor} offers={offers} />
        <Navbar />

        <main>
          <div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              padding: '0 clamp(20px, 4vw, 48px)',
            }}
          >
            {/* Editorial hero */}
            <MentorProfileBanner mentor={mentor} offers={offers} />

            {/* Two-column: sections + sticky booking rail */}
            <div
              className="mentor-profile-grid"
              style={{ padding: 'clamp(28px, 4vw, 56px) 0 80px' }}
            >
              <div style={{ minWidth: 0 }}>
                {mentor.introVideoUrl ? (
                  <div style={{ marginBottom: 64 }}>
                    <MentorProfileVideo mentorName={mentor.name} videoUrl={mentor.introVideoUrl} />
                  </div>
                ) : null}
                <MentorProfileSections mentor={mentor} offers={offers} />
              </div>

              <aside>
                <MentorProfileBookingPanel
                  mentorId={mentor.id}
                  mentorName={mentor.name}
                  offers={offers}
                  hourlyRate={mentor.hourlyRate}
                  introVideoUrl={mentor.introVideoUrl}
                  calLink={mentor.calLink}
                />
              </aside>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  } catch {
    notFound();
  }
}
