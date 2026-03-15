import type { MentorOffer, PublicMentorProfile } from './types';

export function MentorProfileStructuredData({
  mentor,
  offers,
}: {
  mentor: PublicMentorProfile;
  offers: MentorOffer[];
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const canonicalUrl = `${siteUrl}/mentors/${mentor.id}`;
  const lowestOffer = offers.length > 0 ? Math.min(...offers.map((offer) => offer.price)) : mentor.hourlyRate;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: mentor.name,
    description: mentor.headline || mentor.bio || `Mentor profile for ${mentor.name}`,
    image: mentor.avatarUrl || undefined,
    url: canonicalUrl,
    jobTitle: mentor.headline || undefined,
    knowsAbout: [...(mentor.specialties || []), ...(mentor.expertise || [])],
    inLanguage: mentor.languages,
    aggregateRating: mentor.rating && mentor.totalReviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: Number(mentor.rating.toFixed(1)),
      reviewCount: mentor.totalReviews,
    } : undefined,
    offers: lowestOffer != null ? {
      '@type': 'Offer',
      price: lowestOffer,
      priceCurrency: offers[0]?.currency || 'USD',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    } : undefined,
    subjectOf: mentor.introVideoUrl ? {
      '@type': 'VideoObject',
      name: `${mentor.name} intro video`,
      description: `Introduction video for ${mentor.name}`,
      contentUrl: mentor.introVideoUrl,
      embedUrl: mentor.introVideoUrl,
    } : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
