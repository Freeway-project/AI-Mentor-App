import { BookOpen } from 'lucide-react';
import type { MentorOffer, PublicMentorProfile } from './types';
import { ed, ED } from './editorial-theme';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function SectionHead({
  num,
  kicker,
  title,
}: {
  num: string;
  kicker: string;
  title: string;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={ed.sectionHead()}>
        <span style={ed.mono(11, ED.inkMuted)}>{num}</span>
        <span style={ed.mono(11, ED.inkMuted, { flex: 1, letterSpacing: '0.18em' })}>{kicker}</span>
      </div>
      <h2 style={ed.serif(40, ED.ink, { margin: '14px 0 0', lineHeight: 1.05, letterSpacing: -0.5 })}>
        {title}
      </h2>
    </div>
  );
}

function ExpertiseTag({ label, level }: { label: string; level?: string }) {
  const dot =
    level === 'Expert'
      ? ED.accent
      : level === 'Advanced'
        ? ED.accentDeep
        : ED.inkMuted;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px 6px 10px',
        border: `1px solid ${ED.rule}`,
        background: ED.card,
        fontFamily: 'Inter, sans-serif',
        fontSize: 12.5,
        color: ED.ink,
      }}
    >
      <span
        style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }}
      />
      {label}
    </span>
  );
}

function ServiceCard({ offer, index }: { offer: MentorOffer; index: number }) {
  return (
    <div
      style={{
        padding: 24,
        borderRight: `1px solid ${ED.rule}`,
        borderBottom: `1px solid ${ED.rule}`,
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 200,
      }}
    >
      <div style={ed.mono(10, ED.inkMuted)}>
        № {String(index + 1).padStart(2, '0')} · {offer.durationMinutes} MIN
      </div>
      <h3 style={ed.serif(30, ED.ink, { lineHeight: 1, letterSpacing: -0.5, margin: 0 })}>
        {offer.title}
      </h3>
      {offer.description && (
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 13.5,
            lineHeight: 1.55,
            color: ED.inkSoft,
            margin: 0,
            flex: 1,
          }}
        >
          {offer.description}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 6,
          gap: 12,
        }}
      >
        <span style={ed.serif(24, offer.price === 0 ? ED.accent : ED.ink)}>
          {offer.price === 0 ? 'Free' : `$${offer.price}`}
        </span>
        <a
          href="#booking-panel"
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: `1px solid ${ED.ink}`,
            color: ED.ink,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            letterSpacing: 0.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
          }}
        >
          Book →
        </a>
      </div>
    </div>
  );
}

export function MentorProfileSections({
  mentor,
  offers,
}: {
  mentor: PublicMentorProfile;
  offers?: MentorOffer[];
}) {
  const sectionNum = (() => {
    let n = 0;
    return () => `§ 0${++n}`;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 72 }}>
      {/* § About */}
      {mentor.bio && (
        <section>
          <SectionHead num={sectionNum()} kicker="About" title="How I can help you." />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 28,
            }}
          >
            {mentor.bio.split('\n\n').map((para, i) => (
              <p
                key={i}
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontWeight: 400,
                  fontSize: 19,
                  lineHeight: 1.45,
                  color: ED.inkSoft,
                  margin: 0,
                }}
              >
                {i === 0 && (
                  <span
                    style={{
                      fontFamily: '"Instrument Serif", serif',
                      fontSize: 64,
                      float: 'left',
                      lineHeight: 0.8,
                      marginRight: 10,
                      marginTop: 4,
                      color: ED.accent,
                    }}
                  >
                    {para.charAt(0)}
                  </span>
                )}
                {i === 0 ? para.slice(1) : para}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* § Expertise */}
      {(mentor.expertise?.length || mentor.specialties?.length) ? (
        <section>
          <SectionHead num={sectionNum()} kicker="Expertise" title="What I can help with." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(mentor.expertise || []).map((label) => (
              <ExpertiseTag key={label} label={label} level="Advanced" />
            ))}
            {(mentor.specialties || []).map((label) => (
              <ExpertiseTag key={label} label={label} />
            ))}
          </div>
        </section>
      ) : null}

      {/* § Services */}
      {offers && offers.length > 0 && (
        <section>
          <SectionHead num={sectionNum()} kicker="Sessions" title="How we can work together." />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              border: `1px solid ${ED.rule}`,
            }}
          >
            {offers.map((offer, i) => (
              <ServiceCard key={offer.id} offer={offer} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* § Availability schedule */}
      {mentor.availability?.schedule?.length ? (
        <section>
          <SectionHead num={sectionNum()} kicker="Availability" title="When we can meet." />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {mentor.availability.schedule.map((slot, i) => (
              <div
                key={`${slot.dayOfWeek}-${slot.startTime}-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 20,
                  padding: '18px 0',
                  borderBottom:
                    i < mentor.availability!.schedule.length - 1
                      ? `1px solid ${ED.rule}`
                      : 'none',
                  alignItems: 'baseline',
                }}
              >
                <div style={ed.mono(11, ED.inkMuted, { letterSpacing: '0.05em' })}>
                  {slot.startTime} — {slot.endTime}
                </div>
                <div style={ed.serif(22, ED.ink, { lineHeight: 1.1 })}>{DAYS[slot.dayOfWeek]}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* § Certifications */}
      {mentor.certifications?.length ? (
        <section>
          <SectionHead num={sectionNum()} kicker="Credentials" title="Certifications &amp; training." />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {mentor.certifications.map((cert, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'baseline',
                  padding: '16px 0',
                  borderBottom:
                    i < mentor.certifications!.length - 1 ? `1px solid ${ED.rule}` : 'none',
                }}
              >
                <BookOpen size={16} color={ED.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={ed.serif(20, ED.ink, { lineHeight: 1.2 })}>{cert.name}</div>
                </div>
                <div style={ed.mono(11, ED.inkMuted, { letterSpacing: '0.05em' })}>
                  {new Date(cert.uploadedAt).getFullYear()}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* § What to expect */}
      <section>
        <SectionHead num={sectionNum()} kicker="Process" title="What to expect." />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            border: `1px solid ${ED.rule}`,
          }}
        >
          {[
            {
              step: '01',
              title: 'Choose a session',
              body: 'Pick the format that matches your goal, scope, and budget.',
            },
            {
              step: '02',
              title: 'Select a slot',
              body: 'See live availability and reserve the best time without back-and-forth.',
            },
            {
              step: '03',
              title: 'Get focused support',
              body: 'Arrive with a goal and leave with next steps you can apply immediately.',
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                padding: 24,
                borderRight: `1px solid ${ED.rule}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={ed.mono(10, ED.inkMuted)}>№ {item.step}</div>
              <div style={ed.serif(22, ED.ink, { lineHeight: 1.1 })}>{item.title}</div>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: ED.inkSoft,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
