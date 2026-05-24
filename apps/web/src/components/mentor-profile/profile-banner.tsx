import type { ReactNode } from 'react';
import { Star, MapPin, Globe, Clock, MessageSquare, ShieldCheck } from 'lucide-react';
import type { MentorOffer, PublicMentorProfile } from './types';
import { ed, ED } from './editorial-theme';

function Stars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={12}
          fill={i < filled ? ED.accent : 'none'}
          stroke={i < filled ? ED.accent : ED.rule}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function MetaItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={ed.mono(10, ED.inkMuted, { display: 'flex', alignItems: 'center', gap: 5 })}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: ED.ink, display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}

function getStartingPrice(offers: MentorOffer[], hourlyRate?: number) {
  if (offers.length > 0) return Math.min(...offers.map((o) => o.price));
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

  return (
    <section
      style={{
        background: ED.cream,
        borderBottom: `1px solid ${ED.rule}`,
        padding: '48px 0 40px',
      }}
    >
      <div className="mentor-hero-grid">
        {/* Portrait */}
        <div>
          <div
            style={{
              width: '100%',
              aspectRatio: '4/5',
              maxHeight: 340,
              overflow: 'hidden',
              border: `1px solid ${ED.rule}`,
              background: `repeating-linear-gradient(135deg, ${ED.accentTint} 0 10px, ${ED.creamDeep} 10px 20px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {mentor.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mentor.avatarUrl}
                alt={mentor.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: 72,
                  color: ED.ink,
                  letterSpacing: -2,
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                {mentor.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <p style={ed.mono(9.5, ED.inkMuted, { marginTop: 8 })}>
            FIG. 01 — {mentor.name.split(' ')[0].toUpperCase()}
          </p>
        </div>

        {/* Main content */}
        <div>
          {/* Accepting badge */}
          {mentor.isActive && (
            <div
              style={ed.mono(10.5, ED.marker, {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20,
              })}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: ED.marker,
                  flexShrink: 0,
                }}
              />
              Accepting new mentees
            </div>
          )}

          {/* Name */}
          <h1
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontWeight: 400,
              fontSize: 'clamp(44px, 6vw, 88px)',
              lineHeight: 0.95,
              letterSpacing: -3,
              color: ED.ink,
              margin: 0,
            }}
          >
            {mentor.name}
          </h1>

          {/* Verified badge */}
          {mentor.verified && (
            <div
              style={ed.mono(10.5, ED.marker, {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 12,
              })}
            >
              <ShieldCheck size={13} color={ED.marker} />
              Verified Mentor
            </div>
          )}

          {/* Title + headline */}
          {mentor.headline && (
            <p
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontStyle: 'italic',
                fontSize: 'clamp(18px, 2vw, 26px)',
                lineHeight: 1.3,
                color: ED.inkSoft,
                margin: '20px 0 0',
                maxWidth: 560,
              }}
            >
              {mentor.headline}
            </p>
          )}

          {/* Meta items */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 28,
              marginTop: 28,
              paddingTop: 20,
              borderTop: `1px solid ${ED.rule}`,
            }}
          >
            {mentor.rating ? (
              <MetaItem
                icon={<Star size={11} strokeWidth={1.3} color={ED.inkMuted} />}
                label="Rating"
              >
                <Stars value={mentor.rating} />
                <span style={{ marginLeft: 6 }}>
                  {mentor.rating.toFixed(1)}
                  {mentor.totalReviews > 0 && (
                    <span style={{ color: ED.inkMuted }}> ({mentor.totalReviews})</span>
                  )}
                </span>
              </MetaItem>
            ) : null}

            {mentor.availability?.timezone && (
              <MetaItem
                icon={<MapPin size={11} strokeWidth={1.3} color={ED.inkMuted} />}
                label="Timezone"
              >
                {mentor.availability.timezone.replace(/_/g, ' ').replace('/', ' / ')}
              </MetaItem>
            )}

            {mentor.languages?.length ? (
              <MetaItem
                icon={<Globe size={11} strokeWidth={1.3} color={ED.inkMuted} />}
                label="Languages"
              >
                {mentor.languages.join(' · ')}
              </MetaItem>
            ) : null}

            {startingPrice != null && (
              <MetaItem
                icon={<Clock size={11} strokeWidth={1.3} color={ED.inkMuted} />}
                label="Starting from"
              >
                <span style={{ color: ED.accent, fontFamily: '"Instrument Serif", serif', fontSize: 18 }}>
                  ${startingPrice}
                </span>
              </MetaItem>
            )}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <a
              href="#booking-panel"
              style={{
                padding: '13px 24px',
                background: ED.ink,
                color: ED.cream,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                letterSpacing: 0.1,
                textDecoration: 'none',
              }}
            >
              Book a session →
            </a>
            <a
              href="#booking-panel"
              style={{
                padding: '13px 24px',
                background: 'transparent',
                color: ED.ink,
                border: `1px solid ${ED.ink}`,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                letterSpacing: 0.1,
                textDecoration: 'none',
              }}
            >
              <MessageSquare size={14} />
              Send a message
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
