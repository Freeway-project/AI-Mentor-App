import { cache } from 'react';
import type { Metadata } from 'next';
import type {
  MentorOffer,
  MentorProfilePageData,
  PublicMentorProfile,
} from '@/components/mentor-profile/types';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    message?: string;
  };
}

function getPublicApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
}

async function fetchPublicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${getPublicApiBaseUrl()}/api${path}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Failed request: ${path}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.success || !payload.data) {
    throw new Error(payload.error?.message || `Failed request: ${path}`);
  }

  return payload.data;
}

export const getMentorProfilePageData = cache(async (mentorId: string): Promise<MentorProfilePageData> => {
  const [mentor, offers] = await Promise.all([
    fetchPublicApi<PublicMentorProfile>(`/mentors/${mentorId}`),
    fetchPublicApi<MentorOffer[]>(`/mentors/${mentorId}/offers`),
  ]);

  return { mentor, offers };
});

export function buildMentorMetadata(mentor: PublicMentorProfile): Metadata {
  const title = mentor.headline
    ? `${mentor.name} | ${mentor.headline} | OWL Mentor`
    : `${mentor.name} | Mentor Profile | OWL Mentor`;

  const descriptionParts = [
    mentor.headline,
    mentor.bio,
    mentor.specialties?.length ? `Topics: ${mentor.specialties.slice(0, 4).join(', ')}` : null,
  ].filter(Boolean);

  const description = (descriptionParts.join(' ') || `Book a mentoring session with ${mentor.name} on OWL Mentor.`).slice(0, 155);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/mentors/${mentor.id}`;
  const keywords = [
    mentor.name,
    ...(mentor.specialties || []),
    ...(mentor.expertise || []).slice(0, 4),
    'mentor',
    'mentorship',
    'book mentor',
  ];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'profile',
      images: mentor.avatarUrl ? [{ url: mentor.avatarUrl, alt: mentor.name }] : undefined,
    },
    twitter: {
      card: mentor.avatarUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: mentor.avatarUrl ? [mentor.avatarUrl] : undefined,
    },
  };
}
